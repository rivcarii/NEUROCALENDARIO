import { Platform, type TextStyle } from 'react-native';

/**
 * Tipografía: la del sistema (SF Pro en iPhone/iPad/Mac, Roboto en Android, system-ui en navegadores),
 * como las apps de Apple: legible, con Dynamic Type y sin descargas.
 * Los estilos se piden con «tokens» (`font.display`…) que `Text` traduce a familia + peso.
 */
export const SYSTEM_FONT = Platform.select({ ios: 'System', web: 'System', default: undefined });

export const font = {
  display: 'nc:display',
  displaySemi: 'nc:displaySemi',
  body: 'nc:body',
  bodyBold: 'nc:bodyBold',
} as const;

const TOKENS: Record<string, TextStyle> = {
  [font.display]: { fontWeight: '700', letterSpacing: -0.4 },
  [font.displaySemi]: { fontWeight: '600', letterSpacing: -0.2 },
  [font.body]: { fontWeight: '400' },
  [font.bodyBold]: { fontWeight: '600' },
};

/** Convierte un token (o un peso suelto) en estilo real del sistema. */
export function resolveFont(family: unknown, weight: unknown): TextStyle {
  const tok = typeof family === 'string' ? TOKENS[family] : undefined;
  if (tok) return { fontFamily: SYSTEM_FONT, ...tok };
  if (typeof family === 'string' && family) return { fontFamily: family, fontWeight: (weight as TextStyle['fontWeight']) ?? '400' };
  return { fontFamily: SYSTEM_FONT, fontWeight: (weight as TextStyle['fontWeight']) ?? '400' };
}

/** Escala tipográfica inspirada en las de iOS (Large Title 34, Title 2 22, Body 17, Footnote 13). */
export const size = { caption: 13, body: 17, lead: 17, h2: 22, h1: 30 } as const;
