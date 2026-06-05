import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { useTheme } from '../../theme/ThemeProvider';
import { useApp } from '../../store/AppState';
import { Txt } from '../../components/Txt';
import { Icon } from '../../components/Icon';
import { Dish, IconBtn, PrimaryButton, Sheet } from '../../components/atoms';
import { fmtQty, mmss } from '../../utils/format';
import type { Tokens } from '../../theme/tokens';

function useCountdown(initial: number) {
  const [left, setLeft] = useState(initial);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => { setLeft(initial); setRunning(false); }, [initial]);
  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) { if (ref.current) clearInterval(ref.current); setRunning(false); return 0; }
        return l - 1;
      });
    }, 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);
  return {
    left, running, done: left === 0,
    toggle: () => setRunning((r) => !r),
    reset: () => { setLeft(initial); setRunning(false); },
  };
}

function CookTimer({ seconds, t }: { seconds: number; t: Tokens }) {
  const c = useCountdown(seconds);
  const pct = 1 - c.left / seconds;
  const R = 20, C = 2 * Math.PI * R;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: t.surface2, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 18 }}>
      <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={48} height={48} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={24} cy={24} r={R} fill="none" stroke={t.border} strokeWidth={4} />
          <Circle cx={24} cy={24} r={R} fill="none" stroke={t.accent} strokeWidth={4} strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct)} />
        </Svg>
        <Icon.timer size={18} sw={2} color={t.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt style={{ fontSize: 22, fontWeight: '800', color: c.done ? t.accent : t.text }}>{c.done ? 'Done!' : mmss(c.left)}</Txt>
        <Txt style={{ fontSize: 12, color: t.muted, fontWeight: '600' }}>Step timer</Txt>
      </View>
      <Pressable onPress={c.toggle} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
        {c.running ? <Icon.pause size={18} color={t.accentText} /> : <Icon.play size={18} color={t.accentText} />}
      </Pressable>
      <Pressable onPress={c.reset} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Icon.refresh size={17} sw={2} color={t.text} />
      </Pressable>
    </View>
  );
}

export default function CookMode() {
  useKeepAwake();
  const { t } = useTheme();
  const { byId, recipes } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = byId(String(id)) || recipes[0];

  const [i, setI] = useState(0);
  const [peek, setPeek] = useState(false);
  const step = r.steps[i];
  const last = i === r.steps.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: t.surface }}>
      {/* Top bar */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconBtn t={t} onPress={() => router.back()}><Icon.x size={20} sw={2.4} color={t.text} /></IconBtn>
        <View style={{ flex: 1 }}>
          <View style={{ height: 6, borderRadius: 999, backgroundColor: t.surface2, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${((i + 1) / r.steps.length) * 100}%`, backgroundColor: t.accent, borderRadius: 999 }} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.surface2, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 }}>
          <Icon.eye size={14} sw={2} color={t.muted} />
          <Txt style={{ fontSize: 12, fontWeight: '700', color: t.muted }}>On</Txt>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 10, paddingBottom: 20 }}>
        <Dish src={r.img} alt={r.title} radius={t.radius} style={{ width: '100%', height: 180, marginBottom: 22 }} />
        <Txt style={{ fontSize: 13, fontWeight: '700', color: t.accent, marginBottom: 8, letterSpacing: 1 }}>STEP {i + 1} OF {r.steps.length}</Txt>
        <Txt style={{ fontWeight: '800', fontSize: 26, lineHeight: 31, color: t.text, marginBottom: 14 }}>{step.t}</Txt>
        <Txt style={{ fontSize: 17, lineHeight: 27, color: t.text, marginBottom: 22 }}>{step.d}</Txt>
        {step.timer ? <CookTimer seconds={step.timer} t={t} /> : null}
      </ScrollView>

      {/* Bottom controls */}
      <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: insets.bottom + 18, borderTopWidth: 1, borderTopColor: t.border, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <IconBtn t={t} size={52} onPress={() => setPeek(true)} style={{ backgroundColor: t.surface2 }}><Icon.list size={22} sw={2} color={t.text} /></IconBtn>
        {i > 0 ? <PrimaryButton t={t} ghost onPress={() => setI(i - 1)} style={{ paddingHorizontal: 20 }}>Back</PrimaryButton> : null}
        <View style={{ flex: 1 }}>
          <PrimaryButton t={t} full
            icon={last ? <Icon.check size={18} sw={2.6} color={t.accentText} /> : undefined}
            onPress={() => (last ? router.replace({ pathname: '/cook-done', params: { id: r.id } }) : setI(i + 1))}>
            {last ? 'Finish' : 'Next step'}
          </PrimaryButton>
        </View>
      </View>

      <Sheet open={peek} onClose={() => setPeek(false)} t={t} title="Ingredients">
        {r.ingredients.map((ing, k) => (
          <View key={k} style={{ flexDirection: 'row', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: t.border }}>
            <Txt style={{ color: t.accent, fontWeight: '700', minWidth: 70, fontSize: 14.5 }}>{fmtQty(ing.qty)} {ing.unit}</Txt>
            <Txt style={{ fontSize: 14.5, color: t.text, flex: 1 }}>{ing.item}</Txt>
          </View>
        ))}
      </Sheet>
    </View>
  );
}
