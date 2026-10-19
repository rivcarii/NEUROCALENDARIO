import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Tokens de movimiento (skill de animación para Expo):
 * - Solo lo que el usuario toca o un cambio de estado; nunca pestañas ni listas.
 * - Duraciones < 200 ms; entrada/salida con ease-out fuerte; nada de ease-in.
 * - Con «reducir movimiento» se elimina la escala y la duración baja a 0.
 */
export const motion = {
  press: 120,
  state: 160,
  pressScale: 0.97,
  /** ease-out fuerte (las curvas integradas son demasiado suaves). */
  easeOut: 'cubic-bezier(0.23, 1, 0.32, 1)' as `cubic-bezier(${number}, ${number}, ${number}, ${number})`,
} as const;

/** Preferencia del sistema «reducir movimiento». */
export function useReduceMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { if (alive) setReduced(v); }).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { alive = false; sub.remove(); };
  }, []);
  return reduced;
}
