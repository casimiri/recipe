import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { useTheme } from '../theme/ThemeProvider';
import { useApp } from '../store/AppState';
import { Txt } from '../components/Txt';
import { Icon } from '../components/Icon';
import { PrimaryButton } from '../components/atoms';

export default function CookDone() {
  const { t } = useTheme();
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

  return (
    <View style={{ flex: 1, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: `0 14px 40px ${t.withA(t.accent, 0.4)}` }}>
        <Icon.check size={48} sw={2.6} color={t.accentText} />
      </View>
      <Txt style={{ fontWeight: '800', fontSize: 28, color: t.text, marginBottom: 10 }}>Nicely done!</Txt>
      <Txt style={{ fontSize: 15, color: t.muted, lineHeight: 22, textAlign: 'center', marginBottom: 28 }}>
        You cooked <Txt style={{ color: t.text, fontWeight: '700' }}>{r.title}</Txt>. How did it turn out?
      </Txt>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 32 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)}>
            <Icon.star size={36} color={n <= rating ? t.star : t.border} />
          </Pressable>
        ))}
      </View>
      <View style={{ width: '100%', gap: 12 }}>
        <PrimaryButton t={t} full onPress={() => finish('/(tabs)')}>Back to home</PrimaryButton>
        <PrimaryButton t={t} ghost full icon={<Icon.share size={17} sw={2} color={t.text} />} onPress={() => finish(`/recipe/${r.id}`)}>Share your cook</PrimaryButton>
      </View>
    </View>
  );
}
