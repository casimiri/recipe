import React, { useState } from 'react';
import { View, Pressable, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n';
import { trEnum } from '../../i18n/enums';
import { rankByTaste } from '../../utils/taste';
import { matchesQuery } from '../../utils/search';
import { useApp } from '../../store/AppState';
import { Txt } from '../../components/Txt';
import { Icon } from '../../components/Icon';
import { Avatar, SectionHead, Dish, Tag } from '../../components/atoms';
import { RecipeCard } from '../../components/RecipeCard';
import { SearchBar, CategoryRow } from '../../components/Home';
import { DAYS } from '../../data/seed';
import type { MealSlot } from '../../data/types';

export default function Home() {
  const { t } = useTheme();
  const { tr, lang } = useI18n();
  const { recipes, byId, isSaved, toggleSave, unread, profile, diet, tastes, refresh, recentlyViewed, plan, recentSearches, addRecentSearch, clearRecentSearches } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [cat, setCat] = useState('popular');
  const [q, setQ] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  // Dietary preferences apply as a baseline filter across the feed.
  const pool = diet.length ? recipes.filter((r) => diet.every((d) => r.tags.includes(d))) : recipes;
  // Inline search: when the user types, the feed is replaced by live results.
  // Search spans the full catalog — the diet baseline only shapes the browse
  // feed (pool), not what you can find by searching.
  const searching = q.trim().length > 0;
  const queryResults = searching ? recipes.filter((r) => matchesQuery(r, q, lang)) : [];
  const openResult = (id: string) => { addRecentSearch(q); router.push(`/recipe/${id}`); };
  const list = cat === 'popular' ? pool : pool.filter((r) => r.cuisine === cat || r.meal === cat);
  // Tastes are a soft signal: float matching recipes up without hiding any.
  const shown = rankByTaste(list.length ? list : pool, tastes);
  const personalized = tastes.length > 0 && cat === 'popular';

  // pair recipes into rows of 2 for the grid
  const rows: typeof shown[] = [];
  for (let i = 0; i < shown.length; i += 2) rows.push(shown.slice(i, i + 2));

  const recent = recentlyViewed.map(byId).filter(Boolean) as NonNullable<ReturnType<typeof byId>>[];

  // Today's planned meals (JS getDay 0=Sun → the Mon…Sun plan keys).
  const todaySlots = plan[DAYS[(new Date().getDay() + 6) % 7]] || {};
  const todayMeals = (['breakfast', 'lunch', 'dinner'] as MealSlot[])
    .map((slot) => ({ slot, rec: todaySlots[slot] ? byId(todaySlots[slot]!) : undefined }))
    .filter((m) => m.rec) as { slot: MealSlot; rec: NonNullable<ReturnType<typeof byId>> }[];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 6, paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} colors={[t.accent]} />}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <Pressable onPress={() => router.push('/(tabs)/profile')}>
          <Avatar src={profile.avatar} size={46} t={t} />
        </Pressable>
        <Pressable onPress={() => router.push('/notifications')} style={{
          backgroundColor: t.surface2, width: 46, height: 46, borderRadius: 23,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon.bell size={21} sw={2} color={t.text} />
          {unread > 0 ? (
            <View style={{ position: 'absolute', top: 9, right: 11, width: 9, height: 9, borderRadius: 5, backgroundColor: t.accent, borderWidth: 2, borderColor: t.surface2 }} />
          ) : null}
        </Pressable>
      </View>

      <Txt style={{ fontSize: 14, color: t.muted, marginBottom: 4, fontWeight: '600' }}>{tr((s) => s.home.greeting, { name: profile.name.split(' ')[0] })}</Txt>
      <Txt style={{ fontWeight: '800', fontSize: 28, lineHeight: 33, color: t.text, marginBottom: 18 }}>
        {tr((s) => s.home.headlinePre)}<Txt style={{ color: t.accent, fontWeight: '800', fontSize: 28 }}>{tr((s) => s.home.headlineAccent)}</Txt>
      </Txt>

      <View style={{ marginBottom: 20 }}>
        <SearchBar t={t} value={q} onChange={setQ} onSubmit={() => { if (q.trim()) addRecentSearch(q); }}
          onFilter={() => router.push({ pathname: '/search', params: { filter: '1' } })} />
      </View>

      {searching ? (
        <View>
          <Txt style={{ fontSize: 13, color: t.muted, marginBottom: 14, fontWeight: '600' }}>{tr((s) => s.search.resultsCount, { count: queryResults.length })}</Txt>
          <View style={{ gap: 6 }}>
            {queryResults.map((r) => (
              <RecipeCard key={r.id} recipe={r} t={t} variant="compact" onOpen={openResult} onSave={toggleSave} saved={isSaved(r.id)} />
            ))}
            {queryResults.length === 0 ? <Txt style={{ textAlign: 'center', color: t.muted, paddingVertical: 40 }}>{tr((s) => s.search.noResults)}</Txt> : null}
          </View>
        </View>
      ) : (
      <>
      {recentSearches.length > 0 ? (
        <View style={{ marginBottom: 22 }}>
          <SectionHead title={tr((s) => s.search.recent)} action={tr((s) => s.common.clear)} onAction={clearRecentSearches} t={t} style={{ marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
            {recentSearches.map((rs) => <Tag key={rs} t={t} onPress={() => setQ(rs)}>{rs}</Tag>)}
          </View>
        </View>
      ) : null}

      {/* Today's plan */}
      <View style={{ marginBottom: 22 }}>
        <SectionHead title={tr((s) => s.home.today)} action={tr((s) => s.tabs.plan)} onAction={() => router.push('/(tabs)/planner')} t={t} style={{ marginBottom: 12 }} />
        {todayMeals.length > 0 ? (
          <View style={{ gap: 8 }}>
            {todayMeals.map(({ slot, rec }) => (
              <Pressable key={slot} onPress={() => router.push(`/recipe/${rec.id}`)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: t.radius, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}>
                <Dish src={rec.img} alt={rec.title} radius={t.radiusSm} style={{ width: 54, height: 54 }} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt style={{ fontSize: 11.5, fontWeight: '700', color: t.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tr((s) => s.planner[slot])}</Txt>
                  <Txt numberOfLines={1} style={{ fontWeight: '700', fontSize: 14.5, color: t.text }}>{rec.title}</Txt>
                </View>
                <Icon.chevR size={20} sw={2} color={t.faint} />
              </Pressable>
            ))}
          </View>
        ) : (
          <Pressable onPress={() => router.push('/(tabs)/planner')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: t.radius, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon.calendar size={20} sw={2} color={t.accent} />
            </View>
            <Txt style={{ flex: 1, fontSize: 14, color: t.muted }}>{tr((s) => s.home.nothingPlanned)}</Txt>
            <Icon.chevR size={20} sw={2} color={t.faint} />
          </Pressable>
        )}
      </View>

      {recent.length > 0 ? (
        <View style={{ marginBottom: 22 }}>
          <SectionHead title={tr((s) => s.home.recentlyViewed)} t={t} style={{ marginBottom: 12 }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}>
            {recent.map((rec) => (
              <Pressable key={rec.id} onPress={() => router.push(`/recipe/${rec.id}`)} style={{ width: 130 }}>
                <Dish src={rec.img} alt={rec.title} radius={t.radius} style={{ width: 130, height: 92, marginBottom: 6 }} />
                <Txt numberOfLines={1} style={{ fontWeight: '700', fontSize: 13, color: t.text }}>{rec.title}</Txt>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={{ marginBottom: 22 }}>
        <CategoryRow t={t} active={cat} onPick={setCat} />
      </View>

      <SectionHead
        title={personalized ? tr((s) => s.home.forYou) : cat === 'popular' ? tr((s) => s.home.popularRecipes) : tr((s) => s.home.categoryRecipes, { cat: trEnum(cat, lang) })}
        action={tr((s) => s.home.seeAll)}
        onAction={() => router.push({ pathname: '/search', params: { cat } })}
        t={t}
        style={{ marginBottom: 14 }}
      />

      {/* grid */}
      <View style={{ gap: 16 }}>
        {rows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 16 }}>
            {row.map((r) => (
              <View key={r.id} style={{ flex: 1 }}>
                <RecipeCard recipe={r} t={t} variant="overlay" onOpen={(id) => router.push(`/recipe/${id}`)} onSave={toggleSave} saved={isSaved(r.id)} />
              </View>
            ))}
            {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
          </View>
        ))}
      </View>
      </>
      )}
    </ScrollView>
  );
}
