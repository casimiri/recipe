import React, { useState } from 'react';
import { View, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n';
import { useApp } from '../store/AppState';
import { useAuth } from '../store/auth';
import { uploadRecipeImage } from '../lib/repo';
import { Txt } from '../components/Txt';
import { Icon } from '../components/Icon';
import { Dish, IconBtn, PrimaryButton } from '../components/atoms';
import type { Tokens } from '../theme/tokens';
import type { Ingredient, Step } from '../data/types';

// Editable rows keep qty as a string so the field can be cleared mid-edit.
type IngRow = { qty: string; unit: string; item: string; g: string };

export default function EditRecipe() {
  const { t } = useTheme();
  const { tr } = useI18n();
  const { byId, updateRecipe } = useApp();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = byId(String(id));

  const [img, setImg] = useState(r?.img ?? '');
  const [imgBusy, setImgBusy] = useState(false);
  const [title, setTitle] = useState(r?.title ?? '');
  const [desc, setDesc] = useState(r?.desc ?? '');
  const [time, setTime] = useState(String(r?.time ?? ''));
  const [servings, setServings] = useState(String(r?.servings ?? ''));
  const [ings, setIngs] = useState<IngRow[]>(
    (r?.ingredients ?? []).map((i) => ({ qty: i.qty ? String(i.qty) : '', unit: i.unit, item: i.item, g: i.g })),
  );
  const [steps, setSteps] = useState<{ t: string; d: string; timer?: number }[]>(
    (r?.steps ?? []).map((s) => ({ t: s.t, d: s.d, timer: s.timer })),
  );
  const [busy, setBusy] = useState(false);

  if (!r) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Txt style={{ color: t.muted }}>{tr((s) => s.common.nothingHere)}</Txt>
      </View>
    );
  }

  const setIng = (i: number, patch: Partial<IngRow>) => setIngs((xs) => xs.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const setStep = (i: number, patch: Partial<{ t: string; d: string }>) => setSteps((xs) => xs.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const addIng = () => setIngs((xs) => [...xs, { qty: '', unit: '', item: '', g: xs[0]?.g ?? '' }]);
  const addStep = () => setSteps((xs) => [...xs, { t: '', d: '' }]);

  // Pick a photo from the library and upload it to the recipe-images bucket.
  // Guests (or a failed upload) keep the device-local URI as a fallback.
  const pickPhoto = async () => {
    setImgBusy(true);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.6 });
      const asset = res.canceled ? null : res.assets[0];
      if (asset) {
        const uploaded = asset.base64 && user?.id ? await uploadRecipeImage(user.id, asset.base64) : null;
        setImg(uploaded ?? asset.uri);
      }
    } catch {
      // permission denied or picker error → keep the current image
    } finally {
      setImgBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    const ingredients: Ingredient[] = ings
      .filter((i) => i.item.trim())
      .map((i) => ({ qty: parseFloat(i.qty) || 0, unit: i.unit.trim(), item: i.item.trim(), g: i.g }));
    const cleanSteps: Step[] = steps
      .filter((s) => s.t.trim() || s.d.trim())
      .map((s) => ({ t: s.t.trim(), d: s.d.trim(), ...(s.timer ? { timer: s.timer } : {}) }));
    await updateRecipe(r.id, {
      img: img || r.img,
      title: title.trim() || r.title,
      desc: desc.trim(),
      time: parseInt(time, 10) || r.time,
      servings: parseInt(servings, 10) || r.servings,
      ingredients,
      steps: cleanSteps,
    });
    setBusy(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: insets.top + 6, paddingBottom: 10 }}>
        <IconBtn t={t} onPress={() => router.back()}><Icon.back size={22} sw={2.2} color={t.text} /></IconBtn>
        <Txt style={{ flex: 1, fontWeight: '800', fontSize: 19, color: t.text }}>{tr((s) => s.editRecipe.title)}</Txt>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}>
        <Pressable onPress={pickPhoto} disabled={imgBusy} style={{ marginTop: 4 }}>
          <Dish src={img} alt={title} radius={t.radius} style={{ width: '100%', height: 180 }} />
          <View style={{ position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 }}>
            <Icon.camera size={15} sw={2} color="#fff" />
            <Txt style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{imgBusy ? tr((s) => s.auth.pleaseWait) : tr((s) => s.editRecipe.changePhoto)}</Txt>
          </View>
        </Pressable>

        <Label t={t}>{tr((s) => s.editRecipe.titleField)}</Label>
        <Field t={t} value={title} onChange={setTitle} />

        <Label t={t}>{tr((s) => s.editRecipe.description)}</Label>
        <Field t={t} value={desc} onChange={setDesc} multiline />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Label t={t}>{tr((s) => s.editRecipe.time)}</Label>
            <Field t={t} value={time} onChange={setTime} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Label t={t}>{tr((s) => s.editRecipe.servings)}</Label>
            <Field t={t} value={servings} onChange={setServings} keyboardType="number-pad" />
          </View>
        </View>

        <Label t={t}>{tr((s) => s.editRecipe.ingredients)}</Label>
        <View style={{ gap: 8 }}>
          {ings.map((ing, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Field t={t} value={ing.qty} onChange={(v) => setIng(i, { qty: v })} keyboardType="numeric" style={{ width: 52 }} placeholder={tr((s) => s.editRecipe.qty)} />
              <Field t={t} value={ing.unit} onChange={(v) => setIng(i, { unit: v })} style={{ width: 64 }} placeholder={tr((s) => s.editRecipe.unit)} />
              <Field t={t} value={ing.item} onChange={(v) => setIng(i, { item: v })} style={{ flex: 1 }} placeholder={tr((s) => s.editRecipe.item)} />
              <Pressable onPress={() => setIngs((xs) => xs.filter((_, k) => k !== i))} hitSlop={6} style={{ padding: 4 }}>
                <Icon.trash size={17} sw={2} color={t.faint} />
              </Pressable>
            </View>
          ))}
        </View>
        <AddRow t={t} label={tr((s) => s.editRecipe.addIngredient)} onPress={addIng} />

        <Label t={t}>{tr((s) => s.editRecipe.steps)}</Label>
        <View style={{ gap: 12 }}>
          {steps.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
                <Txt style={{ color: t.accent, fontWeight: '800', fontSize: 13 }}>{i + 1}</Txt>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Field t={t} value={s.t} onChange={(v) => setStep(i, { t: v })} placeholder={tr((x) => x.editRecipe.stepTitle)} />
                <Field t={t} value={s.d} onChange={(v) => setStep(i, { d: v })} placeholder={tr((x) => x.editRecipe.stepDetail)} multiline />
              </View>
              <Pressable onPress={() => setSteps((xs) => xs.filter((_, k) => k !== i))} hitSlop={6} style={{ padding: 4, marginTop: 6 }}>
                <Icon.trash size={17} sw={2} color={t.faint} />
              </Pressable>
            </View>
          ))}
        </View>
        <AddRow t={t} label={tr((s) => s.editRecipe.addStep)} onPress={addStep} />

        <PrimaryButton t={t} full disabled={busy} onPress={save} style={{ marginTop: 26, paddingVertical: 16 }}>
          {busy ? tr((s) => s.auth.pleaseWait) : tr((s) => s.editRecipe.save)}
        </PrimaryButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Label({ t, children }: { t: Tokens; children: React.ReactNode }) {
  return <Txt style={{ fontSize: 13, fontWeight: '700', color: t.muted, marginTop: 18, marginBottom: 8 }}>{children}</Txt>;
}

function Field({ t, value, onChange, multiline, keyboardType, style, placeholder }: {
  t: Tokens; value: string; onChange: (v: string) => void; multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'number-pad'; style?: object; placeholder?: string;
}) {
  return (
    <TextInput
      value={value} onChangeText={onChange} multiline={multiline} keyboardType={keyboardType} placeholder={placeholder} placeholderTextColor={t.faint}
      style={{
        backgroundColor: t.surface2, borderRadius: t.radiusSm, paddingHorizontal: 14,
        paddingVertical: multiline ? 12 : 11, fontSize: 15, color: t.text, fontFamily: t.body,
        borderWidth: 1, borderColor: t.border, minHeight: multiline ? 64 : undefined,
        textAlignVertical: multiline ? 'top' : 'center', ...style,
      }}
    />
  );
}

function AddRow({ t, label, onPress }: { t: Tokens; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, marginTop: 10, borderRadius: t.radiusSm, borderWidth: 2, borderColor: t.borderStrong, borderStyle: 'dashed' }}>
      <Icon.plus size={17} sw={2.5} color={t.accent} />
      <Txt style={{ color: t.accent, fontWeight: '700', fontSize: 14 }}>{label}</Txt>
    </Pressable>
  );
}
