import { AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold } from '@expo-google-fonts/atkinson-hyperlegible';
import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';

/**
 * Tipografías:
 * - Fraunces (serif con carácter): títulos y nombre del perfil.
 * - Atkinson Hyperlegible (sans diseñada para baja visión): todo el texto de lectura y formularios.
 * En React Native el peso se elige con la familia, no con `fontWeight`.
 */
export const fontFiles = {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
};

export const font = {
  display: 'Fraunces_700Bold',
  displaySemi: 'Fraunces_600SemiBold',
  body: 'AtkinsonHyperlegible_400Regular',
  bodyBold: 'AtkinsonHyperlegible_700Bold',
} as const;

/** Escala tipográfica (px a tamaño de letra del sistema por defecto). */
export const size = { caption: 13, body: 16, lead: 17, h2: 20, h1: 28 } as const;

/** Elige la familia de cuerpo según el peso pedido en el estilo. */
export function bodyFamilyFor(weight: unknown): string {
  const w = typeof weight === 'string' ? Number(weight) || (weight === 'bold' ? 700 : 400) : (weight as number | undefined) ?? 400;
  return w >= 600 ? font.bodyBold : font.body;
}
