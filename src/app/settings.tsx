import React, { useState } from 'react';
import { View, Pressable, Share, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n, LANGS } from '../i18n';
import { useAuth } from '../store/auth';
import { useApp } from '../store/AppState';
import { Txt } from '../components/Txt';
import { Icon } from '../components/Icon';
import { Screen, ScreenHeader } from '../components/Screen';
import { Sheet, Tag, PrimaryButton } from '../components/atoms';
import { Paywall } from '../components/Paywall';
import { formatPrice } from '../lib/repo';
import { recipesHtml } from '../lib/share';
import { FILTERS, TASTES } from '../data/seed';
import { ACCENTS } from '../theme/tokens';
import type { Tokens } from '../theme/tokens';

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
  const { t, accent, darkPref, setAccent, setDarkPref } = useTheme();
  const { tr, lang, setLang } = useI18n();
  const { configured, signOut, deleteAccount } = useAuth();
  const { diet, setDiet, tastes, setTastes, units, setUnits, profile, saved, byId, pro, proRenewsAt, priceCents, currency } = useApp();
  const router = useRouter();
  const [dietOpen, setDietOpen] = useState(false);
  const [tastesOpen, setTastesOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const toggleDiet = (d: string) =>
    setDiet(diet.includes(d) ? diet.filter((x) => x !== d) : [...diet, d]);
  const dietLabel = diet.length === 0
    ? tr((s) => s.settings.dietAny)
    : diet.length === 1 ? diet[0] : tr((s) => s.settings.dietSelected, { count: diet.length });
  const toggleTaste = (taste: string) =>
    setTastes(tastes.includes(taste) ? tastes.filter((x) => x !== taste) : [...tastes, taste]);
  const tastesLabel = tastes.length === 0
    ? tr((s) => s.settings.tastesNone)
    : tastes.length === 1 ? tastes[0] : tr((s) => s.settings.tastesSelected, { count: tastes.length });
  const langLabel = LANGS.find((l) => l.code === lang)?.native ?? 'English';

  // Export the user's created + saved recipes as a single PDF via the OS share sheet.
  const exportRecipes = async () => {
    if (exporting) return;
    const ids = [...new Set([...profile.created, ...saved])];
    const list = ids.map(byId).filter(Boolean) as NonNullable<ReturnType<typeof byId>>[];
    if (!list.length) return;
    setExporting(true);
    try {
      const html = recipesHtml(list, `${profile.name}'s Recipes`, units);
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      }
    } catch {
      // user dismissed the share sheet or export is unsupported here
    } finally {
      setExporting(false);
    }
  };

  const card = { backgroundColor: t.surface, borderRadius: t.radius, borderWidth: 1, borderColor: t.border, overflow: 'hidden' as const };
  const sectionLabel = { fontSize: 12.5, fontWeight: '800' as const, color: t.muted, textTransform: 'uppercase' as const, letterSpacing: 0.6, marginBottom: 10 };

  return (
    <Screen>
      <ScreenHeader title={tr((s) => s.settings.title)} onBack={() => router.back()} />

      {/* Appearance — the canonical Sunny theme picker */}
      <View style={{ marginBottom: 24 }}>
        <Txt style={sectionLabel}>{tr((s) => s.settings.appearance)}</Txt>
        <View style={card}>
          <View style={{ paddingVertical: 15, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: t.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon.moon size={19} sw={2} color={t.accent} />
              </View>
              <Txt style={{ flex: 1, fontSize: 15, color: t.text, fontWeight: '500' }}>{tr((s) => s.settings.darkMode)}</Txt>
            </View>
            <View style={{ flexDirection: 'row', backgroundColor: t.surface2, borderRadius: 999, padding: 4, gap: 4 }}>
              {([['system', 'themeSystem'], ['light', 'themeLight'], ['dark', 'themeDark']] as const).map(([mode, key]) => {
                const on = darkPref === mode;
                return (
                  <Pressable key={mode} onPress={() => setDarkPref(mode)} style={{ flex: 1, paddingVertical: 9, borderRadius: 999, alignItems: 'center', backgroundColor: on ? t.surface : 'transparent', ...(on ? { boxShadow: t.shadow } : {}) }}>
                    <Txt style={{ fontSize: 13, fontWeight: '700', color: on ? t.text : t.muted }}>{tr((s) => s.settings[key])}</Txt>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={{ paddingVertical: 15, paddingHorizontal: 16 }}>
            <Txt style={{ fontSize: 15, color: t.text, fontWeight: '500', marginBottom: 12 }}>{tr((s) => s.settings.accentColour)}</Txt>
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
        <Txt style={sectionLabel}>{tr((s) => s.settings.preferences)}</Txt>
        <View style={card}>
          <Row icon="globe" label={tr((s) => s.settings.units)} t={t}
            right={<Txt style={{ fontSize: 13.5, color: t.muted }}>{units === 'metric' ? tr((s) => s.settings.metric) : tr((s) => s.settings.imperial)}</Txt>}
            onPress={() => setUnits(units === 'metric' ? 'imperial' : 'metric')} />
          <Row icon="globe" label={tr((s) => s.settings.language)} t={t}
            right={<Txt style={{ fontSize: 13.5, color: t.muted }}>{langLabel}</Txt>}
            onPress={() => setLangOpen(true)} />
          <Row icon="leaf" label={tr((s) => s.settings.dietary)} t={t} right={<Txt style={{ fontSize: 13.5, color: t.muted }}>{dietLabel}</Txt>} onPress={() => setDietOpen(true)} />
          <Row icon="sparkle" label={tr((s) => s.settings.tastes)} t={t} right={<Txt style={{ fontSize: 13.5, color: t.muted }}>{tastesLabel}</Txt>} onPress={() => setTastesOpen(true)} last />
        </View>
      </View>

      <View style={{ marginBottom: 24 }}>
        <Txt style={sectionLabel}>{tr((s) => s.settings.account)}</Txt>
        <View style={card}>
          <Row icon="user" label={tr((s) => s.settings.editProfile)} t={t} onPress={() => router.push('/edit-profile')} />
          <Row icon="bell" label={tr((s) => s.settings.notifications)} t={t} onPress={() => router.push('/notifications')} />
          <Row icon="download" label={exporting ? tr((s) => s.settings.preparingPdf) : tr((s) => s.settings.exportRecipes)} t={t} onPress={exportRecipes} last />
        </View>
      </View>

      <View style={{ marginBottom: 24 }}>
        <Txt style={sectionLabel}>Recipe-Snap</Txt>
        <View style={card}>
          <Row icon="sparkle" label={tr((s) => s.pro.title)} t={t}
            right={<Txt style={{ fontSize: 13.5, fontWeight: pro ? '700' : '400', color: pro ? t.accent : t.muted }}>{pro ? (proRenewsAt ? tr((s) => s.pro.until, { date: new Date(proRenewsAt).toLocaleDateString() }) : tr((s) => s.pro.active)) : tr((s) => s.pro.manageFree, { price: formatPrice(priceCents, currency) })}</Txt>}
            onPress={() => setPayOpen(true)} />
          <Row icon="share" label={tr((s) => s.settings.invite)} t={t}
            onPress={() => Share.share({ message: tr((s) => s.settings.inviteMessage) }).catch(() => {})} last />
        </View>
      </View>

      {configured ? (
        <View style={{ gap: 12 }}>
          <Pressable onPress={async () => { await signOut(); router.replace('/auth'); }} style={{ ...card, padding: 16, alignItems: 'center' }}>
            <Txt style={{ color: t.danger, fontWeight: '700', fontSize: 15 }}>{tr((s) => s.settings.signOut)}</Txt>
          </Pressable>
          <Pressable
            onPress={() => Alert.alert(
              tr((s) => s.settings.deleteAccount),
              tr((s) => s.settings.deleteAccountConfirm),
              [
                { text: tr((s) => s.common.cancel), style: 'cancel' },
                { text: tr((s) => s.settings.deleteAccount), style: 'destructive', onPress: async () => { await deleteAccount(); router.replace('/auth'); } },
              ],
            )}
            style={{ padding: 16, alignItems: 'center' }}>
            <Txt style={{ color: t.muted, fontWeight: '600', fontSize: 13.5 }}>{tr((s) => s.settings.deleteAccount)}</Txt>
          </Pressable>
        </View>
      ) : null}

      <Sheet open={dietOpen} onClose={() => setDietOpen(false)} t={t} title={tr((s) => s.settings.dietary)}>
        <Txt style={{ fontSize: 13.5, color: t.muted, lineHeight: 20, marginBottom: 16 }}>
          Recipes across the app will be limited to ones matching every preference you pick.
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          {FILTERS.diet.map((d) => <Tag key={d} t={t} active={diet.includes(d)} onPress={() => toggleDiet(d)}>{d}</Tag>)}
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <PrimaryButton t={t} ghost full onPress={() => setDiet([])}>{tr((s) => s.common.clear)}</PrimaryButton>
          <PrimaryButton t={t} full onPress={() => setDietOpen(false)}>{tr((s) => s.common.done)}</PrimaryButton>
        </View>
      </Sheet>

      <Sheet open={tastesOpen} onClose={() => setTastesOpen(false)} t={t} title={tr((s) => s.settings.tastes)}>
        <Txt style={{ fontSize: 13.5, color: t.muted, lineHeight: 20, marginBottom: 16 }}>{tr((s) => s.settings.tastesHint)}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          {TASTES.map((taste) => <Tag key={taste} t={t} active={tastes.includes(taste)} onPress={() => toggleTaste(taste)}>{taste}</Tag>)}
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <PrimaryButton t={t} ghost full onPress={() => setTastes([])}>{tr((s) => s.common.clear)}</PrimaryButton>
          <PrimaryButton t={t} full onPress={() => setTastesOpen(false)}>{tr((s) => s.common.done)}</PrimaryButton>
        </View>
      </Sheet>

      <Paywall open={payOpen} onClose={() => setPayOpen(false)} />

      <Sheet open={langOpen} onClose={() => setLangOpen(false)} t={t} title={tr((s) => s.settings.chooseLanguage)}>
        <View style={{ gap: 4, marginBottom: 8 }}>
          {LANGS.map((l) => {
            const active = l.code === lang;
            return (
              <Pressable key={l.code} onPress={() => { setLang(l.code); setLangOpen(false); }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, borderRadius: t.radiusSm + 4, backgroundColor: active ? t.accentSoft : 'transparent' }}>
                <View style={{ flex: 1 }}>
                  <Txt style={{ fontSize: 15.5, fontWeight: '600', color: t.text }}>{l.native}</Txt>
                  <Txt style={{ fontSize: 12.5, color: t.muted }}>{l.label}</Txt>
                </View>
                {active ? <Icon.check size={20} sw={2.6} color={t.accent} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </Screen>
  );
}
