import React, { useState } from 'react';
import { View, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n';
import { useAuth } from '../store/auth';
import { Txt } from '../components/Txt';
import { Icon } from '../components/Icon';
import { PrimaryButton } from '../components/atoms';

export default function Auth() {
  const { t } = useTheme();
  const { tr } = useI18n();
  const { signIn, signUp, resetPassword } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const forgot = async () => {
    setError(null); setNotice(null);
    if (!email.trim()) { setError(tr((s) => s.auth.enterEmail)); return; }
    const res = await resetPassword(email);
    if (res.error) setError(res.error);
    else setNotice(tr((s) => s.auth.resetSent));
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = mode === 'in' ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setBusy(false);
    if (res.error) setError(res.error);
    else router.replace('/(tabs)');
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
        <Txt style={{ fontWeight: '800', fontSize: 24, color: t.text, marginBottom: 6 }}>
          {mode === 'in' ? tr((s) => s.auth.welcomeBack) : tr((s) => s.auth.createAccountTitle)}
        </Txt>
        <Txt style={{ fontSize: 14.5, color: t.muted, marginBottom: 24 }}>
          {mode === 'in' ? tr((s) => s.auth.signInSubtitle) : tr((s) => s.auth.signUpSubtitle)}
        </Txt>

        <View style={{ gap: 12, marginBottom: 8 }}>
          <TextInput value={email} onChangeText={setEmail} placeholder={tr((s) => s.auth.email)} placeholderTextColor={t.faint}
            autoCapitalize="none" keyboardType="email-address" autoComplete="email" style={inputStyle} />
          <TextInput value={password} onChangeText={setPassword} placeholder={tr((s) => s.auth.password)} placeholderTextColor={t.faint}
            secureTextEntry autoCapitalize="none" style={inputStyle} />
        </View>

        {error ? <Txt style={{ color: t.danger, fontSize: 13, marginBottom: 8, marginTop: 4 }}>{error}</Txt> : null}
        {notice ? <Txt style={{ color: t.accent, fontSize: 13, marginBottom: 8, marginTop: 4, fontWeight: '600' }}>{notice}</Txt> : null}

        {mode === 'in' ? (
          <Pressable onPress={forgot} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
            <Txt style={{ color: t.muted, fontSize: 13, fontWeight: '600' }}>{tr((s) => s.auth.forgot)}</Txt>
          </Pressable>
        ) : null}

        <PrimaryButton t={t} full onPress={submit} disabled={busy || !email || !password} style={{ marginTop: 16, paddingVertical: 16 }}>
          {busy ? tr((s) => s.auth.pleaseWait) : mode === 'in' ? tr((s) => s.auth.signIn) : tr((s) => s.auth.signUp)}
        </PrimaryButton>

        <Pressable onPress={() => { setMode(mode === 'in' ? 'up' : 'in'); setError(null); }} style={{ alignItems: 'center', marginTop: 18 }}>
          <Txt style={{ color: t.muted, fontSize: 14 }}>
            {mode === 'in' ? tr((s) => s.auth.noAccountInline) : tr((s) => s.auth.haveAccountInline)}
            <Txt style={{ color: t.accent, fontWeight: '700' }}>{mode === 'in' ? tr((s) => s.auth.signUp) : tr((s) => s.auth.signIn)}</Txt>
          </Txt>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
