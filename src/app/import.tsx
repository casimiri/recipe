import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, ScrollView, TextInput, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeProvider';
import { useApp } from '../store/AppState';
import { Txt } from '../components/Txt';
import { Icon } from '../components/Icon';
import { Dish, IconBtn, PrimaryButton, SectionHead, Tag } from '../components/atoms';
import { ScreenHeader } from '../components/Screen';
import { fmtQty } from '../utils/format';
import { importRecipe } from '../lib/ai';
import { withA } from '../theme/tokens';
import { COOKBOOKS } from '../data/seed';
import type { Tokens } from '../theme/tokens';
import type { Recipe, SourceKind } from '../data/types';

const SOURCES: { kind: SourceKind; icon: keyof typeof Icon; label: string; sample: string; color: string }[] = [
  { kind: 'instagram', icon: 'instagram', label: 'Instagram', sample: 'instagram.com/reel/Cx8...', color: '#E1306C' },
  { kind: 'tiktok', icon: 'tiktok', label: 'TikTok', sample: 'tiktok.com/@cozy/video/73...', color: '#000000' },
  { kind: 'youtube', icon: 'youtube', label: 'YouTube', sample: 'youtube.com/watch?v=8aB...', color: '#FF0000' },
  { kind: 'url', icon: 'link', label: 'Website', sample: 'thecozykitchen.com/tuscan', color: '#3B82F6' },
  { kind: 'camera', icon: 'camera', label: 'Photo / Screenshot', sample: 'Scan a cookbook page', color: '#16A34A' },
  { kind: 'manual', icon: 'edit', label: 'Write your own', sample: 'Start from scratch', color: '#8B5CF6' },
];

type Stage = 'pick' | 'extract' | 'preview';

export default function ImportScreen() {
  const { t } = useTheme();
  const { saveRecipe, cookbooks, addToCookbook } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [stage, setStage] = useState<Stage>('pick');
  const [src, setSrc] = useState(SOURCES[0]);
  const [link, setLink] = useState('');
  const [cookbook, setCookbook] = useState(COOKBOOKS[0].id);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [animDone, setAnimDone] = useState(false);

  const begin = async (s: typeof SOURCES[number], url?: string) => {
    setSrc(s);
    setRecipe(null);
    setAnimDone(false);
    setStage('extract');
    let imageBase64: string | undefined;
    if (s.kind === 'camera') {
      // Use the real camera when permitted; fall back to the photo library otherwise.
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      const res = perm.granted
        ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.6 });
      if (!res.canceled && res.assets[0]?.base64) imageBase64 = res.assets[0].base64;
    }
    const r = await importRecipe({ url: url ?? (link || s.sample), sourceKind: s.kind, imageBase64 });
    setRecipe({ ...r, source: { kind: s.kind, handle: url || link || s.sample, name: s.label } });
  };

  // Move to preview once both the animation and the fetch have completed.
  useEffect(() => {
    if (stage === 'extract' && animDone && recipe) setStage('preview');
  }, [stage, animDone, recipe]);

  if (stage === 'extract') {
    return <Extracting t={t} src={src} onDone={() => setAnimDone(true)} onCancel={() => setStage('pick')} insetsTop={insets.top} />;
  }

  if (stage === 'preview' && recipe) {
    const r = recipe;
    return (
      <ScrollView style={{ flex: 1, backgroundColor: t.bg }} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 6, paddingBottom: insets.bottom + 30 }}>
        <ScreenHeader title="Review recipe" onBack={() => setStage('pick')} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: t.accentSofter, paddingVertical: 11, paddingHorizontal: 14, borderRadius: t.radiusSm, marginBottom: 20 }}>
          <Icon.sparkle size={17} color={t.accent} />
          <Txt style={{ color: t.accent, fontSize: 13, fontWeight: '700', flex: 1 }}>Recipe extracted — tap any field to edit before saving.</Txt>
        </View>

        <Dish src={r.img} alt={r.title} radius={t.radius} style={{ width: '100%', height: 170, marginBottom: 16 }}>
          <View style={{ position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.92)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 }}>
            <Icon.camera size={15} sw={2} color="#222" />
            <Txt style={{ color: '#222', fontSize: 12.5, fontWeight: '700' }}>Change</Txt>
          </View>
        </Dish>

        <EditField t={t} value={r.title} onChange={(v) => setRecipe({ ...r, title: v })} big />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 20 }}>
          <MiniField t={t} icon={<Icon.clock size={15} sw={2} color={t.accent} />} value={`${r.time} min`} />
          <MiniField t={t} icon={<Icon.users size={15} sw={2} color={t.accent} />} value={`${r.servings} serv`} />
          <MiniField t={t} icon={<Icon.layers size={15} sw={2} color={t.accent} />} value={r.difficulty} />
        </View>

        <SectionHead title={`Ingredients · ${r.ingredients.length}`} t={t} style={{ marginBottom: 10 }} />
        <View style={{ backgroundColor: t.surface2, borderRadius: t.radius, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 22 }}>
          {r.ingredients.map((ing, k) => (
            <View key={k} style={{ flexDirection: 'row', gap: 8, paddingVertical: 9, borderBottomWidth: k < r.ingredients.length - 1 ? 1 : 0, borderBottomColor: t.border }}>
              <Txt style={{ color: t.accent, fontWeight: '700', minWidth: 64, fontSize: 14 }}>{fmtQty(ing.qty)} {ing.unit}</Txt>
              <Txt style={{ fontSize: 14, color: t.text, flex: 1 }}>{ing.item}</Txt>
            </View>
          ))}
        </View>

        <SectionHead title={`Steps · ${r.steps.length}`} t={t} style={{ marginBottom: 10 }} />
        <View style={{ gap: 10, marginBottom: 24 }}>
          {r.steps.map((s, k) => (
            <View key={k} style={{ flexDirection: 'row', gap: 11 }}>
              <Txt style={{ color: t.accent, fontWeight: '800', fontSize: 14 }}>{k + 1}</Txt>
              <Txt style={{ flex: 1, fontSize: 14, color: t.muted, lineHeight: 21 }}>
                <Txt style={{ color: t.text, fontWeight: '700', fontSize: 14 }}>{s.t}. </Txt>{s.d}
              </Txt>
            </View>
          ))}
        </View>

        <Txt style={{ fontSize: 13, fontWeight: '700', color: t.muted, marginBottom: 10 }}>Save to cookbook</Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 9, paddingBottom: 4 }} style={{ marginBottom: 24 }}>
          {[...cookbooks, ...COOKBOOKS].map((c) => <Tag key={c.id} t={t} active={cookbook === c.id} onPress={() => setCookbook(c.id)}>{c.name}</Tag>)}
        </ScrollView>

        <PrimaryButton t={t} full icon={<Icon.bookmark size={18} sw={2.2} color={t.accentText} />}
          onPress={async () => {
            await saveRecipe(r);
            if (cookbooks.some((c) => c.id === cookbook)) addToCookbook(cookbook, r.id);
            router.replace(`/recipe/${r.id}`);
          }}>
          Save recipe
        </PrimaryButton>
      </ScrollView>
    );
  }

  // pick stage
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 6, paddingBottom: insets.bottom + 30 }} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Txt style={{ fontWeight: '800', fontSize: 27, color: t.text }}>Add a recipe</Txt>
        <IconBtn t={t} onPress={() => router.back()}><Icon.x size={20} sw={2.4} color={t.text} /></IconBtn>
      </View>
      <Txt style={{ fontSize: 14.5, color: t.muted, lineHeight: 22, marginBottom: 22 }}>
        Paste a link from anywhere and we’ll pull out the ingredients and steps automatically.
      </Txt>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.surface2, borderRadius: 16, paddingLeft: 16, paddingRight: 6, paddingVertical: 6, marginBottom: 12, borderWidth: 1, borderColor: t.border }}>
        <Icon.link size={19} sw={2} color={t.faint} />
        <TextInput value={link} onChangeText={setLink} placeholder="Paste recipe link…" placeholderTextColor={t.faint}
          autoCapitalize="none" style={{ flex: 1, fontSize: 14.5, color: t.text, fontFamily: t.body, paddingVertical: 8 }} />
        <PrimaryButton t={t} disabled={!link} style={{ paddingHorizontal: 18, paddingVertical: 11 }}
          onPress={() => begin(SOURCES.find((s) => link.includes(s.kind)) || SOURCES[3], link)}>
          Import
        </PrimaryButton>
      </View>
      <Pressable onPress={() => begin(SOURCES[0])} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 26 }}>
        <Icon.sparkle size={15} color={t.accent} />
        <Txt style={{ color: t.accent, fontWeight: '700', fontSize: 13 }}>Try it with a sample reel</Txt>
      </Pressable>

      <Txt style={{ fontSize: 13, fontWeight: '700', color: t.muted, marginBottom: 14 }}>Or import from</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {SOURCES.map((s) => {
          const I = Icon[s.icon];
          return (
            <Pressable key={s.kind} onPress={() => begin(s)} style={{
              width: '47.5%', borderWidth: 1, borderColor: t.border, backgroundColor: t.surface,
              borderRadius: t.radius, padding: 16, boxShadow: t.shadow,
            }}>
              <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: withA(s.color, 0.14), alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <I size={22} sw={2} color={s.color} />
              </View>
              <Txt style={{ fontWeight: '700', fontSize: 14.5, color: t.text, marginBottom: 3 }}>{s.label}</Txt>
              <Txt style={{ fontSize: 11.5, color: t.faint }} numberOfLines={1}>{s.sample}</Txt>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function Extracting({ t, src, onDone, onCancel, insetsTop }: { t: Tokens; src: typeof SOURCES[number]; onDone: () => void; onCancel: () => void; insetsTop: number }) {
  const tasks = [`Opening the ${src.label.toLowerCase()} post`, 'Reading captions & audio', 'Detecting ingredients', 'Parsing the steps', 'Estimating nutrition'];
  const [step, setStep] = useState(0);
  const spin = useRef(new Animated.Value(0)).current;
  const I = Icon[src.icon];

  useEffect(() => {
    const anim = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }));
    anim.start();
    return () => anim.stop();
  }, []);

  useEffect(() => {
    if (step >= tasks.length) { const id = setTimeout(onDone, 500); return () => clearTimeout(id); }
    const id = setTimeout(() => setStep((s) => s + 1), step === 0 ? 700 : 560);
    return () => clearTimeout(id);
  }, [step]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', paddingHorizontal: 20, paddingTop: insetsTop }}>
      <View style={{ width: 96, height: 96, alignSelf: 'center', marginBottom: 28, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{ position: 'absolute', width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: t.accentSoft, borderTopColor: t.accent, transform: [{ rotate }] }} />
        <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: withA(src.color, 0.14), alignItems: 'center', justifyContent: 'center' }}>
          <I size={34} sw={2} color={src.color} />
        </View>
      </View>
      <Txt style={{ textAlign: 'center', fontWeight: '800', fontSize: 22, color: t.text, marginBottom: 6 }}>Importing recipe…</Txt>
      <Txt style={{ textAlign: 'center', fontSize: 13.5, color: t.muted, marginBottom: 30 }}>This usually takes a few seconds</Txt>
      <View style={{ gap: 4, maxWidth: 280, alignSelf: 'center', width: '100%' }}>
        {tasks.map((task, i) => {
          const done = i < step, active = i === step;
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 6, opacity: i <= step ? 1 : 0.35 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? t.accent : (active ? t.accentSoft : t.surface2) }}>
                {done ? <Icon.check size={14} sw={3} color={t.accentText} /> : (active ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.accent }} /> : null)}
              </View>
              <Txt style={{ fontSize: 14, color: t.text, fontWeight: active ? '700' : '500' }}>{task}</Txt>
            </View>
          );
        })}
      </View>
      <Pressable onPress={onCancel} style={{ marginTop: 30, alignItems: 'center' }}>
        <Txt style={{ color: t.muted, fontSize: 13.5, fontWeight: '600' }}>Cancel</Txt>
      </Pressable>
    </View>
  );
}

function EditField({ t, value, onChange, big }: { t: Tokens; value: string; onChange: (v: string) => void; big?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 2, borderBottomColor: t.border, paddingBottom: 8 }}>
      <TextInput value={value} onChangeText={onChange} style={{ flex: 1, fontFamily: t.heading, fontSize: big ? 23 : 16, color: t.text }} />
      <Icon.edit size={17} sw={2} color={t.faint} />
    </View>
  );
}

function MiniField({ t, icon, value }: { t: Tokens; icon: React.ReactNode; value: string }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, justifyContent: 'center', backgroundColor: t.surface2, borderRadius: t.radiusSm, paddingHorizontal: 8, paddingVertical: 11 }}>
      {icon}
      <Txt style={{ fontSize: 13, fontWeight: '700', color: t.text }}>{value}</Txt>
    </View>
  );
}
