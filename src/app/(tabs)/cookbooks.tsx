import React from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useApp } from '../../store/AppState';
import { Txt } from '../../components/Txt';
import { Icon } from '../../components/Icon';
import { IconBtn } from '../../components/atoms';
import { CookbookCover } from '../../components/CookbookCover';
import { COOKBOOKS } from '../../data/seed';

export default function Cookbooks() {
  const { t } = useTheme();
  const { saved, byId } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 6, paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Txt style={{ fontWeight: '800', fontSize: 27, color: t.text }}>Cookbooks</Txt>
        <IconBtn t={t} style={{ backgroundColor: t.accent }}><Icon.plus size={22} sw={2.5} color={t.accentText} /></IconBtn>
      </View>
      <Txt style={{ fontSize: 14, color: t.muted, marginBottom: 22 }}>Your saved recipes, organized.</Txt>

      <Pressable onPress={() => router.push('/cookbook/saved')} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: t.radius, backgroundColor: t.accent, marginBottom: 18, boxShadow: `0 10px 26px ${t.withA(t.accent, 0.35)}` }}>
        <View style={{ width: 52, height: 52, borderRadius: 15, backgroundColor: t.withA('#000', 0.12), alignItems: 'center', justifyContent: 'center' }}>
          <Icon.bookmarkFill size={24} color={t.accentText} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt style={{ fontWeight: '800', fontSize: 16, color: t.accentText }}>All saved</Txt>
          <Txt style={{ fontSize: 13, color: t.accentText, opacity: 0.85 }}>{saved.length} recipes</Txt>
        </View>
        <Icon.chevR size={22} sw={2.2} color={t.accentText} />
      </Pressable>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {COOKBOOKS.map((c) => (
          <Pressable key={c.id} onPress={() => router.push(`/cookbook/${c.id}`)} style={{ width: '47%', flexGrow: 1, backgroundColor: t.surface, borderRadius: t.radius, overflow: 'hidden', boxShadow: t.shadow, borderWidth: 1, borderColor: t.border }}>
            <CookbookCover recipes={c.cover.map(byId)} />
            <View style={{ paddingHorizontal: 13, paddingTop: 11, paddingBottom: 13 }}>
              <Txt style={{ fontWeight: '700', fontSize: 14.5, color: t.text, marginBottom: 2 }}>{c.name}</Txt>
              <Txt style={{ fontSize: 12.5, color: t.muted }}>{c.count} recipes</Txt>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
