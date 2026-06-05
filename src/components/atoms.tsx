// atoms.tsx — shared UI building blocks ported from the design's theme.jsx.
import React, { useState } from 'react';
import {
  View, Pressable, Modal, ScrollView, ViewStyle, StyleProp, TextStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt } from './Txt';
import { Icon } from './Icon';
import type { Tokens } from '../theme/tokens';
import type { RecipeSource } from '../data/types';

const FALLBACKS = ['#F5C242', '#EFA94A', '#E8743B', '#D8B26A', '#C99A3F', '#E0A050'];

/** Image tile with a graceful gradient fallback if the image fails to load. */
export function Dish({
  src, alt = '', radius = 0, style, children,
}: {
  src?: string; alt?: string; radius?: number; style?: StyleProp<ViewStyle>; children?: React.ReactNode;
}) {
  const [err, setErr] = useState(false);
  const a = (alt || '').length;
  const fb: [string, string] = [FALLBACKS[a % FALLBACKS.length], FALLBACKS[(a + 2) % FALLBACKS.length]];
  return (
    <View style={[{ overflow: 'hidden', borderRadius: radius, backgroundColor: fb[0] }, style]}>
      <LinearGradient colors={fb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      {!err && !!src && (
        <Image source={{ uri: src }} onError={() => setErr(true)} contentFit="cover" transition={180}
          style={{ width: '100%', height: '100%' }} />
      )}
      {err && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Icon.forkknife size={34} sw={1.6} color="rgba(255,255,255,0.85)" />
        </View>
      )}
      {children}
    </View>
  );
}

export function Avatar({ src, size = 40, ring, t }: { src?: string; size?: number; ring?: boolean; t: Tokens }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2, overflow: 'hidden',
      backgroundColor: t.surface2,
      borderWidth: ring ? 2 : 0, borderColor: t.accent,
    }}>
      <Dish src={src} alt="avatar" radius={size / 2} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

export function Stars({ value, size = 13, t }: { value: number; size?: number; t: Tokens }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={{ opacity: value >= i + 0.5 ? 1 : 0.25 }}>
          <Icon.star size={size} color={t.star} />
        </View>
      ))}
    </View>
  );
}

export function RatingBadge({ value, t, style }: { value: number; t: Tokens; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{
      flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.accent,
      paddingVertical: 5, paddingHorizontal: 9, borderRadius: 999,
    }, style]}>
      <Icon.star size={12} color={t.accentText} />
      <Txt style={{ color: t.accentText, fontWeight: '700', fontSize: 12.5 }}>{value}</Txt>
    </View>
  );
}

export function Tag({
  children, t, active, onPress,
}: { children: React.ReactNode; t: Tokens; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{
      backgroundColor: active ? t.accent : t.surface2,
      paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999,
    }}>
      <Txt style={{ color: active ? t.accentText : t.muted, fontSize: 12.5, fontWeight: '600' }}>{children}</Txt>
    </Pressable>
  );
}

export function PrimaryButton({
  children, t, onPress, style, ghost, full, icon, disabled,
}: {
  children: React.ReactNode; t: Tokens; onPress?: () => void; style?: StyleProp<ViewStyle>;
  ghost?: boolean; full?: boolean; icon?: React.ReactNode; disabled?: boolean;
}) {
  return (
    <Pressable onPress={disabled ? undefined : onPress} style={({ pressed }) => [{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
      width: full ? '100%' : undefined,
      borderWidth: ghost ? 1.5 : 0, borderColor: t.borderStrong,
      backgroundColor: ghost ? 'transparent' : t.accent,
      paddingVertical: 15, paddingHorizontal: 22, borderRadius: 999,
      opacity: disabled ? 0.5 : 1,
      transform: [{ scale: pressed ? 0.97 : 1 }],
      ...(ghost ? {} : { boxShadow: `0 6px 18px ${t.withA(t.accent, 0.32)}` }),
    }, style]}>
      {icon}
      <Txt style={{ color: ghost ? t.text : t.accentText, fontSize: 15.5, fontWeight: '700' }}>{children}</Txt>
    </Pressable>
  );
}

export function IconBtn({
  children, t, onPress, glass, size = 44, style, active,
}: {
  children: React.ReactNode; t: Tokens; onPress?: () => void; glass?: boolean;
  size?: number; style?: StyleProp<ViewStyle>; active?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[{
      width: size, height: size, borderRadius: size / 2,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: active ? t.accent : (glass ? t.withA(t.surface, 0.82) : t.surface2),
      ...(glass ? { boxShadow: '0 2px 10px rgba(0,0,0,0.12)' } : {}),
    }, style]}>
      {children}
    </Pressable>
  );
}

export function StatChip({
  icon, value, label, t, vertical,
}: { icon: React.ReactNode; value?: React.ReactNode; label?: string; t: Tokens; vertical?: boolean }) {
  if (vertical) {
    return (
      <View style={{ alignItems: 'center', gap: 6, flex: 1 }}>
        <View style={{
          width: 52, height: 52, borderRadius: 26, backgroundColor: t.accentSoft,
          alignItems: 'center', justifyContent: 'center',
        }}>{icon}</View>
        <View style={{ alignItems: 'center' }}>
          {value != null && value !== '' && <Txt style={{ fontWeight: '800', fontSize: 15, color: t.text }}>{value}</Txt>}
          <Txt style={{ fontSize: 11, color: t.muted }}>{label}</Txt>
        </View>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      {icon}
      <Txt style={{ color: t.text, fontSize: 13, fontWeight: '600' }}>{value}</Txt>
      {label ? <Txt style={{ color: t.muted, fontSize: 13, fontWeight: '600' }}>{label}</Txt> : null}
    </View>
  );
}

export function SourceTag({ source, t, size = 13 }: { source: RecipeSource; t: Tokens; size?: number }) {
  const map: Record<string, keyof typeof Icon> = {
    instagram: 'instagram', tiktok: 'tiktok', youtube: 'youtube', url: 'link', manual: 'edit', pinterest: 'pin',
  };
  const Comp = Icon[map[source.kind] || 'link'];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Comp size={size + 2} sw={2} color={t.muted} />
      <Txt style={{ color: t.muted, fontSize: size, fontWeight: '600' }}>{source.handle}</Txt>
    </View>
  );
}

/** Bottom sheet (modal, slides up with a scrim). */
export function Sheet({
  open, onClose, t, children, title,
}: { open: boolean; onClose: () => void; t: Tokens; children: React.ReactNode; title?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} />
      <View style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: t.surface,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingTop: 12, paddingHorizontal: 20, paddingBottom: 28 + insets.bottom,
        maxHeight: '88%', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
      }}>
        <View style={{ width: 38, height: 5, borderRadius: 3, backgroundColor: t.borderStrong, alignSelf: 'center', marginTop: 4, marginBottom: 16 }} />
        {title ? <Txt style={{ fontWeight: '800', fontSize: 21, color: t.text, marginBottom: 14 }}>{title}</Txt> : null}
        <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
      </View>
    </Modal>
  );
}

export function SectionHead({
  title, action, onAction, t, style,
}: { title: string; action?: string; onAction?: () => void; t: Tokens; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }, style]}>
      <Txt style={{ fontWeight: '800', fontSize: 21, color: t.text }}>{title}</Txt>
      {action ? (
        <Pressable onPress={onAction}>
          <Txt style={{ color: t.accent, fontWeight: '700', fontSize: 13.5 }}>{action}</Txt>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Linear-gradient overlay helper for image scrims. */
export function Scrim({ colors, style }: { colors: string[]; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient colors={colors as [string, string, ...string[]]}
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, style]} />
  );
}

export type { TextStyle };
