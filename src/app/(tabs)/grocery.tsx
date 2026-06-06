import React, { useState } from 'react';
import { View, Pressable, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n';
import { useApp } from '../../store/AppState';
import { Txt } from '../../components/Txt';
import { Icon } from '../../components/Icon';
import { IconBtn, PrimaryButton } from '../../components/atoms';
import type { GroceryAisle } from '../../data/types';

export default function Grocery() {
  const { t } = useTheme();
  const { tr } = useI18n();
  const { groceryAisles, groceryChecked, toggleGrocery, setGroceryChecked, groceryExtra, addGroceryItem, removeGroceryItem } = useApp();
  const extraIds = new Set(groceryExtra.map((g) => g.id));
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [groupBy, setGroupBy] = useState<'aisle' | 'recipe'>('aisle');
  const [adding, setAdding] = useState('');

  const allItems = [...groceryAisles.flatMap((g) => g.items), ...groceryExtra];
  const total = allItems.length;
  const doneCount = allItems.filter((i) => groceryChecked.includes(i.id)).length;

  let groups: GroceryAisle[];
  if (groupBy === 'recipe') {
    const byRec: Record<string, typeof allItems> = {};
    allItems.forEach((i) => { (byRec[i.from] = byRec[i.from] || []).push(i); });
    groups = Object.entries(byRec).map(([aisle, items]) => ({ aisle, items }));
  } else {
    groups = groceryExtra.length ? [...groceryAisles, { aisle: tr((s) => s.grocery.addedByYou), items: groceryExtra }] : groceryAisles;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 6, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <View>
          <Txt style={{ fontWeight: '800', fontSize: 27, color: t.text }}>{tr((s) => s.grocery.title)}</Txt>
          <Txt style={{ fontSize: 13.5, color: t.muted, marginTop: 3 }}>{tr((s) => s.grocery.itemsChecked, { done: doneCount, total })}</Txt>
        </View>
        <IconBtn t={t} onPress={() => router.push('/(tabs)')}><Icon.x size={20} sw={2.2} color={t.text} /></IconBtn>
      </View>

      <View style={{ height: 8, borderRadius: 999, backgroundColor: t.surface2, overflow: 'hidden', marginBottom: 16 }}>
        <View style={{ height: '100%', width: `${total ? (doneCount / total) * 100 : 0}%`, backgroundColor: t.accent, borderRadius: 999 }} />
      </View>

      <View style={{ flexDirection: 'row', gap: 6, backgroundColor: t.surface2, borderRadius: 999, padding: 4, marginBottom: 22, alignSelf: 'flex-start' }}>
        {(['aisle', 'recipe'] as const).map((k) => (
          <Pressable key={k} onPress={() => setGroupBy(k)} style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: groupBy === k ? t.surface : 'transparent', ...(groupBy === k ? { boxShadow: t.shadow } : {}) }}>
            <Txt style={{ fontSize: 13, fontWeight: '700', color: groupBy === k ? t.text : t.muted }}>{k === 'aisle' ? tr((s) => s.grocery.byAisle) : tr((s) => s.grocery.byRecipe)}</Txt>
          </Pressable>
        ))}
      </View>

      {total === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 6 }}>
          <Txt style={{ fontSize: 15, fontWeight: '700', color: t.text }}>{tr((s) => s.grocery.empty)}</Txt>
          <Txt style={{ fontSize: 13.5, color: t.muted, textAlign: 'center' }}>{tr((s) => s.grocery.emptyHint)}</Txt>
        </View>
      ) : null}

      {groups.map((g) => (
        <View key={g.aisle} style={{ marginBottom: 22 }}>
          <Txt style={{ fontSize: 12.5, fontWeight: '800', color: t.accent, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>{g.aisle}</Txt>
          {g.items.map((item) => {
            const on = groceryChecked.includes(item.id);
            return (
              <Pressable key={item.id} onPress={() => toggleGrocery(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border }}>
                <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: on ? 0 : 2, borderColor: t.borderStrong, backgroundColor: on ? t.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {on ? <Icon.check size={14} sw={3} color={t.accentText} /> : null}
                </View>
                <View style={{ flex: 1, opacity: on ? 0.42 : 1 }}>
                  <Txt style={{ fontSize: 15, fontWeight: '600', color: t.text, textDecorationLine: on ? 'line-through' : 'none' }}>{item.name}</Txt>
                  {groupBy === 'aisle' ? <Txt style={{ fontSize: 12, color: t.faint }}>{item.from}</Txt> : null}
                </View>
                {extraIds.has(item.id) ? (
                  <Pressable onPress={() => removeGroceryItem(item.id)} hitSlop={10} style={{ padding: 4 }}>
                    <Icon.x size={18} sw={2.2} color={t.faint} />
                  </Pressable>
                ) : (
                  <Txt style={{ fontSize: 13.5, color: t.muted, fontWeight: '600' }}>{item.qty}</Txt>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: t.borderStrong, borderStyle: 'dashed' }} />
        <TextInput value={adding} onChangeText={setAdding} placeholder={tr((s) => s.grocery.addPlaceholder)} placeholderTextColor={t.faint}
          onSubmitEditing={() => { if (adding.trim()) { addGroceryItem(adding); setAdding(''); } }}
          style={{ flex: 1, fontSize: 15, color: t.text, fontFamily: t.body, paddingVertical: 6 }} />
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <PrimaryButton t={t} ghost full onPress={() => setGroceryChecked([])}>{tr((s) => s.grocery.clearChecked)}</PrimaryButton>
        <PrimaryButton t={t} full icon={<Icon.cart size={18} sw={2} color={t.accentText} />} onPress={() => router.push('/checkout')}>{tr((s) => s.grocery.orderDelivery)}</PrimaryButton>
      </View>
    </ScrollView>
  );
}
