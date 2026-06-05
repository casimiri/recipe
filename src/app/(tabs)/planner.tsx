import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useApp } from '../../store/AppState';
import { Txt } from '../../components/Txt';
import { Icon } from '../../components/Icon';
import { Dish, IconBtn, PrimaryButton, Sheet, StatChip } from '../../components/atoms';
import { DAYS } from '../../data/seed';
import type { MealSlot } from '../../data/types';

const MEALS: MealSlot[] = ['breakfast', 'lunch', 'dinner'];
const TODAY = 'Wed';

export default function Planner() {
  const { t } = useTheme();
  const { plan, addToPlan, byId, recipes } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [day, setDay] = useState(TODAY);
  const [picker, setPicker] = useState<{ day: string; meal: MealSlot } | null>(null);

  const dayPlan = plan[day] || {};
  const plannedCount = Object.values(plan).reduce((s, d) => s + Object.values(d).filter(Boolean).length, 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 6, paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <View>
          <Txt style={{ fontWeight: '800', fontSize: 27, color: t.text }}>Meal Plan</Txt>
          <Txt style={{ fontSize: 13.5, color: t.muted, marginTop: 3 }}>This week · {plannedCount} meals planned</Txt>
        </View>
        <IconBtn t={t} onPress={() => router.push('/(tabs)/grocery')} style={{ backgroundColor: t.accentSoft }}>
          <Icon.cart size={21} sw={2} color={t.accent} />
        </IconBtn>
      </View>

      {/* Week strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }} style={{ marginBottom: 22, marginHorizontal: -20, paddingHorizontal: 20 }}>
        {DAYS.map((d, i) => {
          const on = d === day;
          const filled = Object.values(plan[d] || {}).filter(Boolean).length;
          return (
            <Pressable key={d} onPress={() => setDay(d)} style={{ width: 52, paddingVertical: 12, borderRadius: 18, backgroundColor: on ? t.accent : t.surface2, alignItems: 'center', gap: 6 }}>
              <Txt style={{ fontSize: 11.5, fontWeight: '600', opacity: 0.7, color: on ? t.accentText : t.text }}>{d}</Txt>
              <Txt style={{ fontSize: 17, fontWeight: '800', color: on ? t.accentText : t.text }}>{8 + i}</Txt>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: filled ? (on ? t.accentText : t.accent) : 'transparent' }} />
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ gap: 16, marginBottom: 24 }}>
        {MEALS.map((m) => {
          const r = dayPlan[m] ? byId(dayPlan[m] as string) : null;
          return (
            <View key={m}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                <Txt style={{ fontWeight: '800', fontSize: 16, color: t.text, textTransform: 'capitalize' }}>{m}</Txt>
                <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
              </View>
              {r ? (
                <Pressable onPress={() => router.push(`/recipe/${r.id}`)} style={{ flexDirection: 'row', gap: 13, alignItems: 'center', padding: 10, borderRadius: t.radius, backgroundColor: t.surface, boxShadow: t.shadow, borderWidth: 1, borderColor: t.border }}>
                  <Dish src={r.img} alt={r.title} radius={t.radiusSm} style={{ width: 72, height: 72 }} />
                  <View style={{ flex: 1 }}>
                    <Txt style={{ fontWeight: '700', fontSize: 15, color: t.text, marginBottom: 4 }} numberOfLines={1}>{r.title}</Txt>
                    <View style={{ flexDirection: 'row', gap: 14 }}>
                      <StatChip icon={<Icon.clock size={14} sw={2.2} color={t.accent} />} value={`${r.time}m`} t={t} />
                      <StatChip icon={<Icon.flame size={14} color={t.accent} />} value={`${r.cal}`} label="cal" t={t} />
                    </View>
                  </View>
                  <Pressable onPress={() => addToPlan(day, m, null)} hitSlop={8} style={{ padding: 6 }}>
                    <Icon.x size={18} sw={2.2} color={t.faint} />
                  </Pressable>
                </Pressable>
              ) : (
                <Pressable onPress={() => setPicker({ day, meal: m })} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20, borderRadius: t.radius, borderWidth: 2, borderColor: t.borderStrong, borderStyle: 'dashed' }}>
                  <Icon.plus size={18} sw={2.5} color={t.muted} />
                  <Txt style={{ color: t.muted, fontSize: 14, fontWeight: '600' }}>Add {m}</Txt>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      <PrimaryButton t={t} full icon={<Icon.cart size={18} sw={2} color={t.accentText} />} onPress={() => router.push('/(tabs)/grocery')}>
        Generate grocery list
      </PrimaryButton>

      <Sheet open={!!picker} onClose={() => setPicker(null)} t={t} title={picker ? `Add to ${picker.meal}` : ''}>
        <View style={{ gap: 6 }}>
          {recipes.map((r) => (
            <Pressable key={r.id} onPress={() => { if (picker) addToPlan(picker.day, picker.meal, r.id); setPicker(null); }}
              style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 8, borderRadius: t.radiusSm }}>
              <Dish src={r.img} alt={r.title} radius={10} style={{ width: 56, height: 56 }} />
              <View style={{ flex: 1 }}>
                <Txt style={{ fontWeight: '700', fontSize: 14.5, color: t.text }}>{r.title}</Txt>
                <Txt style={{ fontSize: 12.5, color: t.muted }}>{r.cuisine} · {r.time} min</Txt>
              </View>
              <Icon.plus size={20} sw={2.5} color={t.accent} />
            </Pressable>
          ))}
        </View>
      </Sheet>
    </ScrollView>
  );
}
