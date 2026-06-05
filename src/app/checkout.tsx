import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeProvider';
import { useApp } from '../store/AppState';
import { Txt } from '../components/Txt';
import { Icon } from '../components/Icon';
import { Screen, ScreenHeader } from '../components/Screen';
import { withA } from '../theme/tokens';
import { GROCERY } from '../data/seed';

const STORES = [
  { name: 'Instacart', eta: '2 hr', fee: '$3.99', color: '#43B02A' },
  { name: 'Amazon Fresh', eta: 'Today, 6pm', fee: 'Free over $35', color: '#FF9900' },
  { name: 'Local Co-op', eta: 'Tomorrow', fee: '$5.00', color: '#6E56CF' },
];

export default function Checkout() {
  const { t } = useTheme();
  const { groceryChecked } = useApp();
  const router = useRouter();
  const allItems = GROCERY.flatMap((g) => g.items);
  const toBuy = allItems.filter((i) => !groceryChecked.includes(i.id));

  return (
    <Screen>
      <ScreenHeader title="Order groceries" onBack={() => router.back()} />
      <View style={{ backgroundColor: t.surface2, borderRadius: t.radius, padding: 18, marginBottom: 24 }}>
        <Txt style={{ fontWeight: '700', fontSize: 15, color: t.text, marginBottom: 4 }}>{toBuy.length} items to deliver</Txt>
        <Txt style={{ fontSize: 13, color: t.muted }}>From {new Set(allItems.map((i) => i.from)).size} recipes in your plan</Txt>
      </View>
      <Txt style={{ fontSize: 13, fontWeight: '700', color: t.muted, marginBottom: 12 }}>Choose a store</Txt>
      <View style={{ gap: 12 }}>
        {STORES.map((s) => (
          <Pressable key={s.name} onPress={() => router.replace('/(tabs)')} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: t.radius, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, boxShadow: t.shadow }}>
            <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: withA(s.color, 0.15), alignItems: 'center', justifyContent: 'center' }}>
              <Icon.cart size={22} sw={2} color={s.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '700', fontSize: 15, color: t.text }}>{s.name}</Txt>
              <Txt style={{ fontSize: 12.5, color: t.muted }}>{s.eta} · {s.fee}</Txt>
            </View>
            <Icon.chevR size={20} sw={2} color={t.faint} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
