import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { Glass } from './Glass';
import { PressableScale } from './PressableScale';
import { space, useTheme } from '../theme';
import { font } from '../theme/type';

/**
 * Barra de pestañas flotante tipo «cápsula de cristal» (iOS/web) o barra Material (Android).
 * Sin animación al cambiar de pestaña (son pares y se usan decenas de veces al día): solo el relleno
 * de la pestaña activa cambia de color en 120 ms.
 */
export function GlassTabBar({ state, descriptors, emitter, navigateToTab, insets: navInsets }: BottomTabBarProps) {
  const t = useTheme();
  const own = useSafeAreaInsets();
  // La zona segura inferior de un iPhone mide como mucho 34 pt: se limita por si el valor medido sale inflado.
  const insets = { bottom: Math.min(Math.max(own.bottom, navInsets.bottom), 34) };
  const android = Platform.OS === 'android';
  // Como en iOS 26: la cápsula queda pegada a la zona del indicador de inicio, no muy por encima.
  const bottom = android ? Math.max(insets.bottom, 8) : Math.max(insets.bottom - 12, 10);

  const items = state.routes.map((route, index) => {
    const { options } = descriptors[route.key]!;
    const focused = state.index === index;
    const label = (options.title ?? route.name) as string;
    const color = focused ? t.primary : t.muted;
    return (
      <PressableScale
        key={route.key}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: focused }}
        containerStyle={{ flex: 1 }}
        onPress={() => {
          const ev = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !ev.defaultPrevented) navigateToTab(route.key);
        }}
        onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
        style={{
          minHeight: 54, borderRadius: android ? 16 : 24, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 2,
          backgroundColor: focused ? t.chip : 'transparent',
        }}
      >
        {options.tabBarIcon?.({ focused, color, size: 24 })}
        <Text numberOfLines={1} style={{ color, fontSize: 11, fontFamily: focused ? font.bodyBold : font.body }}>{label}</Text>
      </PressableScale>
    );
  });

  if (android) {
    return (
      <Glass radius={0} style={{ paddingBottom: bottom - 6, paddingTop: 6, paddingHorizontal: space.sm }}>
        <View style={{ flexDirection: 'row' }}>{items}</View>
      </Glass>
    );
  }
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom, alignItems: 'center', paddingHorizontal: space.lg }}>
      <Glass style={{ width: '100%', maxWidth: 520, padding: 6 }}>
        <View style={{ flexDirection: 'row', gap: 2 }}>{items}</View>
      </Glass>
    </View>
  );
}
