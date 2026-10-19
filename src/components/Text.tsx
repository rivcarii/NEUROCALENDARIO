import { StyleSheet, Text as RNText, type TextProps } from 'react-native';
import { bodyFamilyFor } from '../theme/type';

/**
 * Texto de la app: aplica la tipografía de cuerpo y traduce `fontWeight` a la familia
 * correspondiente. Si el estilo trae `fontFamily` (p. ej. títulos), se respeta.
 */
export function Text({ style, ...rest }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  const family = flat.fontFamily ?? bodyFamilyFor(flat.fontWeight);
  return <RNText {...rest} style={[style, { fontFamily: family, fontWeight: 'normal' }]} />;
}
