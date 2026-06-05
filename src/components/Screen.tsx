import React from 'react';
import { ScrollView, View, Pressable, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Txt } from './Txt';
import { Icon } from './Icon';

/** Standard padded, scrollable screen body matching the design's content wrapper. */
export function Screen({
  children, contentStyle, noScroll, edges = true,
}: {
  children: React.ReactNode; contentStyle?: StyleProp<ViewStyle>; noScroll?: boolean; edges?: boolean;
}) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const pad = {
    paddingHorizontal: 20,
    paddingTop: (edges ? insets.top : 0) + 6,
    paddingBottom: 24,
  };
  if (noScroll) {
    return <View style={[{ flex: 1, backgroundColor: t.bg }, pad, contentStyle]}>{children}</View>;
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={[pad, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function ScreenHeader({
  title, onBack, right,
}: { title: string; onBack: () => void; right?: React.ReactNode }) {
  const { t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <Pressable onPress={onBack} style={{
        width: 42, height: 42, borderRadius: 21, backgroundColor: t.surface2,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon.back size={22} sw={2.2} color={t.text} />
      </Pressable>
      <Txt style={{ flex: 1, fontWeight: '800', fontSize: 23, color: t.text }}>{title}</Txt>
      {right}
    </View>
  );
}
