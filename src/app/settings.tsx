import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../store/auth';
import { useApp } from '../store/AppState';
import { Txt } from '../components/Txt';
import { Icon } from '../components/Icon';
import { Screen, ScreenHeader } from '../components/Screen';
import { Sheet, Tag, PrimaryButton } from '../components/atoms';
import { FILTERS } from '../data/seed';
import { ACCENTS } from '../theme/tokens';
import type { Tokens } from '../theme/tokens';

function Toggle({ value, onPress, t }: { value: boolean; onPress: () => void; t: Tokens }) {
  return (
    <Pressable onPress={onPress} style={{ width: 48, height: 28, borderRadius: 999, backgroundColor: value ? t.accent : t.borderStrong, justifyContent: 'center' }}>
      <View style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </Pressable>
  );
}

function Row({ icon, label, t, right, onPress, last }: { icon: keyof typeof Icon; label: string; t: Tokens; right?: React.ReactNode; onPress?: () => void; last?: boolean }) {
  const I = Icon[icon];
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 15, paddingHorizontal: 16, borderBottomWidth: last ? 0 : 1, borderBottomColor: t.border }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
        <I size={19} sw={2} color={t.accent} />
      </View>
      <Txt style={{ flex: 1, fontSize: 15, color: t.text, fontWeight: '500' }}>{label}</Txt>
      {right ?? <Icon.chevR size={18} sw={2} color={t.faint} />}
    </Pressable>
  );
}

export default function Settings() {
  const { t, accent, isDark, setAccent, toggleDark } = useTheme();
  const { configured, signOut } = useAuth();
  const { diet, setDiet } = useApp();
  const router = useRouter();
  const [dietOpen, setDietOpen] = useState(false);

  const toggleDiet = (d: string) =>
    setDiet(diet.includes(d) ? diet.filter((x) => x !== d) : [...diet, d]);
  const dietLabel = diet.length === 0 ? 'Any' : diet.length === 1 ? diet[0] : `${diet.length} selected`;

  const card = { backgroundColor: t.surface, borderRadius: t.radius, borderWidth: 1, borderColor: t.border, overflow: 'hidden' as const };
  const sectionLabel = { fontSize: 12.5, fontWeight: '800' as const, color: t.muted, textTransform: 'uppercase' as const, letterSpacing: 0.6, marginBottom: 10 };

  return (
    <Screen>
      <ScreenHeader title="Settings" onBack={() => router.back()} />

      {/* Appearance — the canonical Sunny theme picker */}
      <View style={{ marginBottom: 24 }}>
        <Txt style={sectionLabel}>Appearance</Txt>
        <View style={card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 15, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: t.border }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon.moon size={19} sw={2} color={t.accent} />
            </View>
            <Txt style={{ flex: 1, fontSize: 15, color: t.text, fontWeight: '500' }}>Dark mode</Txt>
            <Toggle value={isDark} onPress={toggleDark} t={t} />
          </View>
          <View style={{ paddingVertical: 15, paddingHorizontal: 16 }}>
            <Txt style={{ fontSize: 15, color: t.text, fontWeight: '500', marginBottom: 12 }}>Accent colour</Txt>
            <View style={{ flexDirection: 'row', gap: 14 }}>
              {ACCENTS.map((a) => (
                <Pressable key={a} onPress={() => setAccent(a)} style={{
                  width: 38, height: 38, borderRadius: 19, backgroundColor: a, alignItems: 'center', justifyContent: 'center',
                  borderWidth: accent === a ? 3 : 0, borderColor: t.surface,
                  ...(accent === a ? { boxShadow: `0 0 0 2px ${a}` } : {}),
                }}>
                  {accent === a ? <Icon.check size={18} sw={3} color="#fff" /> : null}
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={{ marginBottom: 24 }}>
        <Txt style={sectionLabel}>Preferences</Txt>
        <View style={card}>
          <Row icon="globe" label="Units" t={t} right={<Txt style={{ fontSize: 13.5, color: t.muted }}>Metric</Txt>} />
          <Row icon="leaf" label="Dietary preferences" t={t} right={<Txt style={{ fontSize: 13.5, color: t.muted }}>{dietLabel}</Txt>} onPress={() => setDietOpen(true)} last />
        </View>
      </View>

      <View style={{ marginBottom: 24 }}>
        <Txt style={sectionLabel}>Account</Txt>
        <View style={card}>
          <Row icon="user" label="Edit profile" t={t} onPress={() => router.push('/edit-profile')} />
          <Row icon="bell" label="Notifications" t={t} onPress={() => router.push('/notifications')} />
          <Row icon="download" label="Export my recipes" t={t} last />
        </View>
      </View>

      <View style={{ marginBottom: 24 }}>
        <Txt style={sectionLabel}>Recipe-Snap</Txt>
        <View style={card}>
          <Row icon="sparkle" label="Upgrade to Pro" t={t} right={<Txt style={{ fontSize: 13.5, color: t.muted }}>AI imports</Txt>} />
          <Row icon="share" label="Invite friends" t={t} last />
        </View>
      </View>

      {configured ? (
        <Pressable onPress={async () => { await signOut(); router.replace('/auth'); }} style={{ ...card, padding: 16, alignItems: 'center' }}>
          <Txt style={{ color: t.danger, fontWeight: '700', fontSize: 15 }}>Sign out</Txt>
        </Pressable>
      ) : null}

      <Sheet open={dietOpen} onClose={() => setDietOpen(false)} t={t} title="Dietary preferences">
        <Txt style={{ fontSize: 13.5, color: t.muted, lineHeight: 20, marginBottom: 16 }}>
          Recipes across the app will be limited to ones matching every preference you pick.
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          {FILTERS.diet.map((d) => <Tag key={d} t={t} active={diet.includes(d)} onPress={() => toggleDiet(d)}>{d}</Tag>)}
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <PrimaryButton t={t} ghost full onPress={() => setDiet([])}>Clear</PrimaryButton>
          <PrimaryButton t={t} full onPress={() => setDietOpen(false)}>Done</PrimaryButton>
        </View>
      </Sheet>
    </Screen>
  );
}
