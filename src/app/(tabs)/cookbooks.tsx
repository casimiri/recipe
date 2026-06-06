import React, { useState } from 'react';
import { View, Pressable, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n';
import { useApp } from '../../store/AppState';
import { Txt } from '../../components/Txt';
import { Icon } from '../../components/Icon';
import { IconBtn, Sheet, PrimaryButton } from '../../components/atoms';
import { CookbookCover } from '../../components/CookbookCover';
import { COOKBOOKS } from '../../data/seed';

export default function Cookbooks() {
  const { t } = useTheme();
  const { tr } = useI18n();
  const { saved, byId, cookbooks, createCookbook } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const create = () => {
    const n = name.trim();
    if (!n) return;
    const id = createCookbook(n);
    setName('');
    setCreating(false);
    router.push(`/cookbook/${id}`);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 6, paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Txt style={{ fontWeight: '800', fontSize: 27, color: t.text }}>{tr((s) => s.cookbooks.title)}</Txt>
        <IconBtn t={t} style={{ backgroundColor: t.accent }} onPress={() => setCreating(true)}><Icon.plus size={22} sw={2.5} color={t.accentText} /></IconBtn>
      </View>
      <Txt style={{ fontSize: 14, color: t.muted, marginBottom: 22 }}>{tr((s) => s.cookbooks.subtitle)}</Txt>

      <Pressable onPress={() => router.push('/cookbook/saved')} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: t.radius, backgroundColor: t.accent, marginBottom: 18, boxShadow: `0 10px 26px ${t.withA(t.accent, 0.35)}` }}>
        <View style={{ width: 52, height: 52, borderRadius: 15, backgroundColor: t.withA('#000', 0.12), alignItems: 'center', justifyContent: 'center' }}>
          <Icon.bookmarkFill size={24} color={t.accentText} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt style={{ fontWeight: '800', fontSize: 16, color: t.accentText }}>{tr((s) => s.cookbooks.allSaved)}</Txt>
          <Txt style={{ fontSize: 13, color: t.accentText, opacity: 0.85 }}>{tr((s) => s.cookbooks.recipesCount, { count: saved.length })}</Txt>
        </View>
        <Icon.chevR size={22} sw={2.2} color={t.accentText} />
      </Pressable>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {cookbooks.map((c) => (
          <Pressable key={c.id} onPress={() => router.push(`/cookbook/${c.id}`)} style={{ width: '47%', flexGrow: 1, backgroundColor: t.surface, borderRadius: t.radius, overflow: 'hidden', boxShadow: t.shadow, borderWidth: 1, borderColor: t.border }}>
            <CookbookCover recipes={c.recipeIds.slice(0, 4).map(byId)} />
            <View style={{ paddingHorizontal: 13, paddingTop: 11, paddingBottom: 13 }}>
              <Txt style={{ fontWeight: '700', fontSize: 14.5, color: t.text, marginBottom: 2 }}>{c.name}</Txt>
              <Txt style={{ fontSize: 12.5, color: t.muted }}>{tr((s) => s.cookbooks.recipesCount, { count: c.recipeIds.length })}</Txt>
            </View>
          </Pressable>
        ))}
        {COOKBOOKS.map((c) => (
          <Pressable key={c.id} onPress={() => router.push(`/cookbook/${c.id}`)} style={{ width: '47%', flexGrow: 1, backgroundColor: t.surface, borderRadius: t.radius, overflow: 'hidden', boxShadow: t.shadow, borderWidth: 1, borderColor: t.border }}>
            <CookbookCover recipes={c.cover.map(byId)} />
            <View style={{ paddingHorizontal: 13, paddingTop: 11, paddingBottom: 13 }}>
              <Txt style={{ fontWeight: '700', fontSize: 14.5, color: t.text, marginBottom: 2 }}>{c.name}</Txt>
              <Txt style={{ fontSize: 12.5, color: t.muted }}>{tr((s) => s.cookbooks.recipesCount, { count: c.count })}</Txt>
            </View>
          </Pressable>
        ))}
      </View>

      <Sheet open={creating} onClose={() => { setCreating(false); setName(''); }} t={t} title={tr((s) => s.recipe.newCookbook)}>
        <TextInput
          value={name} onChangeText={setName} placeholder={tr((s) => s.cookbooks.namePlaceholder)} placeholderTextColor={t.faint}
          autoFocus returnKeyType="done" onSubmitEditing={create}
          style={{ backgroundColor: t.surface2, borderRadius: t.radiusSm, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: t.text, fontFamily: t.body, marginBottom: 16 }}
        />
        <PrimaryButton t={t} full disabled={!name.trim()} onPress={create}>{tr((s) => s.cookbooks.create)}</PrimaryButton>
      </Sheet>
    </ScrollView>
  );
}
