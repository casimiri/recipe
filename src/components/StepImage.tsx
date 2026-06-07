// Cook-mode step illustration: shows the cached AI picture for a step if one
// exists (deterministic public URL — free, no backend call), otherwise offers a
// quota-gated "Illustrate this step" button that generates one via the
// step-image edge function. Mirrors the ingredient-image flow.
import React, { useEffect, useState } from 'react';
import { View, Image, Pressable, ActivityIndicator } from 'react-native';
import { useI18n } from '../i18n';
import { useApp } from '../store/AppState';
import { useAuth } from '../store/auth';
import { Txt } from './Txt';
import { Icon } from './Icon';
import { stepImage, stepImageUrl } from '../lib/ai';
import type { Recipe } from '../data/types';
import type { Tokens } from '../theme/tokens';

type Status = 'probing' | 'shown' | 'missing' | 'generating' | 'error';

export function StepImage({ recipe, index, step, t, onPaywall }: {
  recipe: Recipe; index: number; step: { t: string; d: string }; t: Tokens; onPaywall: () => void;
}) {
  const { tr } = useI18n();
  const { canUseAi, recordAiUse } = useApp();
  const { session } = useAuth();
  const base = stepImageUrl(recipe.id, index, step);
  const [status, setStatus] = useState<Status>('probing');
  const [bust, setBust] = useState(0);

  // Re-probe whenever the step (or its text) changes.
  useEffect(() => {
    setStatus('probing');
    setBust((b) => b + 1);
  }, [recipe.id, index, step.t, step.d]);

  if (!base) return null; // offline / no backend → no illustration feature

  const generate = async () => {
    // Guests are gated client-side; signed-in users are gated server-side.
    if (!session && !canUseAi) { onPaywall(); return; }
    setStatus('generating');
    const res = await stepImage({ recipeId: recipe.id, index, title: step.t, desc: step.d, recipeTitle: recipe.title });
    if (res.quotaExceeded) { onPaywall(); setStatus('missing'); return; }
    if (!res.url) { setStatus('error'); return; }
    if (res.generated) recordAiUse();
    setBust((b) => b + 1); // reload the now-uploaded image
    setStatus('probing');
  };

  const box = { width: '100%' as const, height: 200, borderRadius: t.radius, marginBottom: 22, overflow: 'hidden' as const, backgroundColor: t.surface2 };

  // The image is mounted while probing (hidden) and when shown, so the load
  // events drive the state machine.
  if (status === 'probing' || status === 'shown') {
    return (
      <View style={box}>
        <Image
          key={bust}
          source={{ uri: `${base}?b=${bust}` }}
          onLoad={() => setStatus('shown')}
          onError={() => setStatus('missing')}
          style={{ width: '100%', height: '100%', opacity: status === 'shown' ? 1 : 0 }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={[box, { alignItems: 'center', justifyContent: 'center', gap: 10 }]}>
      {status === 'generating' ? (
        <>
          <ActivityIndicator color={t.accent} />
          <Txt style={{ color: t.muted, fontSize: 13 }}>{tr((s) => s.cook.generatingStep)}</Txt>
        </>
      ) : status === 'error' ? (
        <>
          <Txt style={{ color: t.muted, fontSize: 13.5, textAlign: 'center', paddingHorizontal: 24 }}>{tr((s) => s.cook.stepImageFailed)}</Txt>
          <Pressable onPress={generate} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, backgroundColor: t.accent }}>
            <Icon.refresh size={16} sw={2} color={t.accentText} />
            <Txt style={{ color: t.accentText, fontWeight: '700', fontSize: 14 }}>{tr((s) => s.cook.illustrateStep)}</Txt>
          </Pressable>
        </>
      ) : (
        <Pressable onPress={generate} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999, backgroundColor: t.accent }}>
          <Icon.sparkle size={17} sw={2} color={t.accentText} />
          <Txt style={{ color: t.accentText, fontWeight: '700', fontSize: 14.5 }}>{tr((s) => s.cook.illustrateStep)}</Txt>
        </Pressable>
      )}
    </View>
  );
}
