import React, { useState } from 'react';
import { View, Pressable, ScrollView, Share, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n';
import { useApp } from '../../store/AppState';
import { Txt } from '../../components/Txt';
import { Icon } from '../../components/Icon';
import { Avatar, PrimaryButton, Dish } from '../../components/atoms';
import { RecipeCard } from '../../components/RecipeCard';
import { compact } from '../../utils/format';

type Tab = 'created' | 'saved' | 'cooked';

export default function Profile() {
  const { t } = useTheme();
  const { tr } = useI18n();
  const { saved, byId, isSaved, profile, cooked, rateCook, deleteCreatedRecipe } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('created');
  const p = profile;

  // created/saved render as a grid; cooked renders its own list (rating + date).
  const gridData = (tab === 'saved' ? saved.map(byId) : p.created.map(byId)).filter(Boolean) as NonNullable<ReturnType<typeof byId>>[];
  const rows: typeof gridData[] = [];
  for (let i = 0; i < gridData.length; i += 2) rows.push(gridData.slice(i, i + 2));
  const cookedEntries = cooked.map((c) => ({ c, r: byId(c.id) })).filter((x) => x.r);
  const isEmpty = tab === 'cooked' ? cookedEntries.length === 0 : gridData.length === 0;

  const confirmDeleteRecipe = (id: string) => {
    const r = byId(id);
    if (!r) return;
    Alert.alert(
      tr((s) => s.profile.deleteRecipe),
      tr((s) => s.profile.deleteRecipeConfirm, { title: r.title }),
      [
        { text: tr((s) => s.common.cancel), style: 'cancel' },
        { text: tr((s) => s.profile.deleteRecipe), style: 'destructive', onPress: () => deleteCreatedRecipe(id) },
      ],
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 6, paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 }}>
        <Pressable onPress={() => router.push('/settings')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <Icon.settings size={21} sw={1.8} color={t.text} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <Avatar src={p.avatar} size={74} ring t={t} />
        <View style={{ flex: 1 }}>
          <Txt style={{ fontWeight: '800', fontSize: 21, color: t.text }}>{p.name}</Txt>
          <Txt style={{ fontSize: 13.5, color: t.muted }}>{p.handle}</Txt>
        </View>
      </View>
      <Txt style={{ fontSize: 14, color: t.text, lineHeight: 21, marginBottom: 18 }}>{p.bio}</Txt>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 4, borderTopWidth: 1, borderTopColor: t.border, borderBottomWidth: 1, borderBottomColor: t.border, marginBottom: 18 }}>
        {([['recipes', p.stats.recipes], ['cookbooks', p.stats.cookbooks], ['cooked', cooked.length]] as const).map(([k, v]) => (
          <View key={k} style={{ alignItems: 'center', flex: 1 }}>
            <Txt style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{compact(v)}</Txt>
            <Txt style={{ fontSize: 11.5, color: t.muted, textTransform: 'capitalize' }}>{tr((s) => s.profile[k])}</Txt>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        <PrimaryButton t={t} full icon={<Icon.edit size={16} sw={2} color={t.accentText} />} onPress={() => router.push('/edit-profile')}>{tr((s) => s.profile.editProfile)}</PrimaryButton>
        <PrimaryButton t={t} ghost icon={<Icon.share size={16} sw={2} color={t.text} />}
          onPress={() => Share.share({ message: tr((s) => s.profile.shareMessage) }).catch(() => {})}>{tr((s) => s.common.share)}</PrimaryButton>
      </View>

      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.border, marginBottom: 18 }}>
        {(['created', 'saved', 'cooked'] as const).map((k) => (
          <Pressable key={k} onPress={() => setTab(k)} style={{ flex: 1, paddingVertical: 12, alignItems: 'center' }}>
            <Txt style={{ fontSize: 14, fontWeight: '700', color: tab === k ? t.text : t.muted }}>{tr((s) => s.profile[k])}</Txt>
            {tab === k ? <View style={{ position: 'absolute', bottom: -1, left: '25%', right: '25%', height: 3, borderRadius: 3, backgroundColor: t.accent }} /> : null}
          </Pressable>
        ))}
      </View>

      {isEmpty ? <Txt style={{ textAlign: 'center', color: t.muted, paddingVertical: 40 }}>{tr((s) => s.common.nothingHere)}</Txt> : null}

      {tab === 'cooked' ? (
        <View style={{ gap: 10 }}>
          {cookedEntries.map(({ c, r }) => (
            <Pressable key={c.id} onPress={() => router.push(`/recipe/${r!.id}`)}
              style={{ flexDirection: 'row', gap: 13, alignItems: 'center', padding: 8, borderRadius: t.radiusSm + 6, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}>
              <Dish src={r!.img} alt={r!.title} radius={t.radiusSm} style={{ width: 74, height: 74 }} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt style={{ fontWeight: '700', fontSize: 15, color: t.text }} numberOfLines={1}>{r!.title}</Txt>
                {c.at ? <Txt style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{tr((s) => s.profile.cookedOn, { date: new Date(c.at).toLocaleDateString() })}</Txt> : null}
                <View style={{ flexDirection: 'row', gap: 4, marginTop: 7 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable key={n} hitSlop={6} onPress={() => rateCook(c.id, n)}>
                      <Icon.star size={20} color={n <= c.rating ? t.star : t.border} />
                    </Pressable>
                  ))}
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          {rows.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', gap: 14 }}>
              {row.map((r) => (
                <View key={r.id} style={{ flex: 1 }}>
                  <RecipeCard recipe={r} t={t} variant="overlay" onOpen={(id) => router.push(`/recipe/${id}`)} saved={isSaved(r.id)}
                    onLongPress={tab === 'created' ? confirmDeleteRecipe : undefined} />
                </View>
              ))}
              {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
