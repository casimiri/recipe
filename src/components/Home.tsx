import React from 'react';
import { View, Pressable, ScrollView, TextInput } from 'react-native';
import { Txt } from './Txt';
import { Icon } from './Icon';
import type { Tokens } from '../theme/tokens';
import { CATEGORIES } from '../data/seed';

export function SearchBar({
  t, onPress, placeholder = 'Search any recipe', onFilter, value, onChange, autoFocus, onSubmit,
}: {
  t: Tokens; onPress?: () => void; placeholder?: string; onFilter?: () => void;
  value?: string; onChange?: (v: string) => void; autoFocus?: boolean; onSubmit?: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Pressable onPress={onPress} style={{
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11,
        backgroundColor: t.surface2, borderRadius: 999, paddingHorizontal: 17, paddingVertical: onChange ? 9 : 13,
        borderWidth: 1, borderColor: t.border,
      }}>
        <Icon.search size={19} sw={2.2} color={t.faint} />
        {onChange ? (
          <TextInput
            autoFocus={autoFocus}
            value={value}
            onChangeText={onChange}
            onSubmitEditing={onSubmit}
            returnKeyType="search"
            placeholder={placeholder}
            placeholderTextColor={t.faint}
            style={{ flex: 1, fontSize: 14.5, color: t.text, fontFamily: t.body, paddingVertical: 4 }}
          />
        ) : (
          <Txt style={{ color: t.faint, fontSize: 14.5 }}>{placeholder}</Txt>
        )}
      </Pressable>
      <Pressable onPress={onFilter} style={{
        width: 48, height: 48, borderRadius: 15, backgroundColor: t.surface,
        alignItems: 'center', justifyContent: 'center', boxShadow: t.shadow, borderWidth: 1, borderColor: t.border,
      }}>
        <Icon.sliders size={20} sw={2} color={t.text} />
      </Pressable>
    </View>
  );
}

export function CategoryRow({ t, active, onPick }: { t: Tokens; active: string; onPick: (id: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 18, paddingVertical: 4 }}>
      {CATEGORIES.map((c) => {
        const on = active === c.id;
        const I = Icon[c.icon] || Icon.flame;
        return (
          <Pressable key={c.id} onPress={() => onPick(c.id)} style={{ alignItems: 'center', gap: 8 }}>
            <View style={{
              width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center',
              backgroundColor: on ? t.accent : t.surface2,
              ...(on ? { boxShadow: `0 8px 18px ${t.withA(t.accent, 0.35)}` } : {}),
            }}>
              <I size={25} sw={2} color={on ? t.accentText : t.muted} />
            </View>
            <Txt style={{ fontSize: 12, fontWeight: on ? '700' : '600', color: on ? t.text : t.muted }}>{c.label}</Txt>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
