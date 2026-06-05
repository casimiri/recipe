// Txt — Text wrapper that maps the design's numeric fontWeight onto the
// Plus Jakarta Sans family variants (RN custom fonts ignore fontWeight, so we
// pick the right family). A heading is just weight 800.
import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { FONT } from '../theme/tokens';

function familyForWeight(w?: TextStyle['fontWeight']): string {
  switch (String(w)) {
    case '800':
    case '900':
    case 'bold':
      return FONT.xb;
    case '700':
      return FONT.b;
    case '600':
      return FONT.sb;
    case '500':
      return FONT.m;
    default:
      return FONT.r;
  }
}

export function Txt({ style, ...rest }: TextProps) {
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;
  // An explicit fontFamily wins; otherwise derive from fontWeight.
  const fontFamily = flat.fontFamily || familyForWeight(flat.fontWeight);
  // Strip fontWeight so it doesn't fight the custom family on Android.
  const { fontWeight, ...clean } = flat;
  return <Text {...rest} style={[clean, { fontFamily }]} allowFontScaling={false} />;
}
