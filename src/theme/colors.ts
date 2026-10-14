export interface ColorTheme {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceSubtle: string;
  border: string;
  borderSubtle: string;
  borderHighlight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryGlow: string;
  accent: string;
  accentLight: string;
  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
  danger: string;
  dangerSubtle: string;
  info: string;
  infoSubtle: string;
  cardShadow: string;
  cardBorder: string;
  tabBar: string;
  tabBarBorder: string;
  inputBg: string;
  divider: string;
}

export const darkTheme: ColorTheme = {
  isDark: true,
  background: '#0B0F19', // Deep dark navy
  surface: '#111827', // Rich dark slate
  surfaceElevated: '#1F2937', // Elevated popover / modal / card
  surfaceSubtle: '#162033', // Subtle active card
  border: '#1F293D',
  borderSubtle: '#192438',
  borderHighlight: '#3B82F6',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#6366F1', // Refined indigo
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primaryGlow: 'rgba(99, 102, 241, 0.18)',
  accent: '#38BDF8', // Cyan/sky
  accentLight: '#7DD3FC',
  success: '#10B981', // Emerald
  successSubtle: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B', // Amber
  warningSubtle: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444', // Red
  dangerSubtle: 'rgba(239, 68, 68, 0.15)',
  info: '#3B82F6',
  infoSubtle: 'rgba(59, 130, 246, 0.15)',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
  cardBorder: '#1E293B',
  tabBar: '#0D1322',
  tabBarBorder: '#1A2338',
  inputBg: '#131D2F',
  divider: '#1A2436',
};

export const lightTheme: ColorTheme = {
  isDark: false,
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  border: '#E2E8F0',
  borderSubtle: '#EDF2F7',
  borderHighlight: '#4F46E5',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  primaryLight: '#6366F1',
  primaryGlow: 'rgba(79, 70, 229, 0.12)',
  accent: '#0284C7',
  accentLight: '#38BDF8',
  success: '#059669',
  successSubtle: 'rgba(5, 150, 105, 0.12)',
  warning: '#D97706',
  warningSubtle: 'rgba(217, 119, 6, 0.12)',
  danger: '#DC2626',
  dangerSubtle: 'rgba(220, 38, 38, 0.12)',
  info: '#2563EB',
  infoSubtle: 'rgba(37, 99, 235, 0.12)',
  cardShadow: 'rgba(0, 0, 0, 0.05)',
  cardBorder: '#E2E8F0',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  inputBg: '#F8FAFC',
  divider: '#E2E8F0',
};

export const SUBJECT_PALETTE = [
  '#6366F1', // Indigo
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#0284C7', // Sky
];
