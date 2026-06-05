import React, { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeProvider';
import { useApp } from '../store/AppState';
import { Txt } from '../components/Txt';
import { Icon } from '../components/Icon';
import { Dish } from '../components/atoms';
import { Screen, ScreenHeader } from '../components/Screen';
import { NOTIFICATIONS } from '../data/seed';

const ICONS: Record<string, keyof typeof Icon> = { cooked: 'forkknife', follow: 'user', save: 'bookmark', plan: 'calendar' };

export default function Notifications() {
  const { t } = useTheme();
  const { byId, markNotificationsRead } = useApp();
  const router = useRouter();

  useEffect(() => { markNotificationsRead(); }, []);

  return (
    <Screen>
      <ScreenHeader title="Notifications" onBack={() => router.back()} />
      <View style={{ gap: 4 }}>
        {NOTIFICATIONS.map((n) => {
          const I = Icon[ICONS[n.kind] || 'bell'];
          const r = n.recipe ? byId(n.recipe) : null;
          return (
            <Pressable key={n.id} onPress={() => r && router.push(`/recipe/${r.id}`)} style={{ flexDirection: 'row', gap: 13, alignItems: 'center', paddingVertical: 13, paddingHorizontal: 10, borderRadius: t.radiusSm + 4 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                <I size={20} sw={2} color={t.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 14.5, color: t.text, lineHeight: 20 }}>
                  <Txt style={{ fontWeight: '700', fontSize: 14.5 }}>{n.who}</Txt> {n.text}
                </Txt>
                <Txt style={{ fontSize: 12, color: t.faint, marginTop: 2 }}>{n.time} ago</Txt>
              </View>
              {r ? <Dish src={r.img} alt="" radius={10} style={{ width: 44, height: 44 }} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
