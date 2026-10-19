import { Platform, useColorScheme, type ViewStyle } from 'react-native';

export const light = {
  bg: '#F6F8FB', card: '#FFFFFF', text: '#14202B', muted: '#5B6B7A', border: '#D5DDE6',
  primary: '#2F5D8A', onPrimary: '#FFFFFF', danger: '#B3261E', success: '#2E7D4F', warn: '#9A6700',
  chip: '#E8EEF5', chipOn: '#2F5D8A', onHeader: '#FFFFFF', onHeaderSoft: '#FFFFFFCC', headerButton: '#FFFFFF33',
};
export const dark: typeof light = {
  bg: '#0E141A', card: '#17202A', text: '#EAF0F6', muted: '#9DAEBF', border: '#2B3948',
  primary: '#7FB0E0', onPrimary: '#0E141A', danger: '#FF8A80', success: '#74C69D', warn: '#E3B341',
  chip: '#22303D', chipOn: '#7FB0E0', onHeader: '#FFFFFF', onHeaderSoft: '#FFFFFFCC', headerButton: '#FFFFFF33',
};

export type Theme = typeof light;
export const useTheme = (): Theme => (useColorScheme() === 'dark' ? dark : light);
export const useIsDark = (): boolean => useColorScheme() === 'dark';

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const MIN_TOUCH = 48;

export const radius = { sm: 8, md: 10, lg: 12, pill: 20 } as const;
export const MIN_TOUCH_ANDROID = 48;

/**
 * Apariencia por plataforma (sin cambiar la marca):
 * - iOS: superficies con sombra suave, esquinas continuas más grandes, botones de 12 pt.
 * - Android (Material 3): superficies con elevación, botones tipo píldora.
 * - Web: se parece a iOS (sombra suave).
 */
export const platform = {
  // iOS 26+/«cristal»: formas concéntricas y cápsulas; Android: Material 3.
  buttonRadius: 999,
  cardRadius: Platform.OS === 'android' ? 20 : 26,
  inputRadius: Platform.OS === 'android' ? 12 : 16,
  /** Tamaño base del texto: 17 en iOS (Dynamic Type), 16 en Android. */
  body: Platform.OS === 'ios' ? 17 : 16,
} as const;

export function cardSurface(dark: boolean): ViewStyle {
  if (Platform.OS === 'android') return { elevation: dark ? 0 : 1 };
  return dark
    ? {}
    : { shadowColor: '#0B1F33', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } };
}

/** Espacio que dejan las pantallas con pestañas al final para que la barra flotante no tape el contenido. */
export const TAB_BAR_SPACE = 112;

/** Oscurece un color #RRGGBB (0–1) para los degradados de cabecera. */
export function shade(hex: string, amount = 0.28): string {
  const n = (i: number) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount)).toString(16).padStart(2, '0');
  return `#${n(1)}${n(3)}${n(5)}`;
}
