import { Platform, useColorScheme, type ViewStyle } from 'react-native';

// Paleta inspirada en los colores del sistema de Apple, con el índigo de la marca (ver src/brand/geometry.ts).
export const light = {
  bg: '#F2F2F7', card: '#FFFFFF', text: '#1C1C1E', muted: '#6C6C70', border: '#E3E3E8',
  primary: '#4C46D6', onPrimary: '#FFFFFF', danger: '#D70015', success: '#1F7A36', warn: '#A04800',
  chip: '#E8E8F7', chipOn: '#4C46D6', onHeader: '#1C1C1E', onHeaderSoft: '#6C6C70', headerButton: '#E8E8F7',
  accent: '#0A7686', tint: '#EDEBFF', separator: '#E3E3E8',
};
export const dark: typeof light = {
  bg: '#000000', card: '#1C1C1E', text: '#F5F5F7', muted: '#A1A1A8', border: '#38383A',
  primary: '#9E9BFF', onPrimary: '#0B0A26', danger: '#FF6961', success: '#30D158', warn: '#FFB340',
  chip: '#2C2C2E', chipOn: '#9E9BFF', onHeader: '#F5F5F7', onHeaderSoft: '#A1A1A8', headerButton: '#2C2C2E',
  accent: '#3CC8D8', tint: '#22214A', separator: '#38383A',
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
  cardRadius: Platform.OS === 'android' ? 20 : 22,
  inputRadius: Platform.OS === 'android' ? 12 : 16,
  /** Tamaño base del texto: 17 en iOS (Dynamic Type), 16 en Android. */
  body: Platform.OS === 'ios' ? 17 : 16,
} as const;

export function cardSurface(dark: boolean): ViewStyle {
  if (Platform.OS === 'android') return { elevation: dark ? 0 : 1 };
  // Apple: listas agrupadas planas sobre gris claro; solo un velo de sombra para separar del fondo.
  return dark
    ? {}
    : { shadowColor: '#1C1C3A', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } };
}

/** Espacio que dejan las pantallas con pestañas al final para que la barra flotante no tape el contenido. */
export const TAB_BAR_SPACE = 112;

/** Oscurece un color #RRGGBB (0–1) para los degradados de cabecera. */
export function shade(hex: string, amount = 0.28): string {
  const n = (i: number) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount)).toString(16).padStart(2, '0');
  return `#${n(1)}${n(3)}${n(5)}`;
}
