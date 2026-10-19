import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { motion, useReduceMotion } from '../theme/motion';

export type MascotMood = 'hola' | 'contento' | 'descanso';

const INK = '#14202B';
const OUTLINE = '#2F5D8A';
const BODY = '#8CC1EE';
const BELLY = '#DCEEFB';
const FEET = '#6FA8DC';
const SPARK = '#F2B84B';
const CHEEK = '#F7A8B8';

// En Jest (sin módulo nativo) Reanimated se simula con un objeto vacío: se usa View sin animación.
const AnimatedView = (Animated as { View?: typeof View }).View ?? View;

const entranceKeyframes = {
  from: { opacity: 0, transform: [{ scale: 0.95 }] },
  to: { opacity: 1, transform: [{ scale: 1 }] },
};

/**
 * Nuri, la mascota: una «neurona» amable. Es decorativa (se oculta a los lectores de pantalla)
 * y solo aparece en momentos tranquilos: bienvenida, listas vacías y «todo al día».
 * Nunca en errores, confirmaciones de borrado ni mensajes médicos.
 */
export function Mascot({ mood = 'hola', size = 120, entrance = false }: { mood?: MascotMood; size?: number; entrance?: boolean }) {
  const reduced = useReduceMotion();
  const animated = entrance && !reduced;
  const art = (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* antenas con chispa (dendritas) */}
      <Path d="M80 62 Q66 34 54 28" stroke={OUTLINE} strokeWidth={5} strokeLinecap="round" fill="none" />
      <Path d="M120 62 Q134 34 146 28" stroke={OUTLINE} strokeWidth={5} strokeLinecap="round" fill="none" />
      <Circle cx={52} cy={26} r={8} fill={SPARK} stroke={OUTLINE} strokeWidth={3} />
      <Circle cx={148} cy={26} r={8} fill={SPARK} stroke={OUTLINE} strokeWidth={3} />
      {/* bracitos */}
      <Path d="M40 120 Q22 112 16 126" stroke={OUTLINE} strokeWidth={5} strokeLinecap="round" fill="none" />
      <Path d="M160 120 Q178 112 184 126" stroke={OUTLINE} strokeWidth={5} strokeLinecap="round" fill="none" />
      <Circle cx={15} cy={128} r={5} fill={OUTLINE} />
      <Circle cx={185} cy={128} r={5} fill={OUTLINE} />
      {/* pies */}
      <Ellipse cx={78} cy={168} rx={15} ry={8} fill={FEET} stroke={OUTLINE} strokeWidth={3} />
      <Ellipse cx={122} cy={168} rx={15} ry={8} fill={FEET} stroke={OUTLINE} strokeWidth={3} />
      {/* cuerpo */}
      <Ellipse cx={100} cy={112} rx={64} ry={58} fill={BODY} stroke={OUTLINE} strokeWidth={4} />
      <Ellipse cx={100} cy={130} rx={38} ry={26} fill={BELLY} />
      {/* mejillas */}
      <Ellipse cx={64} cy={122} rx={8} ry={5} fill={CHEEK} opacity={0.75} />
      <Ellipse cx={136} cy={122} rx={8} ry={5} fill={CHEEK} opacity={0.75} />
      {/* ojos */}
      {mood === 'contento' ? (
        <G stroke={INK} strokeWidth={4} strokeLinecap="round" fill="none">
          <Path d="M70 106 Q80 92 90 106" />
          <Path d="M110 106 Q120 92 130 106" />
        </G>
      ) : mood === 'descanso' ? (
        <G stroke={INK} strokeWidth={4} strokeLinecap="round" fill="none">
          <Path d="M70 104 Q80 112 90 104" />
          <Path d="M110 104 Q120 112 130 104" />
        </G>
      ) : (
        <G>
          <Circle cx={80} cy={104} r={11} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={2} />
          <Circle cx={120} cy={104} r={11} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={2} />
          <Circle cx={82} cy={105} r={5.5} fill={INK} />
          <Circle cx={122} cy={105} r={5.5} fill={INK} />
          <Circle cx={84} cy={102.5} r={2} fill="#FFFFFF" />
          <Circle cx={124} cy={102.5} r={2} fill="#FFFFFF" />
        </G>
      )}
      {/* boca */}
      {mood === 'contento' ? (
        <Path d="M86 122 Q100 144 114 122 Z" fill="#F28B82" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      ) : mood === 'descanso' ? (
        <Path d="M92 126 Q100 130 108 126" stroke={INK} strokeWidth={4} strokeLinecap="round" fill="none" />
      ) : (
        <Path d="M88 122 Q100 134 112 122" stroke={INK} strokeWidth={4} strokeLinecap="round" fill="none" />
      )}
    </Svg>
  );
  if (!animated) {
    return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{art}</View>;
  }
  return (
    <AnimatedView
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={({
        animationName: entranceKeyframes,
        animationDuration: 300,
        animationTimingFunction: motion.easeOut,
        animationFillMode: 'both',
      }) as unknown as object}
    >
      {art}
    </AnimatedView>
  );
}
