import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { Text } from './Text';
import { BRAND, ICONS, ICON_STROKE, ISOTIPO, type IconName } from '../brand/geometry';
import { useTheme } from '../theme';

/**
 * Isotipo de NeuroCalendario: calendario con una «N» formada por dos neuronas unidas por una sinapsis.
 * - `tile`: icono de app (azulejo con degradado índigo → violeta y trazo blanco).
 * - `color`: trazo índigo sin fondo. `mono`: un solo color (`color`).
 */
export function Isotipo({ size = 40, variant = 'tile', color }: { size?: number; variant?: 'tile' | 'color' | 'mono'; color?: string }) {
  const ink = variant === 'tile' ? '#FFFFFF' : color ?? BRAND.indigo;
  const accent = variant === 'tile' ? '#FFFFFF' : variant === 'color' ? BRAND.teal : ink;
  // id único por instancia: en web varios SVG con el mismo id de degradado se pisan (y el icono sale sin fondo)
  const id = `nc-g-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {variant === 'tile' ? (
        <>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={BRAND.violet} />
              <Stop offset="0.55" stopColor={BRAND.indigo} />
              <Stop offset="1" stopColor={BRAND.indigoDeep} />
            </LinearGradient>
          </Defs>
          <Path d={ISOTIPO.tile} fill={`url(#${id})`} />
        </>
      ) : null}
      <Path d={ISOTIPO.frame} fill="none" stroke={ink} strokeWidth={ISOTIPO.stroke} strokeLinejoin="round" />
      <Path d={ISOTIPO.tabs} fill="none" stroke={ink} strokeWidth={ISOTIPO.stroke} strokeLinecap="round" />
      <Path d={ISOTIPO.pathway} fill="none" stroke={accent} strokeWidth={ISOTIPO.stroke - 1} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={ISOTIPO.dendrites} fill="none" stroke={accent} strokeWidth={ISOTIPO.thin} strokeLinecap="round" />
      <Path d={ISOTIPO.somas} fill={accent} />
      <Path d={ISOTIPO.terminals} fill={accent} />
    </Svg>
  );
}

/** Isologo: isotipo + nombre. El nombre combina peso fuerte («Neuro») y regular («Calendario»). */
export function Isologo({ size = 44, stacked = false }: { size?: number; stacked?: boolean }) {
  const t = useTheme();
  const word = (
    <Text accessibilityRole="header" accessibilityLabel="NeuroCalendario" style={{ fontSize: size * 0.5, letterSpacing: -0.3, color: t.text }}>
      <Text style={{ fontWeight: '800', color: t.primary, fontSize: size * 0.5 }}>Neuro</Text>
      <Text style={{ fontWeight: '500', color: t.text, fontSize: size * 0.5 }}>Calendario</Text>
    </Text>
  );
  return (
    <View style={{ flexDirection: stacked ? 'column' : 'row', alignItems: 'center', gap: stacked ? size * 0.25 : size * 0.28 }}>
      <Isotipo size={stacked ? size * 1.8 : size} />
      {word}
    </View>
  );
}

/** Icono propio de la app (trazo). `active` engrosa el trazo; el color viene del tema. */
export function NeuroIcon({ name, size = 24, color, active = false }: { name: IconName; size?: number; color?: string; active?: boolean }) {
  const t = useTheme();
  const filled = name === 'crisis' || name === 'sueno';
  const c = color ?? t.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d={ICONS[name]} fill={filled && active ? c : 'none'} stroke={c} strokeWidth={active ? ICON_STROKE + 0.5 : ICON_STROKE} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
