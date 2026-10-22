import { router, usePathname } from 'expo-router';
import { useState } from 'react';
import { Platform, View, type LayoutChangeEvent } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NeuroIcon } from './Brand';
import { Glass } from './Glass';
import type { IconName } from '../brand/geometry';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { space, useIsDark, useTheme } from '../theme';
import { motion, useReduceMotion } from '../theme/motion';
import { font } from '../theme/type';

export const TABS: { path: '/' | '/calendario' | '/episodios' | '/medicacion' | '/mas'; label: string; icon: IconName }[] = [
  { path: '/', label: 'Hoy', icon: 'hoy' },
  { path: '/calendario', label: 'Calendario', icon: 'calendario' },
  { path: '/episodios', label: 'Síntomas', icon: 'sintomas' },
  { path: '/medicacion', label: 'Medicinas', icon: 'medicinas' },
  { path: '/mas', label: 'Más', icon: 'mas' },
];

// En Jest (sin módulo nativo) Reanimated se simula con un objeto vacío: se usa View.
const AnimatedView = (Animated as { View?: typeof View }).View ?? View;

/**
 * Barra de pestañas flotante: cápsula de cristal con un indicador que se desliza (iOS/web) o barra Material (Android).
 * Es una capa propia sobre el grupo de pestañas (no depende del contenedor del navegador, que la recortaba en iOS).
 * El contenido NO se desliza al cambiar de pestaña (son pares y se usan decenas de veces al día): solo el indicador
 * se mueve (transform, 200 ms ease-out, hilo de UI).
 */
export function GlassTabBar() {
  const t = useTheme();
  const dark = useIsDark();
  const own = useSafeAreaInsets();
  const path = usePathname();
  const reduced = useReduceMotion();
  const [rowW, setRowW] = useState(0);
  const [ready, setReady] = useState(false);
  const android = Platform.OS === 'android';
  // La zona segura inferior de un iPhone mide como mucho 34 pt: se limita por si el valor medido sale inflado.
  const inset = Math.min(own.bottom, 34);
  // Como en iOS 26: la cápsula queda justo encima de la zona del indicador de inicio (nunca por debajo: así no la recortan las esquinas).
  const bottom = android ? 0 : Math.max(inset, 16);
  const index = Math.max(0, TABS.findIndex((x) => x.path === path));
  const itemW = rowW / TABS.length;

  const onRowLayout = (e: LayoutChangeEvent) => {
    setRowW(e.nativeEvent.layout.width);
    requestAnimationFrame(() => setReady(true));
  };

  const row = (
    <View style={{ flexDirection: 'row' }} onLayout={onRowLayout}>
      {!android && rowW > 0 ? (
        <AnimatedView
          pointerEvents="none"
          style={({
            position: 'absolute', top: 0, bottom: 0, left: 0, width: itemW, borderRadius: 24,
            backgroundColor: dark ? '#9E9BFF2E' : '#4C46D61A',
            borderWidth: 0,
            transform: [{ translateX: index * itemW }],
            // el indicador se desliza; el relleno ya existía: no hay nada que mover en el primer pintado
            transitionProperty: 'transform',
            transitionDuration: ready && !reduced ? 220 : 0,
            transitionTimingFunction: motion.easeOut,
          }) as unknown as object}
        />
      ) : null}
      {TABS.map((tab, i) => {
        const focused = i === index;
        const color = focused ? t.primary : t.muted;
        return (
          <PressableScale
            key={tab.path}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: focused }}
            containerStyle={{ flex: 1 }}
            onPress={() => { if (!focused) router.navigate(tab.path); }}
            style={{ minHeight: 56, borderRadius: android ? 16 : 24, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 2,
              backgroundColor: android && focused ? t.chip : 'transparent' }}
          >
            <NeuroIcon name={tab.icon} size={25} color={color} active={focused} />
            <Text numberOfLines={1} style={{ color, fontSize: 11, fontFamily: focused ? font.bodyBold : font.body }}>{tab.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom, alignItems: 'center', paddingHorizontal: android ? 0 : space.lg }}>
      {android ? (
        <Glass radius={0} style={{ width: '100%', paddingBottom: Math.max(inset, 8), paddingTop: 6, paddingHorizontal: space.sm }}>{row}</Glass>
      ) : (
        <Glass style={{ width: '100%', maxWidth: 520, padding: 6 }}>{row}</Glass>
      )}
    </View>
  );
}
