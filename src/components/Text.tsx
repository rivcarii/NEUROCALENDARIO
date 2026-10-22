import { StyleSheet, Text as RNText, type TextProps } from 'react-native';
import { resolveFont } from '../theme/type';

/**
 * Texto de la app: tipografía del sistema. Si el estilo trae un token (`font.display`…) se traduce
 * a familia + peso + interletraje; si trae `fontWeight`, se respeta.
 */
export function Text({ style, ...rest }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  const f = resolveFont(flat.fontFamily, flat.fontWeight);
  return <RNText maxFontSizeMultiplier={1.6} {...rest} style={[style, f, flat.letterSpacing !== undefined ? { letterSpacing: flat.letterSpacing } : null]} />;
}
