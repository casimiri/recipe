import React, { useState } from 'react';
import { View, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n';
import { useApp } from '../store/AppState';
import { useAuth } from '../store/auth';
import { uploadAvatar } from '../lib/repo';
import { Txt } from '../components/Txt';
import { Icon } from '../components/Icon';
import { Avatar, PrimaryButton, IconBtn } from '../components/atoms';

export default function EditProfile() {
  const { t } = useTheme();
  const { tr } = useI18n();
  const { profile, updateProfile } = useApp();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [bio, setBio] = useState(profile.bio);
  const [avatar, setAvatar] = useState(profile.avatar);
  // base64 of a freshly picked avatar, uploaded to Storage on save so it syncs
  // across devices; null means the avatar is unchanged (already a remote URL).
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [1, 1], base64: true });
    if (!res.canceled && res.assets[0]?.uri) {
      setAvatar(res.assets[0].uri); // local URI for instant preview
      setAvatarBase64(res.assets[0].base64 ?? null);
    }
  };

  const save = async () => {
    setBusy(true);
    // Upload a newly picked photo to Storage; on failure keep the local URI so
    // the rest of the profile still saves (it just won't sync across devices).
    let avatarUrl = avatar;
    if (avatarBase64 && user?.id) {
      const uploaded = await uploadAvatar(user.id, avatarBase64);
      if (uploaded) avatarUrl = uploaded;
    }
    await updateProfile({ name: name.trim(), handle: handle.trim(), bio: bio.trim(), avatar: avatarUrl });
    setBusy(false);
    router.back();
  };

  const field = (label: string, value: string, onChange: (v: string) => void, opts?: { multiline?: boolean; autoCapitalize?: 'none' | 'sentences' }) => (
    <View style={{ marginBottom: 18 }}>
      <Txt style={{ fontSize: 12.5, fontWeight: '700', color: t.muted, marginBottom: 8 }}>{label}</Txt>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={opts?.multiline}
        autoCapitalize={opts?.autoCapitalize ?? 'sentences'}
        placeholderTextColor={t.faint}
        style={{
          backgroundColor: t.surface2, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
          fontSize: 15, color: t.text, fontFamily: t.body, borderWidth: 1, borderColor: t.border,
          minHeight: opts?.multiline ? 88 : undefined, textAlignVertical: opts?.multiline ? 'top' : 'center',
        }}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 6, paddingBottom: insets.bottom + 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <Txt style={{ fontWeight: '800', fontSize: 23, color: t.text }}>{tr((s) => s.editProfile.title)}</Txt>
          <IconBtn t={t} onPress={() => router.back()}><Icon.x size={20} sw={2.4} color={t.text} /></IconBtn>
        </View>

        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Pressable onPress={pickAvatar}>
            <Avatar src={avatar} size={92} ring t={t} />
            <View style={{ position: 'absolute', right: -2, bottom: -2, width: 32, height: 32, borderRadius: 16, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: t.bg }}>
              <Icon.camera size={16} sw={2} color={t.accentText} />
            </View>
          </Pressable>
        </View>

        {field(tr((s) => s.editProfile.name), name, setName)}
        {field(tr((s) => s.editProfile.handle), handle, setHandle, { autoCapitalize: 'none' })}
        {field(tr((s) => s.editProfile.bio), bio, setBio, { multiline: true })}

        <PrimaryButton t={t} full onPress={save} disabled={busy || !name.trim()} style={{ marginTop: 8, paddingVertical: 16 }}>
          {busy ? tr((s) => s.editProfile.saving) : tr((s) => s.editProfile.saveChanges)}
        </PrimaryButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
