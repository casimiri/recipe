import React, { useState } from 'react';
import { View, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../store/auth';
import { useApp } from '../store/AppState';
import { Txt } from '../components/Txt';
import { Icon } from '../components/Icon';
import { Dish, PrimaryButton, Tag, Scrim } from '../components/atoms';
import { ONB_SLIDES, ONB_HERO, TASTES } from '../data/seed';
import { ONBOARDED_KEY } from './index';

export default function Onboarding() {
  const { t } = useTheme();
  const { configured, session } = useAuth();
  const { setTastes } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [step, setStep] = useState(0); // 0 welcome, 1-3 slides, 4 tastes
  const [picked, setPicked] = useState<string[]>([]);

  const togglePick = (x: string) =>
    setPicked((p) => (p.includes(x) ? p.filter((y) => y !== x) : [...p, x]));

  const finish = async () => {
    setTastes(picked);
    await AsyncStorage.setItem(ONBOARDED_KEY, '1');
    if (configured && !session) router.replace('/auth');
    else router.replace('/(tabs)');
  };

  // Welcome
  if (step === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: t.surface }}>
        <Dish src={ONB_HERO} alt="" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.64 }} />
        <Scrim colors={['transparent', 'transparent', t.surface]} style={{ top: height * 0.32 }} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 28, paddingBottom: 40 + insets.bottom, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Icon.forkknife size={22} sw={2} color={t.accentText} />
            </View>
            <Txt style={{ fontWeight: '800', fontSize: 22, color: t.text }}>Recipe-Snap</Txt>
          </View>
          <Txt style={{ fontWeight: '800', fontSize: 32, lineHeight: 36, color: t.text, textAlign: 'center', marginBottom: 12 }}>
            Every recipe you love,{'\n'}in <Txt style={{ color: t.accent, fontWeight: '800', fontSize: 32 }}>one place</Txt>.
          </Txt>
          <Txt style={{ fontSize: 15, color: t.muted, lineHeight: 23, textAlign: 'center', marginBottom: 28 }}>
            Import, plan, shop and cook — without a single browser tab.
          </Txt>
          <PrimaryButton t={t} full onPress={() => setStep(1)} style={{ paddingVertical: 17 }}>Get started</PrimaryButton>
          <Pressable onPress={finish} style={{ marginTop: 16 }}>
            <Txt style={{ color: t.muted, fontWeight: '600', fontSize: 14 }}>I already have an account</Txt>
          </Pressable>
        </View>
      </View>
    );
  }

  // Tastes
  if (step === 4) {
    return (
      <View style={{ flex: 1, backgroundColor: t.surface, paddingTop: insets.top + 6, paddingHorizontal: 24 }}>
        <Txt style={{ fontWeight: '800', fontSize: 27, color: t.text, marginBottom: 8 }}>What do you love to cook?</Txt>
        <Txt style={{ fontSize: 14.5, color: t.muted, marginBottom: 24 }}>Pick a few — we’ll tune your home feed.</Txt>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {TASTES.map((x) => (
            <Tag key={x} t={t} active={picked.includes(x)} onPress={() => togglePick(x)}>{x}</Tag>
          ))}
        </ScrollView>
        <View style={{ paddingBottom: 16 + insets.bottom, paddingTop: 12 }}>
          <PrimaryButton t={t} full onPress={finish} disabled={picked.length === 0} style={{ marginBottom: 12, paddingVertical: 17 }}>
            {picked.length ? `Continue with ${picked.length} selected` : 'Pick at least one'}
          </PrimaryButton>
          <Pressable onPress={finish} style={{ alignItems: 'center' }}>
            <Txt style={{ color: t.muted, fontWeight: '600', fontSize: 14 }}>Skip</Txt>
          </Pressable>
        </View>
      </View>
    );
  }

  // Value slides 1..3
  const s = ONB_SLIDES[step - 1];
  const I = Icon[s.icon];
  return (
    <View style={{ flex: 1, backgroundColor: t.surface }}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 7 }}>
          {[1, 2, 3].map((n) => (
            <View key={n} style={{ width: n === step ? 22 : 7, height: 7, borderRadius: 999, backgroundColor: n === step ? t.accent : t.borderStrong }} />
          ))}
        </View>
        <Pressable onPress={finish}>
          <Txt style={{ color: t.muted, fontWeight: '700', fontSize: 14 }}>Skip</Txt>
        </Pressable>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
        <View style={{ marginBottom: 36 }}>
          <Dish src={s.img} alt="" radius={t.radiusLg} style={{ width: '100%', height: 300, boxShadow: t.shadowLg }} />
          <View style={{ position: 'absolute', bottom: -22, left: 24, width: 56, height: 56, borderRadius: 18, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', boxShadow: `0 10px 24px ${t.withA(t.accent, 0.4)}` }}>
            <I size={28} sw={2} color={t.accentText} />
          </View>
        </View>
        <Txt style={{ fontWeight: '800', fontSize: 28, lineHeight: 32, color: t.text, marginBottom: 12 }}>{s.title}</Txt>
        <Txt style={{ fontSize: 15.5, color: t.muted, lineHeight: 25 }}>{s.body}</Txt>
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: 24 + insets.bottom }}>
        <PrimaryButton t={t} full onPress={() => setStep(step + 1)} icon={<Icon.arrowR size={18} sw={2.4} color={t.accentText} />} style={{ paddingVertical: 17 }}>
          {step === 3 ? 'Almost there' : 'Next'}
        </PrimaryButton>
      </View>
    </View>
  );
}
