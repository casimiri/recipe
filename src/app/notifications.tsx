import React, { useEffect, useRef } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n';
import type { UIStrings } from '../i18n/ui/en';
import { useApp } from '../store/AppState';
import type { AppReminder } from '../lib/repo';
import { Txt } from '../components/Txt';
import { Icon } from '../components/Icon';
import { Dish } from '../components/atoms';
import { Screen, ScreenHeader } from '../components/Screen';
import { timeAgo } from '../utils/format';

const ICONS: Record<AppReminder['kind'], keyof typeof Icon> = {
  cooked: 'forkknife', plan: 'calendar', save: 'bookmark', import: 'download', timer: 'timer', review: 'star',
};

// Localized text template for each activity kind (cook-timer carries its own text).
const TEMPLATE: Record<AppReminder['kind'], (s: UIStrings) => string> = {
  cooked: (s) => s.notifications.youCooked,
  plan: (s) => s.notifications.youPlanned,
  save: (s) => s.notifications.youSaved,
  import: (s) => s.notifications.youImported,
  timer: (s) => s.notifications.timerFinished,
  review: (s) => s.notifications.youReviewed,
};

export default function Notifications() {
  const { t } = useTheme();
  const { tr } = useI18n();
  const { byId, reminders, unread, markNotificationsRead } = useApp();
  const router = useRouter();

  // Reminders are newest-first and `unread` counts the newest ones, so the
  // first `unread` are the new-since-last-visit set. Snapshot at mount so the
  // highlight stays put while viewing, then clear the badge on the way out.
  const unreadAtMount = useRef(unread).current;
  useEffect(() => () => markNotificationsRead(), []);

  return (
    <Screen>
      <ScreenHeader title={tr((s) => s.notifications.title)} onBack={() => router.back()} />
      {reminders.length === 0 ? (
        <Txt style={{ textAlign: 'center', color: t.muted, paddingVertical: 50 }}>{tr((s) => s.notifications.empty)}</Txt>
      ) : null}
      <View style={{ gap: 4 }}>
        {reminders.map((n, i) => {
          const I = Icon[ICONS[n.kind] ?? 'bell'];
          const r = n.recipe ? byId(n.recipe) : null;
          // Cook-timer entries carry pre-rendered text; others derive from kind + recipe.
          const text = n.text ?? tr(TEMPLATE[n.kind], { title: r?.title ?? '' });
          const isNew = i < unreadAtMount;
          return (
            <Pressable key={n.id} onPress={() => r && router.push(`/recipe/${r.id}`)} style={{ flexDirection: 'row', gap: 13, alignItems: 'center', paddingVertical: 13, paddingHorizontal: 10, borderRadius: t.radiusSm + 4, backgroundColor: isNew ? t.accentSoft : 'transparent' }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                <I size={20} sw={2} color={t.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 14.5, color: t.text, lineHeight: 20 }}>{text}</Txt>
                <Txt style={{ fontSize: 12, color: t.faint, marginTop: 2 }}>{timeAgo(n.at) === 'now' ? tr((s) => s.common.justNow) : tr((s) => s.common.ago, { time: timeAgo(n.at) })}</Txt>
              </View>
              {r ? <Dish src={r.img} alt="" radius={10} style={{ width: 44, height: 44 }} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
