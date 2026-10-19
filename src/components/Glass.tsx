import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useIsDark, useTheme } from '../theme';

/**
 * Material translúcido («cristal») para barras flotantes, al estilo de iOS:
 * - iOS: desenfoque nativo del sistema (BlurView).
 * - Web: `backdrop-filter` (con respaldo sólido si el usuario pide menos transparencia).
 * - Android: superficie sólida con elevación (Material 3).
 * El contenido pasa por debajo; el borde superior claro imita la luz sobre el material.
 */
export function Glass({ children, style, radius = 28 }: { children: ReactNode; style?: StyleProp<ViewStyle>; radius?: number }) {
  const t = useTheme();
  const dark = useIsDark();
  const rim = dark ? '#FFFFFF1F' : '#FFFFFFB3';
  const base: ViewStyle = {
    borderRadius: radius, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth * 2, borderColor: dark ? '#FFFFFF26' : '#0B1F331A',
  };
  if (Platform.OS === 'ios') {
    return (
      <View style={[base, { shadowColor: '#000', shadowOpacity: dark ? 0.5 : 0.16, shadowRadius: 22, shadowOffset: { width: 0, height: 8 } }, style]}>
        <BlurView intensity={80} tint={dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { borderTopWidth: 1, borderTopColor: rim, borderRadius: radius }]} pointerEvents="none" />
        {children}
      </View>
    );
  }
  if (Platform.OS === 'web') {
    const web = {
      backgroundColor: dark ? 'rgba(23,32,42,0.62)' : 'rgba(255,255,255,0.66)',
      backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      boxShadow: dark ? '0 8px 28px rgba(0,0,0,0.5)' : '0 8px 28px rgba(11,31,51,0.16)', borderTopColor: rim,
    } as unknown as ViewStyle;
    return <View style={[base, web, style]}>{children}</View>;
  }
  return <View style={[base, { backgroundColor: t.card, elevation: 8, borderWidth: 0 }, style]}>{children}</View>;
}
