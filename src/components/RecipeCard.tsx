import React from 'react';
import { View, Pressable, StyleProp, ViewStyle } from 'react-native';
import { Txt } from './Txt';
import { Icon } from './Icon';
import { Dish, RatingBadge, StatChip } from './atoms';
import { useI18n } from '../i18n';
import { trEnum } from '../i18n/enums';
import type { Tokens } from '../theme/tokens';
import type { Recipe } from '../data/types';

type Variant = 'overlay' | 'caption' | 'compact';

export function RecipeCard({
  recipe: r, t, variant = 'overlay', tall, onOpen, onSave, saved, wide, onLongPress,
}: {
  recipe: Recipe; t: Tokens; variant?: Variant; tall?: boolean; wide?: boolean;
  onOpen: (id: string) => void; onSave?: (id: string) => void; saved?: boolean;
  onLongPress?: (id: string) => void;
}) {
  const { lang } = useI18n();
  const cuisine = trEnum(r.cuisine, lang);
  const TimePill = (
    <View style={{
      position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 4, paddingHorizontal: 9, borderRadius: 999,
    }}>
      <Icon.clock size={12} sw={2.2} color="#fff" />
      <Txt style={{ color: '#fff', fontSize: 11.5, fontWeight: '700' }}>{r.time} min</Txt>
    </View>
  );
  const SaveBtn = onSave ? (
    <Pressable onPress={() => onSave(r.id)} hitSlop={6} style={{
      position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: saved ? t.accent : 'rgba(255,255,255,0.92)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    }}>
      {saved ? <Icon.bookmarkFill size={15} color={t.accentText} /> : <Icon.bookmark size={15} sw={2.2} color="#222" />}
    </Pressable>
  ) : null;

  if (variant === 'compact') {
    return (
      <Pressable onPress={() => onOpen(r.id)} style={{
        flexDirection: 'row', gap: 13, alignItems: 'center', padding: 8,
        borderRadius: t.radiusSm + 6, backgroundColor: t.surface,
      }}>
        <Dish src={r.img} alt={r.title} radius={t.radiusSm} style={{ width: 88, height: 88 }} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt style={{ fontWeight: '700', fontSize: 15, color: t.text, marginBottom: 3 }} numberOfLines={2}>{r.title}</Txt>
          <Txt style={{ fontSize: 12.5, color: t.muted, marginBottom: 7 }}>{cuisine}</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <StatChip icon={<Icon.clock size={14} sw={2.2} color={t.accent} />} value={`${r.time}m`} t={t} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Icon.star size={13} color={t.star} />
              <Txt style={{ color: t.text, fontSize: 13, fontWeight: '700' }}>{r.rating}</Txt>
            </View>
          </View>
        </View>
        {onSave ? (
          <Pressable onPress={() => onSave(r.id)} hitSlop={8} style={{ padding: 6 }}>
            {saved ? <Icon.bookmarkFill size={20} color={t.accent} /> : <Icon.bookmark size={20} sw={2} color={t.faint} />}
          </Pressable>
        ) : null}
      </Pressable>
    );
  }

  if (variant === 'caption') {
    return (
      <Pressable onPress={() => onOpen(r.id)} style={{
        backgroundColor: t.surface, borderRadius: t.radius, overflow: 'hidden',
        boxShadow: t.shadow, borderWidth: 1, borderColor: t.border,
      }}>
        <Dish src={r.img} alt={r.title} style={{ width: '100%', height: tall ? 168 : 134 }}>
          {TimePill}{SaveBtn}
        </Dish>
        <View style={{ paddingHorizontal: 13, paddingTop: 11, paddingBottom: 13 }}>
          <Txt style={{ fontWeight: '700', fontSize: 15, color: t.text, marginBottom: 4 }} numberOfLines={2}>{r.title}</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt style={{ fontSize: 12.5, color: t.muted }}>{cuisine}</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Icon.star size={13} color={t.star} />
              <Txt style={{ color: t.text, fontSize: 13, fontWeight: '700' }}>{r.rating}</Txt>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  // overlay (default)
  return (
    <Pressable onPress={() => onOpen(r.id)} onLongPress={onLongPress ? () => onLongPress(r.id) : undefined}>
      <Dish src={r.img} alt={r.title} radius={t.radius} style={{ width: '100%', height: wide ? 150 : (tall ? 230 : 150) }}>
        {TimePill}{SaveBtn}
        <View style={{ position: 'absolute', bottom: 8, right: 8 }}>
          <RatingBadge value={r.rating} t={t} />
        </View>
      </Dish>
      <View style={{ paddingTop: 9, paddingHorizontal: 2 }}>
        <Txt style={{ fontWeight: '700', fontSize: 14.5, color: t.text, marginBottom: 2 }} numberOfLines={1}>{r.title}</Txt>
        <Txt style={{ fontSize: 12.5, color: t.muted }}>{cuisine}</Txt>
      </View>
    </Pressable>
  );
}

export type { Variant as RecipeCardVariant };
