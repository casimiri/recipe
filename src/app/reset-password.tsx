import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n';
import { useAuth } from '../store/auth';
import { supabase } from '../lib/supabase';
import { Txt } from '../components/Txt';
import { Icon } from '../components/Icon';
import { PrimaryButton } from '../components/atoms';

/** Pull the recovery tokens from a deep link (implicit flow = URL fragment, PKCE = query). */
function parseTokens(url: string | null) {
  if (!url) return null;
  const raw = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
  if (!raw) return null;
  const p = new URLSearchParams(raw);
  const access_token = p.get('access_token');
  const refresh_token = p.get('refresh_token');
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token, type: p.get('type') };
}

export default function ResetPassword() {
  const { t } = useTheme();
  const { tr } = useI18n();
  const { updatePassword } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const url = Linking.useURL();
  const [phase, setPhase] = useState<'checking' | 'ready' | 'invalid'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const consumed = useRef(false);

  // Establish the (temporary) recovery session from the link before allowing a reset.
  useEffect(() => {
    if (consumed.current) return;
    const toks = parseTokens(url);
    if (!toks || toks.type !== 'recovery') {
      if (url) setPhase('invalid'); // a URL arrived but carried no recovery token
      return;
    }
    consumed.current = true;
    (async () => {
      if (!supabase) { setPhase('invalid'); return; }
      const { error: e } = await supabase.auth.setSession({
        access_token: toks.access_token,
        refresh_token: toks.refresh_token,
      });
      setPhase(e ? 'invalid' : 'ready');
    })();
  }, [url]);

  const submit = async () => {
    setError(null);
    if (password.length < 6) { setError(tr((s) => s.auth.passwordTooShort)); return; }
    if (password !== confirm) { setError(tr((s) => s.auth.passwordMismatch)); return; }
    setBusy(true);
    const res = await updatePassword(password);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    // The recovery session is now a full session — go straight into the app.
    router.replace('/(tabs)');
  };

  const inputStyle = {
    backgroundColor: t.surface2, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 15,
    fontSize: 15, color: t.text, fontFamily: t.body, borderWidth: 1, borderColor: t.border,
  } as const;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Icon.forkknife size={26} sw={2} color={t.accentText} />
          </View>
          <Txt style={{ fontWeight: '800', fontSize: 26, color: t.text }}>Recipe-Snap</Txt>
        </View>

        {phase === 'checking' ? (
          <ActivityIndicator color={t.accent} />
        ) : phase === 'invalid' ? (
          <>
            <Txt style={{ fontWeight: '800', fontSize: 22, color: t.text, marginBottom: 8 }}>{tr((s) => s.auth.newPasswordTitle)}</Txt>
            <Txt style={{ fontSize: 14.5, color: t.danger, marginBottom: 24 }}>{tr((s) => s.auth.linkInvalid)}</Txt>
            <PrimaryButton t={t} full onPress={() => router.replace('/auth')} style={{ paddingVertical: 16 }}>
              {tr((s) => s.auth.backToSignIn)}
            </PrimaryButton>
          </>
        ) : (
          <>
            <Txt style={{ fontWeight: '800', fontSize: 24, color: t.text, marginBottom: 6 }}>{tr((s) => s.auth.newPasswordTitle)}</Txt>
            <Txt style={{ fontSize: 14.5, color: t.muted, marginBottom: 24 }}>{tr((s) => s.auth.newPasswordSubtitle)}</Txt>

            <View style={{ gap: 12, marginBottom: 8 }}>
              <TextInput value={password} onChangeText={setPassword} placeholder={tr((s) => s.auth.newPassword)} placeholderTextColor={t.faint}
                secureTextEntry autoCapitalize="none" style={inputStyle} />
              <TextInput value={confirm} onChangeText={setConfirm} placeholder={tr((s) => s.auth.confirmPassword)} placeholderTextColor={t.faint}
                secureTextEntry autoCapitalize="none" style={inputStyle} />
            </View>

            {error ? <Txt style={{ color: t.danger, fontSize: 13, marginBottom: 8, marginTop: 4 }}>{error}</Txt> : null}

            <PrimaryButton t={t} full onPress={submit} disabled={busy || !password || !confirm} style={{ marginTop: 16, paddingVertical: 16 }}>
              {busy ? tr((s) => s.auth.pleaseWait) : tr((s) => s.auth.updatePassword)}
            </PrimaryButton>

            <Pressable onPress={() => router.replace('/auth')} style={{ alignItems: 'center', marginTop: 18 }}>
              <Txt style={{ color: t.muted, fontSize: 14 }}>{tr((s) => s.auth.backToSignIn)}</Txt>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
