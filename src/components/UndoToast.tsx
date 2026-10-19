import { useEffect } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { MAX_CONTENT } from './ui';
import { TAB_BAR_SPACE, cardSurface, space, useIsDark, useTheme } from '../theme';
import { motion, useReduceMotion } from '../theme/motion';

// En Jest (sin módulo nativo) Reanimated se simula con un objeto vacío: se usa View sin animación.
const AnimatedView = (Animated as { View?: typeof View }).View ?? View;
const keyframes = { from: { opacity: 0, transform: [{ translateY: 16 }, { scale: 0.97 }] }, to: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] } };

export interface ToastAction { label: string; onPress: () => void }

/**
 * Aviso breve sobre la barra de pestañas: confirma lo que acaba de pasar y deja «Deshacer» (los errores de dedo
 * son comunes; así no hace falta un cuadro de confirmación). Se retira solo a los 7 s.
 * Entra desde abajo con transform + opacity (momento ocasional, causado por el usuario).
 */
export function UndoToast({ id, message, actions, onClose }: { id: number; message: string; actions: ToastAction[]; onClose: () => void }) {
  const t = useTheme();
  const dark = useIsDark();
  const insets = useSafeAreaInsets();
  const reduced = useReduceMotion();
  useEffect(() => {
    const h = setTimeout(onClose, 7000);
    return () => clearTimeout(h);
  }, [id, onClose]);
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: TAB_BAR_SPACE + Math.min(insets.bottom, 34), alignItems: 'center', paddingHorizontal: space.lg }}>
      <AnimatedView
        key={id}
        accessibilityLiveRegion="polite"
        style={({
          width: '100%', maxWidth: MAX_CONTENT, backgroundColor: t.card, borderRadius: 22, padding: space.md, gap: space.sm,
          borderWidth: 1, borderColor: t.border, borderCurve: 'continuous',
          ...cardSurface(dark),
          animationName: reduced ? { from: { opacity: 0 }, to: { opacity: 1 } } : keyframes,
          animationDuration: 220, animationTimingFunction: motion.easeOut, animationFillMode: 'both',
        }) as unknown as object}
      >
        <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>{message}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {actions.map((a) => (
            <PressableScale key={a.label} accessibilityRole="button" accessibilityLabel={a.label} onPress={a.onPress}
              style={{ minHeight: 44, paddingHorizontal: space.lg, borderRadius: 999, backgroundColor: t.chip, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: t.primary, fontWeight: '600' }}>{a.label}</Text>
            </PressableScale>
          ))}
          <PressableScale accessibilityRole="button" accessibilityLabel="Cerrar aviso" onPress={onClose}
            style={{ minHeight: 44, paddingHorizontal: space.md, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: t.muted }}>Cerrar</Text>
          </PressableScale>
        </View>
      </AnimatedView>
    </View>
  );
}
