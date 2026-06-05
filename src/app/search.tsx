import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useApp } from '../store/AppState';
import { Txt } from '../components/Txt';
import { Icon } from '../components/Icon';
import { Dish, SectionHead, Tag, PrimaryButton, Sheet, Scrim } from '../components/atoms';
import { RecipeCard } from '../components/RecipeCard';
import { SearchBar } from '../components/Home';
import { CATEGORIES, FILTERS } from '../data/seed';

const TRENDING = ['Crepes', 'Chicken curry', 'Overnight oats', 'Matcha', 'Tacos'];

export default function Search() {
  const { t } = useTheme();
  const { recipes, isSaved, toggleSave } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ filter?: string; cat?: string }>();

  const [q, setQ] = useState(params.cat && params.cat !== 'popular' ? String(params.cat) : '');
  const [active, setActive] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(params.filter === '1');

  const toggle = (f: string) => setActive((a) => (a.includes(f) ? a.filter((x) => x !== f) : [...a, f]));

  const results = recipes.filter((r) => {
    const ql = q.toLowerCase();
    const matchQ = !q || r.title.toLowerCase().includes(ql) || r.cuisine.toLowerCase().includes(ql) || r.tags.some((tg) => tg.toLowerCase().includes(ql));
    const matchF = active.every((f) => r.tags.includes(f) || r.difficulty === f || r.meal === f);
    return matchQ && matchF;
  });

  const empty = !q && active.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18, paddingHorizontal: 20 }}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icon.back size={26} sw={2.2} color={t.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <SearchBar t={t} value={q} onChange={setQ} autoFocus onFilter={() => setShowFilter((s) => !s)} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {active.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {active.map((f) => <Tag key={f} t={t} active onPress={() => toggle(f)}>{`${f}  ✕`}</Tag>)}
          </View>
        ) : null}

        {empty ? (
          <View>
            <SectionHead title="Trending searches" t={t} style={{ marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 26 }}>
              {TRENDING.map((tr) => <Tag key={tr} t={t} onPress={() => setQ(tr)}>{tr}</Tag>)}
            </View>
            <SectionHead title="Browse by category" t={t} style={{ marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {CATEGORIES.filter((c) => c.id !== 'popular').map((c) => {
                const I = Icon[c.icon] || Icon.flame;
                const sample = recipes.find((r) => r.cuisine === c.id || r.meal === c.id);
                return (
                  <Pressable key={c.id} onPress={() => setQ(c.label)} style={{ width: '47.5%', height: 92, borderRadius: t.radius, overflow: 'hidden' }}>
                    <Dish src={sample?.img} alt={c.label} radius={t.radius} style={{ width: '100%', height: '100%' }} />
                    <Scrim colors={['rgba(0,0,0,0.38)', 'rgba(0,0,0,0.38)']} />
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14 }}>
                      <I size={20} sw={2} color="#fff" />
                      <Txt style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{c.label}</Txt>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          <View>
            <Txt style={{ fontSize: 13, color: t.muted, marginBottom: 14, fontWeight: '600' }}>{results.length} recipes</Txt>
            <View style={{ gap: 6 }}>
              {results.map((r) => (
                <RecipeCard key={r.id} recipe={r} t={t} variant="compact" onOpen={(id) => router.push(`/recipe/${id}`)} onSave={toggleSave} saved={isSaved(r.id)} />
              ))}
              {results.length === 0 ? <Txt style={{ textAlign: 'center', color: t.muted, paddingVertical: 40 }}>No recipes match those filters.</Txt> : null}
            </View>
          </View>
        )}
      </ScrollView>

      <Sheet open={showFilter} onClose={() => setShowFilter(false)} t={t} title="Filters">
        {Object.entries(FILTERS).map(([group, opts]) => (
          <View key={group} style={{ marginBottom: 18 }}>
            <Txt style={{ fontSize: 12.5, fontWeight: '700', color: t.muted, textTransform: 'capitalize', marginBottom: 9 }}>{group}</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {opts.map((o) => <Tag key={o} t={t} active={active.includes(o)} onPress={() => toggle(o)}>{o}</Tag>)}
            </View>
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <PrimaryButton t={t} ghost full onPress={() => setActive([])}>Clear all</PrimaryButton>
          <PrimaryButton t={t} full onPress={() => setShowFilter(false)}>{`Show ${results.length}`}</PrimaryButton>
        </View>
      </Sheet>
    </View>
  );
}
