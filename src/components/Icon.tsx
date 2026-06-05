// Icon.tsx — line/solid icon set ported from the design's icons.jsx to
// react-native-svg. Each icon takes { size, sw, color, style }.
import React from 'react';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import type { StyleProp, ViewStyle } from 'react-native';

export interface IconProps {
  size?: number;
  sw?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

function Frame({
  size = 24, vb = 24, style, children,
}: { size?: number; vb?: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} style={style}>
      {children}
    </Svg>
  );
}

// A stroke path that inherits the icon color.
const SP = (d: string, color: string, sw: number) => (
  <Path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
);
// A filled path.
const FP = (d: string, color: string) => <Path d={d} fill={color} />;

type IconComp = (p: IconProps) => React.ReactElement;

export const Icon: Record<string, IconComp> = {
  search: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3', color, sw)}</Frame>
  ),
  sliders: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      <Line x1={4} y1={8} x2={20} y2={8} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1={4} y1={16} x2={20} y2={16} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx={9} cy={8} r={2.4} fill={color} />
      <Circle cx={15} cy={16} r={2.4} fill={color} />
    </Frame>
  ),
  bell: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0', color, sw)}</Frame>
  ),
  bookmark: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z', color, sw)}</Frame>
  ),
  bookmarkFill: ({ size, color = '#000', style }) => (
    <Frame size={size} style={style}>{FP('M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z', color)}</Frame>
  ),
  clock: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      <Circle cx={12} cy={12} r={9} fill="none" stroke={color} strokeWidth={sw} />
      {SP('M12 7v5l3 2', color, sw)}
    </Frame>
  ),
  flame: ({ size, color = '#000', style }) => (
    <Frame size={size} style={style}>{FP('M12 2c1 3 4 4 4 8a4 4 0 01-8 0c0-1 .3-1.8.7-2.5C8 9 8 11 9.5 11.5 9 9 11 6 12 2z', color)}</Frame>
  ),
  users: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      {SP('M16 19v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2', color, sw)}
      <Circle cx={9} cy={7} r={3.2} fill="none" stroke={color} strokeWidth={sw} />
      {SP('M22 19v-2a4 4 0 00-3-3.8M16 3.2A4 4 0 0116 11', color, sw)}
    </Frame>
  ),
  layers: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5', color, sw)}</Frame>
  ),
  plus: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M12 5v14M5 12h14', color, sw)}</Frame>
  ),
  home: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M3 10.5L12 3l9 7.5M5 9.5V20a1 1 0 001 1h12a1 1 0 001-1V9.5', color, sw)}</Frame>
  ),
  homeFill: ({ size, color = '#000', style }) => (
    <Frame size={size} style={style}>{FP('M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6h-4v6H4a1 1 0 01-1-1z', color)}</Frame>
  ),
  calendar: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      <Rect x={3} y={5} width={18} height={16} rx={2.5} fill="none" stroke={color} strokeWidth={sw} />
      {SP('M3 9h18M8 3v4M16 3v4', color, sw)}
    </Frame>
  ),
  calendarFill: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      <Rect x={3} y={5} width={18} height={16} rx={2.5} fill={color} stroke={color} strokeWidth={sw} />
      <Path d="M3 9.5h18" stroke="#fff" strokeWidth={1.6} />
      {SP('M8 3v4M16 3v4', color, sw)}
    </Frame>
  ),
  cart: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      <Circle cx={9} cy={20} r={1.6} fill="none" stroke={color} strokeWidth={sw} />
      <Circle cx={18} cy={20} r={1.6} fill="none" stroke={color} strokeWidth={sw} />
      {SP('M2 3h3l2.4 12.4a1.5 1.5 0 001.5 1.2h8.2a1.5 1.5 0 001.5-1.2L21 7H6', color, sw)}
    </Frame>
  ),
  cartFill: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      <Circle cx={9} cy={20} r={1.8} fill={color} />
      <Circle cx={18} cy={20} r={1.8} fill={color} />
      <Path d="M2 3h3l2.4 12.4a1.5 1.5 0 001.5 1.2h8.2a1.5 1.5 0 001.5-1.2L21 7H6" fill={color} fillOpacity={0.18} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  ),
  book: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 5v14', color, sw)}</Frame>
  ),
  bookFill: ({ size, color = '#000', style }) => (
    <Frame size={size} style={style}>{FP('M5 3h14v18H7a2 2 0 01-2-2zM5 3v18', color)}</Frame>
  ),
  user: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      <Circle cx={12} cy={8} r={4} fill="none" stroke={color} strokeWidth={sw} />
      {SP('M4 21a8 8 0 0116 0', color, sw)}
    </Frame>
  ),
  userFill: ({ size, color = '#000', style }) => (
    <Frame size={size} style={style}>
      <Circle cx={12} cy={8} r={4} fill={color} />
      {FP('M4 21a8 8 0 0116 0', color)}
    </Frame>
  ),
  back: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M15 5l-7 7 7 7', color, sw)}</Frame>
  ),
  chevR: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M9 5l7 7-7 7', color, sw)}</Frame>
  ),
  chevD: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M5 9l7 7 7-7', color, sw)}</Frame>
  ),
  share: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      <Circle cx={18} cy={5} r={2.6} fill="none" stroke={color} strokeWidth={sw} />
      <Circle cx={6} cy={12} r={2.6} fill="none" stroke={color} strokeWidth={sw} />
      <Circle cx={18} cy={19} r={2.6} fill="none" stroke={color} strokeWidth={sw} />
      {SP('M8.3 10.7l7.4-4.4M8.3 13.3l7.4 4.4', color, sw)}
    </Frame>
  ),
  shareIos: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      {SP('M12 15V3M12 3L8.5 6.5M12 3l3.5 3.5', color, sw)}
      {SP('M6 11H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2h-1', color, sw)}
    </Frame>
  ),
  heart: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M12 20s-7-4.6-9.5-9C1 8 2.5 4.5 6 4.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 15.4 12 20 12 20z', color, sw)}</Frame>
  ),
  heartFill: ({ size, color = '#000', style }) => (
    <Frame size={size} style={style}>{FP('M12 20s-7-4.6-9.5-9C1 8 2.5 4.5 6 4.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 15.4 12 20 12 20z', color)}</Frame>
  ),
  star: ({ size, color = '#000', style }) => (
    <Frame size={size} style={style}>{FP('M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.8 6.7 19.4l1.2-6L3.4 9.3l6-.7z', color)}</Frame>
  ),
  camera: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      {SP('M3 8a2 2 0 012-2h2l1.5-2h7L17 6h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z', color, sw)}
      <Circle cx={12} cy={13} r={3.6} fill="none" stroke={color} strokeWidth={sw} />
    </Frame>
  ),
  link: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      {SP('M10 14a3.5 3.5 0 005 0l3-3a3.5 3.5 0 00-5-5l-1.5 1.5', color, sw)}
      {SP('M14 10a3.5 3.5 0 00-5 0l-3 3a3.5 3.5 0 005 5l1.5-1.5', color, sw)}
    </Frame>
  ),
  instagram: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      <Rect x={3} y={3} width={18} height={18} rx={5} fill="none" stroke={color} strokeWidth={sw} />
      <Circle cx={12} cy={12} r={4} fill="none" stroke={color} strokeWidth={sw} />
      <Circle cx={17.5} cy={6.5} r={1.2} fill={color} />
    </Frame>
  ),
  tiktok: ({ size, color = '#000', style }) => (
    <Frame size={size} style={style}>{FP('M14 3c.3 2.2 1.7 3.8 3.8 4.1V10c-1.4 0-2.7-.4-3.8-1.1v5.6a5.2 5.2 0 11-5.2-5.2c.3 0 .6 0 .9.1v2.9a2.4 2.4 0 102.4 2.4V3z', color)}</Frame>
  ),
  youtube: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      <Rect x={2.5} y={6} width={19} height={12} rx={3.5} fill="none" stroke={color} strokeWidth={sw} />
      <Path d="M10.5 9.2v5.6l4.5-2.8z" fill={color} />
    </Frame>
  ),
  pin: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      {SP('M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z', color, sw)}
      <Circle cx={12} cy={10} r={2.6} fill="none" stroke={color} strokeWidth={sw} />
    </Frame>
  ),
  edit: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z', color, sw)}</Frame>
  ),
  trash: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13', color, sw)}</Frame>
  ),
  check: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M5 12.5l4.5 4.5L19 6.5', color, sw)}</Frame>
  ),
  x: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M6 6l12 12M18 6L6 18', color, sw)}</Frame>
  ),
  minus: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M5 12h14', color, sw)}</Frame>
  ),
  play: ({ size, color = '#000', style }) => (
    <Frame size={size} style={style}>{FP('M7 4.5v15l13-7.5z', color)}</Frame>
  ),
  pause: ({ size, color = '#000', style }) => (
    <Frame size={size} style={style}>
      <Rect x={6} y={5} width={4} height={14} rx={1.2} fill={color} />
      <Rect x={14} y={5} width={4} height={14} rx={1.2} fill={color} />
    </Frame>
  ),
  sparkle: ({ size, color = '#000', style }) => (
    <Frame size={size} style={style}>{FP('M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6zM18.5 14l.8 2.7 2.7.8-2.7.8-.8 2.7-.8-2.7-2.7-.8 2.7-.8z', color)}</Frame>
  ),
  scale: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M12 3v18M5 7h14M5 7l-2.5 6a2.5 2.5 0 005 0L5 7zM19 7l-2.5 6a2.5 2.5 0 005 0L19 7z', color, sw)}</Frame>
  ),
  swap: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M7 4L3 8l4 4M3 8h13M17 20l4-4-4-4M21 16H8', color, sw)}</Frame>
  ),
  timer: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      <Circle cx={12} cy={13} r={8} fill="none" stroke={color} strokeWidth={sw} />
      {SP('M12 13V9M9 2h6M19 5l-1.5 1.5', color, sw)}
    </Frame>
  ),
  eye: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      {SP('M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z', color, sw)}
      <Circle cx={12} cy={12} r={3} fill="none" stroke={color} strokeWidth={sw} />
    </Frame>
  ),
  grid: ({ size, color = '#000', style }) => (
    <Frame size={size} style={style}>
      <Rect x={3} y={3} width={7.5} height={7.5} rx={2} fill="none" stroke={color} strokeWidth={2} />
      <Rect x={13.5} y={3} width={7.5} height={7.5} rx={2} fill="none" stroke={color} strokeWidth={2} />
      <Rect x={3} y={13.5} width={7.5} height={7.5} rx={2} fill="none" stroke={color} strokeWidth={2} />
      <Rect x={13.5} y={13.5} width={7.5} height={7.5} rx={2} fill="none" stroke={color} strokeWidth={2} />
    </Frame>
  ),
  list: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      {SP('M8 6h13M8 12h13M8 18h13', color, sw)}
      <Circle cx={3.5} cy={6} r={1.4} fill={color} />
      <Circle cx={3.5} cy={12} r={1.4} fill={color} />
      <Circle cx={3.5} cy={18} r={1.4} fill={color} />
    </Frame>
  ),
  settings: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      <Circle cx={12} cy={12} r={3} fill="none" stroke={color} strokeWidth={sw} />
      {SP('M19.4 13a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V19a2 2 0 11-4 0 1.6 1.6 0 00-1.05-1.5 1.6 1.6 0 00-1.77.32l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 005 12.6 1.6 1.6 0 003.5 11.6H3a2 2 0 110-4 1.6 1.6 0 001.5-1.05 1.6 1.6 0 00-.32-1.77l-.1-.1a2 2 0 112.8-2.8l.1.1A1.6 1.6 0 0011 3.5 2 2 0 1115 3.5a1.6 1.6 0 001.05 1.5 1.6 1.6 0 001.77-.32l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.32 1.77 1.6 1.6 0 001.5 1.05H21a2 2 0 110 4 1.6 1.6 0 00-1.5 1z', color, sw)}
    </Frame>
  ),
  egg: ({ size, color = '#000', style }) => (
    <Frame size={size} style={style}>{FP('M12 3c3 0 6 5 6 9a6 6 0 11-12 0c0-4 3-9 6-9z', color)}</Frame>
  ),
  pizza: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      {SP('M3 6l9 15 9-15a22 22 0 00-18 0z', color, sw)}
      <Circle cx={9} cy={9.5} r={1.2} fill={color} />
      <Circle cx={14} cy={10} r={1.2} fill={color} />
      <Circle cx={11.5} cy={14} r={1.2} fill={color} />
    </Frame>
  ),
  bowl: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      {SP('M3 11h18a9 9 0 01-18 0z', color, sw)}
      {SP('M8 7c0-1.5 1-2.5 2-2.5M12 6.5c0-1.5 1-2.5 2-2.5', color, sw)}
    </Frame>
  ),
  cup: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      {SP('M5 8h11v6a4 4 0 01-4 4H9a4 4 0 01-4-4z', color, sw)}
      {SP('M16 9h2a2 2 0 010 4h-2M6 3c0 1 .5 1.5.5 2.5M10 3c0 1 .5 1.5.5 2.5', color, sw)}
    </Frame>
  ),
  chili: ({ size, color = '#000', style }) => (
    <Frame size={size} style={style}>{FP('M5 18c5 1 11-2 12-9 .8.3 1.6.2 2-1-1.5-.3-2-1.5-3.5-1.5-.8 0-1.3.6-1.4 1.3C13 14 8 16 4 16c-.6 0-1 .4-1 1s.4 1 2 1z', color)}</Frame>
  ),
  cake: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M4 21h16v-8a3 3 0 00-3-3H7a3 3 0 00-3 3zM4 15h16M12 6V3M12 3l-1.5 1.5M12 3l1.5 1.5', color, sw)}</Frame>
  ),
  leaf: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      {SP('M4 20c0-8 6-14 16-14 0 10-6 16-14 16-1 0-2-1-2-2z', color, sw)}
      {SP('M9 15c2-3 5-5 8-6', color, sw)}
    </Frame>
  ),
  filter: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M3 5h18l-7 8v6l-4-2v-4z', color, sw)}</Frame>
  ),
  more: ({ size, color = '#000', style }) => (
    <Frame size={size} style={style}>
      <Circle cx={5} cy={12} r={1.8} fill={color} />
      <Circle cx={12} cy={12} r={1.8} fill={color} />
      <Circle cx={19} cy={12} r={1.8} fill={color} />
    </Frame>
  ),
  printer: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      {SP('M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-4a2 2 0 012-2h16a2 2 0 012 2v4a2 2 0 01-2 2h-2', color, sw)}
      <Rect x={6} y={14} width={12} height={7} rx={1} fill="none" stroke={color} strokeWidth={sw} />
    </Frame>
  ),
  download: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M12 3v12M8 11l4 4 4-4M5 21h14', color, sw)}</Frame>
  ),
  plate: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      <Circle cx={12} cy={12} r={9} fill="none" stroke={color} strokeWidth={sw} />
      <Circle cx={12} cy={12} r={4.5} fill="none" stroke={color} strokeWidth={sw} />
    </Frame>
  ),
  globe: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>
      <Circle cx={12} cy={12} r={9} fill="none" stroke={color} strokeWidth={sw} />
      {SP('M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18', color, sw)}
    </Frame>
  ),
  arrowR: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M5 12h14M13 6l6 6-6 6', color, sw)}</Frame>
  ),
  moon: ({ size, color = '#000', style }) => (
    <Frame size={size} style={style}>{FP('M21 13A9 9 0 1111 3a7 7 0 0010 10z', color)}</Frame>
  ),
  forkknife: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M7 3v18M5 3v5a2 2 0 004 0V3M17 3c-2 0-3 2-3 5s1 4 3 4v9', color, sw)}</Frame>
  ),
  refresh: ({ size, sw = 2, color = '#000', style }) => (
    <Frame size={size} style={style}>{SP('M3 12a9 9 0 0115.5-6.2L21 8M21 4v4h-4M21 12a9 9 0 01-15.5 6.2L3 16M3 20v-4h4', color, sw)}</Frame>
  ),
};

export type IconName = keyof typeof Icon;
