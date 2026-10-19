import type { ReactNode } from 'react';
import { View } from 'react-native';
import { cardSurface, platform, useIsDark, useTheme } from '../theme';

/**
 * Tarjeta con «mazo» detrás: dos capas más pequeñas asoman por debajo para dar profundidad
 * (una tarjeta sobre otra). Son estáticas: sin sombras animadas.
 */
export function Deck({ children }: { children: ReactNode }) {
  const t = useTheme();
  const dark = useIsDark();
  const ghost = (inset: number, down: number, opacity: number) => (
    <View pointerEvents="none" style={[{
      position: 'absolute', left: inset, right: inset, bottom: -down, height: 48, borderBottomLeftRadius: platform.cardRadius,
      borderBottomRightRadius: platform.cardRadius, backgroundColor: t.card, opacity, borderWidth: 1, borderColor: t.border,
    }, cardSurface(dark)]} />
  );
  return (
    <View style={{ marginBottom: 24 }}>
      {ghost(26, 20, 0.55)}
      {ghost(13, 10, 0.85)}
      {children}
    </View>
  );
}
