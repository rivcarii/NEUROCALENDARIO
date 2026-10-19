import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { motion, useReduceMotion } from '../theme/motion';

// En Jest (sin módulo nativo) Reanimated se simula con un objeto vacío: se usa View sin animación.
const AnimatedView = (Animated as { View?: typeof View }).View ?? View;

const keyframes = {
  from: { opacity: 0, transform: [{ translateY: 18 }, { scale: 0.97 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
};

/** Entradas ya reproducidas en esta sesión: volver a una pestaña no repite la animación. */
const played = new Set<string>();

/**
 * Entrada escalonada («una capa tras otra»): cada bloque sube y se asienta con un retraso de 70 ms por posición.
 * Ocurre una sola vez por pantalla y sesión (momento ocasional, no en cada cambio de pestaña), solo con
 * transform + opacity en el hilo de UI. Con «reducir movimiento» solo aparece, sin desplazamiento.
 */
export function Reveal({ id, index = 0, children }: { id: string; index?: number; children: ReactNode }) {
  const reduced = useReduceMotion();
  const key = `${id}:${index}`;
  const first = !played.has(key);
  if (first) played.add(key);
  if (!first || reduced) return <View>{children}</View>;
  return (
    <AnimatedView
      style={({
        animationName: keyframes,
        animationDuration: 380,
        animationDelay: Math.min(index, 8) * 70,
        animationTimingFunction: motion.easeOut,
        animationFillMode: 'both',
      }) as unknown as object}
    >
      {children}
    </AnimatedView>
  );
}
