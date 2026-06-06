import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n';
import { trEnum } from '../i18n/enums';
import { useApp } from '../store/AppState';
import { Txt } from '../components/Txt';
import { Icon } from '../components/Icon';
import { Dish, SectionHead, Tag, PrimaryButton, Sheet, Scrim } from '../components/atoms';
import { RecipeCard } from '../components/RecipeCard';
import { SearchBar } from '../components/Home';
import { CATEGORIES, FILTERS } from '../data/seed';

export default function Search() {
  const { t } = useTheme();
  const { tr, lang } = useI18n();
  const { recipes, isSaved, toggleSave, diet, recentSearches, addRecentSearch, clearRecentSearches } = useApp();
  // Trending = the catalog's most-saved recipes, using their (localized) titles.
  const trending = [...recipes].sort((a, b) => b.saves - a.saves).slice(0, 6);
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
    const matchDiet = diet.every((d) => r.tags.includes(d));
    return matchQ && matchF && matchDiet;
  });

  const empty = !q && active.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18, paddingHorizontal: 20 }}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icon.back size={26} sw={2.2} color={t.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <SearchBar t={t} value={q} onChange={setQ} autoFocus onSubmit={() => addRecentSearch(q)} onFilter={() => setShowFilter((s) => !s)} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {active.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {active.map((f) => <Tag key={f} t={t} active onPress={() => toggle(f)}>{`${trEnum(f, lang)}  ✕`}</Tag>)}
          </View>
        ) : null}

        {empty ? (
          <View>
            {recentSearches.length > 0 ? (
              <>
                <SectionHead title={tr((s) => s.search.recent)} action={tr((s) => s.common.clear)} onAction={clearRecentSearches} t={t} style={{ marginBottom: 12 }} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 26 }}>
                  {recentSearches.map((rs) => <Tag key={rs} t={t} onPress={() => setQ(rs)}>{rs}</Tag>)}
                </View>
              </>
            ) : null}
            <SectionHead title={tr((s) => s.search.trending)} t={t} style={{ marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 26 }}>
              {trending.map((r) => <Tag key={r.id} t={t} onPress={() => setQ(r.title)}>{r.title}</Tag>)}
            </View>
            <SectionHead title={tr((s) => s.search.browse)} t={t} style={{ marginBottom: 12 }} />
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
                      <Txt style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{trEnum(c.label, lang)}</Txt>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          <View>
            <Txt style={{ fontSize: 13, color: t.muted, marginBottom: 14, fontWeight: '600' }}>{tr((s) => s.search.resultsCount, { count: results.length })}</Txt>
            <View style={{ gap: 6 }}>
              {results.map((r) => (
                <RecipeCard key={r.id} recipe={r} t={t} variant="compact" onOpen={(id) => { if (q.trim()) addRecentSearch(q); router.push(`/recipe/${id}`); }} onSave={toggleSave} saved={isSaved(r.id)} />
              ))}
              {results.length === 0 ? <Txt style={{ textAlign: 'center', color: t.muted, paddingVertical: 40 }}>{tr((s) => s.search.noResults)}</Txt> : null}
            </View>
          </View>
        )}
      </ScrollView>

      <Sheet open={showFilter} onClose={() => setShowFilter(false)} t={t} title={tr((s) => s.search.filters)}>
        {Object.entries(FILTERS).map(([group, opts]) => (
          <View key={group} style={{ marginBottom: 18 }}>
            <Txt style={{ fontSize: 12.5, fontWeight: '700', color: t.muted, textTransform: 'capitalize', marginBottom: 9 }}>{group}</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {opts.map((o) => <Tag key={o} t={t} active={active.includes(o)} onPress={() => toggle(o)}>{trEnum(o, lang)}</Tag>)}
            </View>
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <PrimaryButton t={t} ghost full onPress={() => setActive([])}>{tr((s) => s.common.clearAll)}</PrimaryButton>
          <PrimaryButton t={t} full onPress={() => setShowFilter(false)}>{tr((s) => s.search.showResults, { count: results.length })}</PrimaryButton>
        </View>
      </Sheet>
    </View>
  );
}
