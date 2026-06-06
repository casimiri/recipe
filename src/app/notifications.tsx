import React, { useEffect, useRef } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeProvider';
import { useApp } from '../store/AppState';
import { Txt } from '../components/Txt';
import { Icon } from '../components/Icon';
import { Dish } from '../components/atoms';
import { Screen, ScreenHeader } from '../components/Screen';
import { timeAgo } from '../utils/format';
import { NOTIFICATIONS } from '../data/seed';

const ICONS: Record<string, keyof typeof Icon> = { cooked: 'forkknife', follow: 'user', save: 'bookmark', plan: 'calendar' };

/** A normalized notification row (real reminder or seed social item). */
interface Row {
  id: string;
  kind: string;
  who: string;
  text: string;
  time: string;
  recipe?: string;
  unread?: boolean;
}

export default function Notifications() {
  const { t } = useTheme();
  const { byId, reminders, unread, markNotificationsRead } = useApp();
  const router = useRouter();

  // Reminders are newest-first and `unread` counts the newest ones, so the
  // first `unread` reminders are exactly the new-since-last-visit set. Snapshot
  // it at mount so the highlight stays put while viewing, then clear the badge
  // on the way out.
  const unreadAtMount = useRef(unread).current;
  useEffect(() => () => markNotificationsRead(), []);

  // Real app-generated reminders first (newest first), then the seed social feed.
  const rows: Row[] = [
    ...reminders.map((r, i) => ({ id: r.id, kind: r.kind, who: 'Recipe-Snap', text: r.text, time: timeAgo(r.at), recipe: r.recipe, unread: i < unreadAtMount })),
    ...NOTIFICATIONS.map((n) => ({ id: n.id, kind: n.kind, who: n.who, text: n.text, time: n.time, recipe: n.recipe })),
  ];

  return (
    <Screen>
      <ScreenHeader title="Notifications" onBack={() => router.back()} />
      <View style={{ gap: 4 }}>
        {rows.map((n) => {
          const I = Icon[ICONS[n.kind] || 'bell'];
          const r = n.recipe ? byId(n.recipe) : null;
          return (
            <Pressable key={n.id} onPress={() => r && router.push(`/recipe/${r.id}`)} style={{ flexDirection: 'row', gap: 13, alignItems: 'center', paddingVertical: 13, paddingHorizontal: 10, borderRadius: t.radiusSm + 4, backgroundColor: n.unread ? t.accentSoft : 'transparent' }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                <I size={20} sw={2} color={t.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 14.5, color: t.text, lineHeight: 20 }}>
                  <Txt style={{ fontWeight: '700', fontSize: 14.5 }}>{n.who}</Txt> {n.text}
                </Txt>
                <Txt style={{ fontSize: 12, color: t.faint, marginTop: 2 }}>{n.time === 'now' ? 'Just now' : `${n.time} ago`}</Txt>
              </View>
              {r ? <Dish src={r.img} alt="" radius={10} style={{ width: 44, height: 44 }} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
