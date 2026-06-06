import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n';
import { trEnum } from '../../i18n/enums';
import { useApp } from '../../store/AppState';
import { Txt } from '../../components/Txt';
import { Icon } from '../../components/Icon';
import { Avatar, SectionHead } from '../../components/atoms';
import { RecipeCard } from '../../components/RecipeCard';
import { SearchBar, CategoryRow } from '../../components/Home';

export default function Home() {
  const { t } = useTheme();
  const { tr, lang } = useI18n();
  const { recipes, isSaved, toggleSave, unread, profile, diet } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [cat, setCat] = useState('popular');

  // Dietary preferences apply as a baseline filter across the feed.
  const pool = diet.length ? recipes.filter((r) => diet.every((d) => r.tags.includes(d))) : recipes;
  const list = cat === 'popular' ? pool : pool.filter((r) => r.cuisine === cat || r.meal === cat);
  const shown = list.length ? list : pool;

  // pair recipes into rows of 2 for the grid
  const rows: typeof shown[] = [];
  for (let i = 0; i < shown.length; i += 2) rows.push(shown.slice(i, i + 2));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 6, paddingBottom: 24 }}>
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
        <SearchBar t={t} onPress={() => router.push('/search')} onFilter={() => router.push({ pathname: '/search', params: { filter: '1' } })} />
      </View>

      <View style={{ marginBottom: 22 }}>
        <CategoryRow t={t} active={cat} onPick={setCat} />
      </View>

      <SectionHead
        title={cat === 'popular' ? tr((s) => s.home.popularRecipes) : tr((s) => s.home.categoryRecipes, { cat: trEnum(cat, lang) })}
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
    </ScrollView>
  );
}
