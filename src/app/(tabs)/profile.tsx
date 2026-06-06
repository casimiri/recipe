import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useApp } from '../../store/AppState';
import { Txt } from '../../components/Txt';
import { Icon } from '../../components/Icon';
import { Avatar, PrimaryButton } from '../../components/atoms';
import { RecipeCard } from '../../components/RecipeCard';
import { compact } from '../../utils/format';

type Tab = 'created' | 'saved' | 'cooked';

export default function Profile() {
  const { t } = useTheme();
  const { saved, byId, isSaved, profile, cooked } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('created');
  const p = profile;

  const data = {
    created: p.created.map(byId).filter(Boolean),
    saved: saved.map(byId).filter(Boolean),
    cooked: cooked.map((c) => byId(c.id)).filter(Boolean),
  }[tab] as NonNullable<ReturnType<typeof byId>>[];

  const rows: typeof data[] = [];
  for (let i = 0; i < data.length; i += 2) rows.push(data.slice(i, i + 2));

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
        {([['recipes', p.stats.recipes], ['cookbooks', p.stats.cookbooks], ['followers', p.stats.followers], ['following', p.stats.following]] as const).map(([k, v]) => (
          <View key={k} style={{ alignItems: 'center', flex: 1 }}>
            <Txt style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{compact(v)}</Txt>
            <Txt style={{ fontSize: 11.5, color: t.muted, textTransform: 'capitalize' }}>{k}</Txt>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        <PrimaryButton t={t} full icon={<Icon.edit size={16} sw={2} color={t.accentText} />} onPress={() => router.push('/edit-profile')}>Edit profile</PrimaryButton>
        <PrimaryButton t={t} ghost icon={<Icon.share size={16} sw={2} color={t.text} />}>Share</PrimaryButton>
      </View>

      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.border, marginBottom: 18 }}>
        {([['created', 'Created'], ['saved', 'Saved'], ['cooked', 'Cooked']] as const).map(([k, lbl]) => (
          <Pressable key={k} onPress={() => setTab(k)} style={{ flex: 1, paddingVertical: 12, alignItems: 'center' }}>
            <Txt style={{ fontSize: 14, fontWeight: '700', color: tab === k ? t.text : t.muted }}>{lbl}</Txt>
            {tab === k ? <View style={{ position: 'absolute', bottom: -1, left: '25%', right: '25%', height: 3, borderRadius: 3, backgroundColor: t.accent }} /> : null}
          </Pressable>
        ))}
      </View>

      {data.length === 0 ? <Txt style={{ textAlign: 'center', color: t.muted, paddingVertical: 40 }}>Nothing here yet.</Txt> : null}
      <View style={{ gap: 14 }}>
        {rows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 14 }}>
            {row.map((r) => (
              <View key={r.id} style={{ flex: 1 }}>
                <RecipeCard recipe={r} t={t} variant="overlay" onOpen={(id) => router.push(`/recipe/${id}`)} saved={isSaved(r.id)} />
              </View>
            ))}
            {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
