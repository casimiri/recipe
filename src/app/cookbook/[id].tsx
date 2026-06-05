import React from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useApp } from '../../store/AppState';
import { Txt } from '../../components/Txt';
import { Icon } from '../../components/Icon';
import { IconBtn, Scrim } from '../../components/atoms';
import { RecipeCard } from '../../components/RecipeCard';
import { CookbookCover } from '../../components/CookbookCover';
import { COOKBOOKS } from '../../data/seed';

export default function CookbookDetail() {
  const { t } = useTheme();
  const { saved, byId, recipes, isSaved, toggleSave } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const cb = id === 'saved'
    ? { name: 'All saved', cover: saved.slice(0, 4), count: saved.length }
    : COOKBOOKS.find((c) => c.id === id)!;

  const ids = id === 'saved'
    ? saved
    : [...new Set([...cb.cover, ...recipes.map((r) => r.id)])].slice(0, cb.count || 6);
  const list = [...new Set(ids)].map(byId).filter(Boolean) as NonNullable<ReturnType<typeof byId>>[];
  const coverRecipes = (cb.cover.length ? cb.cover : list.map((r) => r.id)).map(byId);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <CookbookCover recipes={coverRecipes} h={170 + insets.top} />
          <Scrim colors={['transparent', 'rgba(0,0,0,0.6)']} style={{ top: '30%' }} />
          <View style={{ position: 'absolute', top: insets.top + 4, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
            <IconBtn t={t} glass onPress={() => router.back()}><Icon.back size={22} sw={2.2} color={t.text} /></IconBtn>
            <IconBtn t={t} glass><Icon.share size={19} sw={2} color={t.text} /></IconBtn>
          </View>
          <View style={{ position: 'absolute', bottom: 14, left: 18 }}>
            <Txt style={{ fontWeight: '800', fontSize: 25, color: '#fff' }}>{cb.name}</Txt>
            <Txt style={{ fontSize: 13, color: '#fff', opacity: 0.9 }}>{list.length} recipes</Txt>
          </View>
        </View>
        <View style={{ padding: 20, gap: 6 }}>
          {list.length === 0 ? <Txt style={{ textAlign: 'center', color: t.muted, paddingVertical: 50 }}>No recipes here yet.</Txt> : null}
          {list.map((r) => (
            <RecipeCard key={r.id} recipe={r} t={t} variant="compact" onOpen={(rid) => router.push(`/recipe/${rid}`)} onSave={toggleSave} saved={isSaved(r.id)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
