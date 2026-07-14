import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const COLORS = {
  // Brand — slightly richer emerald, more depth between shades
  primary:      '#10b981',
  primaryDark:  '#047857',
  primaryLight: '#6ee7b7',
  primaryMuted: 'rgba(16,185,129,0.14)',   // tinted background for badges/pills
  primarySoft:  'rgba(16,185,129,0.08)',   // even lighter, for subtle row highlights

  // Semantic
  owe:          '#fb923c',   // orange — you owe
  owe2:         'rgba(251,146,60,0.14)',
  lent:         '#4ade80',   // green  — you lent
  lent2:        'rgba(74,222,128,0.14)',
  danger:       '#ef4444',
  dangerMuted:  'rgba(239,68,68,0.12)',
  warning:      '#f59e0b',
  info:         '#6366f1',
  success:      '#10b981',

  // Background — softer layering between levels for more depth
  bg:           '#0d1420',
  surface:      '#1a2537',
  surfaceHigh:  '#24324a',
  surfaceRaised:'#2c3b56',

  // Borders — was missing `borderLight`, which several screens already
  // reference; without it those borders were silently invisible.
  border:       '#334155',
  borderLight:  '#2a3648',
  borderStrong: '#475569',

  // Text — slightly warmer white for less harsh contrast
  text:         '#f3f6f9',
  textSub:      '#9aa8bc',
  textMuted:    '#6b7a90',
  textDisabled: '#4a5568',

  // Special
  whatsapp:     '#25d366',
  google:       '#4285f4',
  overlay:      'rgba(5,10,20,0.82)',
  gold:         '#d4af37',

  // Category chips — nudged for better contrast against the darker bg
  catFood:       '#fb923c',
  catTravel:     '#60a5fa',
  catHotel:      '#a78bfa',
  catUtil:       '#facc15',
  catShop:       '#f472b6',
  catEnt:        '#22d3ee',
  catOther:      '#94a3b8',
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
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  full: 999,
};

// Softer, more layered shadows — lower opacity + larger blur reads as more
// premium/modern than a small tight shadow.
export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  },
  // Subtle colored glow for highlighted/active cards (e.g. selected chips,
  // premium elements).
  glow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
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
