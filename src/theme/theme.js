import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const COLORS = {
  // Brand
  primary:      '#10b981',
  primaryDark:  '#047857',
  primaryLight: '#6ee7b7',
  primaryMuted: 'rgba(16,185,129,0.16)',
  primarySoft:  'rgba(16,185,129,0.08)',

  // Semantic
  owe:          '#fb923c',
  owe2:         'rgba(251,146,60,0.16)',
  lent:         '#4ade80',
  lent2:        'rgba(74,222,128,0.16)',
  danger:       '#ef4444',
  dangerMuted:  'rgba(239,68,68,0.14)',
  warning:      '#f59e0b',
  info:         '#818cf8',
  success:      '#10b981',

  // Background — purple-tinted dark, warmer/livelier than plain navy
  bg:           '#13101f',
  surface:      '#1f1a35',
  surfaceHigh:  '#2a2246',
  surfaceRaised:'#352a57',

  // Borders
  border:       '#332a52',
  borderLight:  '#2a2246',
  borderStrong: '#463a6e',

  // Text
  text:         '#ffffff',
  textSub:      '#c4b5fd',
  textMuted:    '#9d94c0',
  textDisabled: '#5f5580',

  // Special
  whatsapp:     '#25d366',
  google:       '#4285f4',
  overlay:      'rgba(10,6,20,0.85)',
  gold:         '#d4af37',

  // Category chips — bright, saturated, playful
  catFood:       '#fb923c',
  catTravel:     '#818cf8',
  catHotel:      '#c084fc',
  catUtil:       '#fbbf24',
  catShop:       '#f472b6',
  catEnt:        '#22d3ee',
  catOther:      '#9d94c0',
};

// Gradient pairs/triples for cards, badges, and hero sections — use with
// expo-linear-gradient's <LinearGradient colors={GRADIENTS.owed} .../>
export const GRADIENTS = {
  owed:      ['#34d399', '#0891b2'],   // teal → cyan — "you are owed" cards
  owe:       ['#fb923c', '#e11d48'],   // orange → rose — "you owe" cards
  sunset:    ['#fbbf24', '#fb7185', '#a855f7'],   // gold → pink → purple — trip/hero cards
  dream:     ['#818cf8', '#c084fc', '#f472b6'],   // indigo → purple → pink — trip/hero cards
  avatar:    ['#f472b6', '#a855f7'],   // pink → purple — avatar circles
  premium:   ['#fbbf24', '#d4af37'],   // gold tones — premium/gold badges
  navActive: ['#34d399', '#0891b2'],   // active bottom-nav icon badge
};

export const FONTS = {
  regular:    Platform.OS === 'ios' ? 'SF Pro Text'    : 'Roboto',
  medium:     Platform.OS === 'ios' ? 'SF Pro Text'    : 'Roboto-Medium',
  bold:       Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto-Bold',
  mono:       Platform.OS === 'ios' ? 'Menlo'          : 'monospace',
};

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const RADIUS = {
  sm:   10,
  md:   14,
  lg:   18,
  xl:   22,
  xxl:  28,
  full: 999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 10,
  },
  glow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
};

export const SCREEN = { W: SCREEN_W, H: SCREEN_H };

export const CAT_ICONS = {
  Food:          '🍔',
  Travel:        '🚗',
  Hotel:         '🏨',
  Utilities:     '⚡',
  Shopping:      '🛍️',
  Entertainment: '🎬',
  Other:         '📦',
};

export const CAT_COLORS = {
  Food:          COLORS.catFood,
  Travel:        COLORS.catTravel,
  Hotel:         COLORS.catHotel,
  Utilities:     COLORS.catUtil,
  Shopping:      COLORS.catShop,
  Entertainment: COLORS.catEnt,
  Other:         COLORS.catOther,
};

export const GROUP_HEADER_COLORS = {
  '✈️':  '#7c2d12',
  '🏠':  '#1e3a5f',
  '🍕':  '#431407',
  '🎉':  '#3b0764',
  '🏕️':  '#14532d',
  '💼':  '#1e293b',
  '🎮':  '#2e1065',
  '🚂':  '#1c1917',
  '🏖️':  '#0c4a6e',
  '🎓':  '#1e1b4b',
};

export const CATEGORIES = Object.keys(CAT_ICONS);
