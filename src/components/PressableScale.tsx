import { useState } from 'react';
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { motion, useReduceMotion } from '../theme/motion';

// En Jest (sin módulo nativo) Reanimated se simula con un objeto vacío: se usa View sin transiciones.
const AnimatedView = (Animated as { View?: typeof View }).View ?? View;

/**
 * Pulsable con respuesta física: escala 0,97 al pulsar (feedback al pulsar, no al soltar)
 * y transición de color de fondo/borde para los cambios de estado. Corre en el hilo de UI
 * (transiciones CSS de Reanimated); sin cálculo por fotograma en JS.
 * Los estilos de apariencia van en `style` (se aplican al contenedor animado).
 */
export function PressableScale({ style, containerStyle, children, onPressIn, onPressOut, ...rest }: Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  /** Estilo del contenedor externo (ancho en cuadrículas, etc.). */
  containerStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const [down, setDown] = useState(false);
  const reduced = useReduceMotion();
  return (
    <Pressable
      {...rest}
      style={containerStyle}
      onPressIn={(e) => { setDown(true); onPressIn?.(e); }}
      onPressOut={(e) => { setDown(false); onPressOut?.(e); }}
    >
      <AnimatedView
        style={[
          style,
          ({
            transitionProperty: ['transform', 'backgroundColor', 'borderColor', 'opacity'],
            transitionDuration: reduced ? 0 : motion.press,
            transitionTimingFunction: motion.easeOut,
            transform: [{ scale: down && !reduced ? motion.pressScale : 1 }],
            opacity: rest.disabled ? 0.5 : 1,
          }) as unknown as ViewStyle, // las props de transición CSS de Reanimated no están en ViewStyle
        ]}
      >
        {children}
      </AnimatedView>
    </Pressable>
  );
}
