import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const COLORS = {
  // Brand
  primary:      '#10b981',
  primaryDark:  '#059669',
  primaryLight: '#34d399',

  // Semantic
  owe:          '#fb923c',   // orange — you owe
  lent:         '#4ade80',   // green  — you lent
  danger:       '#ef4444',
  warning:      '#f59e0b',
  info:         '#6366f1',
  success:      '#10b981',

  // Background
  bg:           '#0f172a',
  surface:      '#1e293b',
  surfaceHigh:  '#263548',
  border:       '#334155',

  // Text
  text:         '#f1f5f9',
  textSub:      '#94a3b8',
  textMuted:    '#64748b',
  textDisabled: '#475569',

  // Special
  whatsapp:     '#25d366',
  google:       '#4285f4',
  overlay:      'rgba(0,0,0,0.8)',

  // Category chips
  catFood:       '#f97316',
  catTravel:     '#3b82f6',
  catHotel:      '#8b5cf6',
  catUtil:       '#eab308',
  catShop:       '#ec4899',
  catEnt:        '#06b6d4',
  catOther:      '#64748b',
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

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
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
