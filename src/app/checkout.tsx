import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n';
import { useApp } from '../store/AppState';
import { Txt } from '../components/Txt';
import { Icon } from '../components/Icon';
import { Screen, ScreenHeader } from '../components/Screen';
import { PrimaryButton } from '../components/atoms';
import { withA } from '../theme/tokens';
import { GROCERY } from '../data/seed';

const STORES = [
  { name: 'Instacart', eta: '2 hr', fee: '$3.99', color: '#43B02A' },
  { name: 'Amazon Fresh', eta: 'Today, 6pm', fee: 'Free over $35', color: '#FF9900' },
  { name: 'Local Co-op', eta: 'Tomorrow', fee: '$5.00', color: '#6E56CF' },
];

type Store = (typeof STORES)[number];

export default function Checkout() {
  const { t } = useTheme();
  const { tr } = useI18n();
  const { groceryChecked, setGroceryChecked } = useApp();
  const router = useRouter();
  const allItems = GROCERY.flatMap((g) => g.items);
  const toBuy = allItems.filter((i) => !groceryChecked.includes(i.id));

  // After ordering we show a confirmation rather than silently bouncing home.
  const [placed, setPlaced] = useState<{ store: Store; count: number } | null>(null);

  const order = (store: Store) => {
    // Mark everything that was ordered as checked off the grocery list.
    const ids = toBuy.map((i) => i.id);
    setGroceryChecked([...new Set([...groceryChecked, ...ids])]);
    setPlaced({ store, count: ids.length });
  };

  if (placed) {
    return (
      <View style={{ flex: 1, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: `0 14px 40px ${withA(t.accent, 0.4)}` }}>
          <Icon.check size={48} sw={2.6} color={t.accentText} />
        </View>
        <Txt style={{ fontWeight: '800', fontSize: 28, color: t.text, marginBottom: 10 }}>{tr((s) => s.checkout.placed)}</Txt>
        <Txt style={{ fontSize: 15, color: t.muted, lineHeight: 22, textAlign: 'center', marginBottom: 32 }}>
          {placed.count === 1
            ? tr((s) => s.checkout.placedBodyOne, { store: placed.store.name, eta: placed.store.eta })
            : tr((s) => s.checkout.placedBody, { count: placed.count, store: placed.store.name, eta: placed.store.eta })}
        </Txt>
        <View style={{ width: '100%', gap: 12 }}>
          <PrimaryButton t={t} full onPress={() => router.replace('/(tabs)/grocery')}>{tr((s) => s.checkout.viewList)}</PrimaryButton>
          <PrimaryButton t={t} ghost full onPress={() => router.replace('/(tabs)')}>{tr((s) => s.checkout.backHome)}</PrimaryButton>
        </View>
      </View>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={tr((s) => s.checkout.title)} onBack={() => router.back()} />
      <View style={{ backgroundColor: t.surface2, borderRadius: t.radius, padding: 18, marginBottom: 24 }}>
        <Txt style={{ fontWeight: '700', fontSize: 15, color: t.text, marginBottom: 4 }}>{tr((s) => s.checkout.toDeliver, { count: toBuy.length })}</Txt>
        <Txt style={{ fontSize: 13, color: t.muted }}>{tr((s) => s.checkout.fromRecipes, { count: new Set(allItems.map((i) => i.from)).size })}</Txt>
      </View>
      <Txt style={{ fontSize: 13, fontWeight: '700', color: t.muted, marginBottom: 12 }}>{tr((s) => s.checkout.chooseStore)}</Txt>
      <View style={{ gap: 12 }}>
        {STORES.map((s) => (
          <Pressable key={s.name} disabled={toBuy.length === 0} onPress={() => order(s)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: t.radius, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, boxShadow: t.shadow, opacity: toBuy.length === 0 ? 0.5 : 1 }}>
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
        {toBuy.length === 0 ? (
          <Txt style={{ textAlign: 'center', color: t.muted, paddingVertical: 18 }}>{tr((s) => s.checkout.nothingToOrder)}</Txt>
        ) : null}
      </View>
    </Screen>
  );
}
