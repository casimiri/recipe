import React from 'react';
import { View, Pressable } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n';
import type { UIStrings } from '../../i18n/ui/en';
import { Txt } from '../../components/Txt';
import { Icon } from '../../components/Icon';
import type { Tokens } from '../../theme/tokens';

const ITEMS: { name: string; label: keyof UIStrings['tabs']; icon: keyof typeof Icon; iconFill: keyof typeof Icon }[] = [
  { name: 'index', label: 'home', icon: 'home', iconFill: 'homeFill' },
  { name: 'cookbooks', label: 'cookbooks', icon: 'book', iconFill: 'bookFill' },
  { name: 'planner', label: 'plan', icon: 'calendar', iconFill: 'calendarFill' },
  { name: 'grocery', label: 'list', icon: 'cart', iconFill: 'cartFill' },
];

interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
}

function PillTabBar({ state, navigation }: TabBarProps) {
  const { t } = useTheme() as { t: Tokens };
  const { tr } = useI18n();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const currentName = state.routes[state.index]?.name;

  const Item = ({ cfg }: { cfg: (typeof ITEMS)[number] }) => {
    const on = currentName === cfg.name;
    const I = Icon[on ? cfg.iconFill : cfg.icon];
    return (
      <Pressable
        key={cfg.name}
        onPress={() => navigation.navigate(cfg.name)}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 7,
          paddingVertical: 11, paddingHorizontal: on ? 16 : 11, borderRadius: 999,
          backgroundColor: on ? t.accent : 'transparent',
        }}>
        <I size={22} sw={2} color={on ? t.accentText : t.muted} />
        {on ? <Txt style={{ fontSize: 13.5, fontWeight: '700', color: t.accentText }}>{tr((s) => s.tabs[cfg.label])}</Txt> : null}
      </Pressable>
    );
  };

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 12), backgroundColor: t.bg }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6,
        backgroundColor: t.elevated, borderRadius: 999, padding: 7,
        boxShadow: t.shadowLg, borderWidth: 1, borderColor: t.border,
      }}>
        <Item cfg={ITEMS[0]} />
        <Item cfg={ITEMS[1]} />
        <Pressable onPress={() => router.push('/import')} style={{
          width: 50, height: 50, borderRadius: 25, backgroundColor: t.accent,
          alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 16px ${t.withA(t.accent, 0.4)}`,
        }}>
          <Icon.plus size={24} sw={2.5} color={t.accentText} />
        </Pressable>
        <Item cfg={ITEMS[2]} />
        <Item cfg={ITEMS[3]} />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <PillTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="cookbooks" />
      <Tabs.Screen name="planner" />
      <Tabs.Screen name="grocery" />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
