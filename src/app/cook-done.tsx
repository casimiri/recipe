import React, { useState } from 'react';
import { View, Pressable, Share } from 'react-native';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n';
import { useApp } from '../store/AppState';
import { recipeLink } from '../lib/share';
import { Txt } from '../components/Txt';
import { Icon } from '../components/Icon';
import { PrimaryButton } from '../components/atoms';

export default function CookDone() {
  const { t } = useTheme();
  const { tr } = useI18n();
  const { byId, recipes, logCook } = useApp();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = byId(String(id)) || recipes[0];
  const [rating, setRating] = useState(0);

  // Persist the cook (with whatever rating was given) before leaving, then go.
  const finish = (to: Href) => {
    logCook(r.id, rating);
    router.replace(to);
  };

  // Record the cook, open the native share sheet with the recipe link (and the
  // rating, if given), then head home.
  const shareCook = async () => {
    logCook(r.id, rating);
    const link = recipeLink(r.id);
    const stars = rating > 0 ? ` ${'★'.repeat(rating)}` : '';
    try {
      await Share.share({ message: `${tr((s) => s.cookDone.shareMessage, { title: r.title })}${stars} — ${link}`, url: link });
    } catch {
      // user dismissed the sheet or sharing is unsupported
    }
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: `0 14px 40px ${t.withA(t.accent, 0.4)}` }}>
        <Icon.check size={48} sw={2.6} color={t.accentText} />
      </View>
      <Txt style={{ fontWeight: '800', fontSize: 28, color: t.text, marginBottom: 10 }}>{tr((s) => s.cookDone.title)}</Txt>
      <Txt style={{ fontSize: 15, color: t.muted, lineHeight: 22, textAlign: 'center', marginBottom: 28 }}>
        {tr((s) => s.cookDone.body, { title: r.title })}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 32 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)}>
            <Icon.star size={36} color={n <= rating ? t.star : t.border} />
          </Pressable>
        ))}
      </View>
      <View style={{ width: '100%', gap: 12 }}>
        <PrimaryButton t={t} full onPress={() => finish('/(tabs)')}>{tr((s) => s.cookDone.backHome)}</PrimaryButton>
        <PrimaryButton t={t} ghost full icon={<Icon.share size={17} sw={2} color={t.text} />} onPress={shareCook}>{tr((s) => s.cookDone.shareCook)}</PrimaryButton>
      </View>
    </View>
  );
}
