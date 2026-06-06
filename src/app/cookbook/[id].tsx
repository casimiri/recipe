import React from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n';
import { useApp } from '../../store/AppState';
import { Txt } from '../../components/Txt';
import { Icon } from '../../components/Icon';
import { IconBtn, Scrim } from '../../components/atoms';
import { RecipeCard } from '../../components/RecipeCard';
import { CookbookCover } from '../../components/CookbookCover';
import { COOKBOOKS } from '../../data/seed';

export default function CookbookDetail() {
  const { t } = useTheme();
  const { tr } = useI18n();
  const { saved, byId, recipes, isSaved, toggleSave, cookbooks, removeFromCookbook, deleteCookbook } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const userCb = cookbooks.find((c) => c.id === id);
  // Editable = a user-created cookbook (supports removing recipes + deletion).
  const editable = !!userCb;

  const confirmDelete = () => {
    if (!userCb) return;
    Alert.alert(
      tr((s) => s.cookbooks.delete),
      tr((s) => s.cookbooks.deleteConfirm, { name: userCb.name }),
      [
        { text: tr((s) => s.common.cancel), style: 'cancel' },
        { text: tr((s) => s.cookbooks.delete), style: 'destructive', onPress: () => { deleteCookbook(userCb.id); router.back(); } },
      ],
    );
  };

  let name: string;
  let ids: string[];
  if (id === 'saved') {
    name = 'All saved';
    ids = saved;
  } else if (userCb) {
    name = userCb.name;
    ids = userCb.recipeIds;
  } else {
    const seed = COOKBOOKS.find((c) => c.id === id)!;
    name = seed.name;
    ids = [...new Set([...seed.cover, ...recipes.map((r) => r.id)])].slice(0, seed.count || 6);
  }

  const list = [...new Set(ids)].map(byId).filter(Boolean) as NonNullable<ReturnType<typeof byId>>[];
  const coverRecipes = list.slice(0, 4).map((r) => r.id).map(byId);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <CookbookCover recipes={coverRecipes} h={170 + insets.top} />
          <Scrim colors={['transparent', 'rgba(0,0,0,0.6)']} style={{ top: '30%' }} />
          <View style={{ position: 'absolute', top: insets.top + 4, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
            <IconBtn t={t} glass onPress={() => router.back()}><Icon.back size={22} sw={2.2} color={t.text} /></IconBtn>
            {editable ? (
              <IconBtn t={t} glass onPress={confirmDelete}><Icon.trash size={19} sw={2} color={t.danger} /></IconBtn>
            ) : null}
          </View>
          <View style={{ position: 'absolute', bottom: 14, left: 18 }}>
            <Txt style={{ fontWeight: '800', fontSize: 25, color: '#fff' }}>{name}</Txt>
            <Txt style={{ fontSize: 13, color: '#fff', opacity: 0.9 }}>{list.length} recipes</Txt>
          </View>
        </View>
        <View style={{ padding: 20, gap: 6 }}>
          {list.length === 0 ? (
            <Txt style={{ textAlign: 'center', color: t.muted, paddingVertical: 50 }}>
              {editable ? 'No recipes yet — open any recipe and tap “Add to cookbook”.' : 'No recipes here yet.'}
            </Txt>
          ) : null}
          {list.map((r) => (
            editable ? (
              <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <RecipeCard recipe={r} t={t} variant="compact" onOpen={(rid) => router.push(`/recipe/${rid}`)} saved={isSaved(r.id)} />
                </View>
                <Pressable onPress={() => removeFromCookbook(userCb!.id, r.id)} hitSlop={8} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon.trash size={18} sw={2} color={t.danger} />
                </Pressable>
              </View>
            ) : (
              <RecipeCard key={r.id} recipe={r} t={t} variant="compact" onOpen={(rid) => router.push(`/recipe/${rid}`)} onSave={toggleSave} saved={isSaved(r.id)} />
            )
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
