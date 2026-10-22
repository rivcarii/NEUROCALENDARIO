import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { BRAND } from '../brand/geometry';
import { useIsDark } from '../theme';
import { motion, useReduceMotion } from '../theme/motion';

export type NeuroArtKind = 'cerebro' | 'neurona' | 'ondas' | 'sinapsis';

// En Jest (sin módulo nativo) Reanimated se simula con un objeto vacío: se usa View sin animación.
const AnimatedView = (Animated as { View?: typeof View }).View ?? View;
const enter = { from: { opacity: 0, transform: [{ translateY: 8 }, { scale: 0.97 }] }, to: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] } };

/** Trazo de EEG determinista (sin aleatoriedad): ondas de fondo + un complejo punta-onda opcional. */
function eeg(y: number, amp: number, freq: number, spikeAt: number | null): string {
  let d = `M40 ${y}`;
  for (let x = 42; x <= 200; x += 2) {
    let v = Math.sin(x / freq) * amp + Math.sin(x / (freq * 0.37)) * amp * 0.35;
    if (spikeAt !== null && Math.abs(x - spikeAt) < 9) v += x < spikeAt ? -(9 - (spikeAt - x)) * 2.2 : (9 - (x - spikeAt)) * 1.4;
    d += `L${x} ${(y + v).toFixed(1)}`;
  }
  return d;
}

/**
 * Ilustraciones de neurociencia propias (decorativas, ocultas a lectores de pantalla):
 * cerebro (vista lateral con red neuronal), neurona (soma, dendritas, axón mielinizado), ondas (EEG) y sinapsis.
 * Aparecen en momentos tranquilos: bienvenida, listas vacías, «todo al día», acerca de.
 */
export function NeuroArt({ kind = 'neurona', size = 200, entrance = true }: { kind?: NeuroArtKind; size?: number; entrance?: boolean }) {
  const dark = useIsDark();
  const reduced = useReduceMotion();
  const ink = dark ? '#A9A6FF' : BRAND.indigo;
  const soft = dark ? '#2A2950' : BRAND.lavender;
  const aqua = dark ? '#123E45' : BRAND.aqua;
  const teal = dark ? '#3CC8D8' : BRAND.teal;
  const art = (
    <Svg width={size} height={(size * 160) / 240} viewBox="0 0 240 160">
      <Circle cx={120} cy={82} r={72} fill={soft} opacity={dark ? 0.6 : 0.7} />
      <Circle cx={190} cy={36} r={14} fill={aqua} />
      <Circle cx={48} cy={124} r={9} fill={aqua} />
      {kind === 'cerebro' ? (
        <G>
          <Path d="M146 112C146 124 144 134 140 146L130 146C134 135 136 124 134 112Z" fill={teal} opacity={0.85} />
          <Path d="M150 110C152 124 170 130 183 121C191 115 191 103 184 97" fill={aqua} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
          <Path d="M158 117C166 120 175 119 182 113M160 111C168 113 176 111 183 105" fill="none" stroke={ink} strokeWidth={1.6} strokeLinecap="round" opacity={0.7} />
          <Path d="M64 96C52 86 50 64 64 50C72 36 92 28 110 32C122 22 146 22 160 32C176 32 192 44 194 60C204 70 202 90 190 98C186 110 170 116 156 112C146 120 128 120 118 112C104 118 86 116 78 106C70 106 66 102 64 96Z" fill={dark ? '#1E1D3A' : '#FFFFFF'} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
          <Path d="M132 30C128 46 136 58 126 72C120 80 124 90 118 98M80 98C96 90 116 88 140 84C152 82 160 76 170 78M88 44C96 52 92 62 102 68M108 38C112 50 106 58 112 66M150 34C146 46 156 54 150 64M172 44C164 56 176 62 170 74M184 66C176 76 186 84 178 92M98 104C108 100 118 104 128 102M72 70C80 74 78 84 88 86M156 92C164 96 172 94 178 100" fill="none" stroke={ink} strokeWidth={2.4} strokeLinecap="round" opacity={0.8} />
          <Path d="M96 58L124 62L150 52M124 62L110 92L166 90L150 52" fill="none" stroke={teal} strokeWidth={1.8} strokeDasharray="3 4" strokeLinecap="round" />
          {[[96, 58], [124, 62], [150, 52], [166, 90], [110, 92]].map(([x, y]) => (
            <G key={`${x}-${y}`}><Circle cx={x} cy={y} r={7} fill={teal} opacity={0.22} /><Circle cx={x} cy={y} r={3.6} fill={teal} /></G>
          ))}
          <Circle cx={124} cy={62} r={3.6} fill={BRAND.gold} />
        </G>
      ) : null}
      {kind === 'neurona' ? (
        <G>
          <Path d="M64 70C54 62 48 50 40 46M50 56C44 56 38 60 32 58M62 88C52 96 46 108 36 112M48 102C42 98 36 98 30 100M70 64C66 52 70 40 64 30M68 46C74 40 80 38 86 34M72 96C70 108 74 118 70 128" fill="none" stroke={ink} strokeWidth={3.4} strokeLinecap="round" />
          <Path d="M95 80C120 80 140 78 170 80" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
          {[104, 126, 148].map((x) => <Rect key={x} x={x} y={73} width={16} height={13} rx={6.5} fill={aqua} stroke={teal} strokeWidth={2} />)}
          <Path d="M170 80C182 72 190 66 198 62M170 80C184 80 192 82 202 84M170 80C182 90 188 98 196 104" fill="none" stroke={ink} strokeWidth={2.6} strokeLinecap="round" />
          {[[200, 61], [205, 84], [198, 106]].map(([x, y]) => <Circle key={x} cx={x} cy={y} r={5} fill={teal} />)}
          <Circle cx={78} cy={80} r={17} fill={dark ? '#1E1D3A' : '#FFFFFF'} stroke={ink} strokeWidth={3} />
          <Circle cx={78} cy={80} r={6.5} fill={ink} />
          <Circle cx={163} cy={80} r={3.4} fill={BRAND.gold} />
          <Circle cx={142} cy={80} r={2.2} fill={BRAND.gold} opacity={0.6} />
        </G>
      ) : null}
      {kind === 'ondas' ? (
        <G>
          <Rect x={30} y={32} width={180} height={96} rx={16} fill={dark ? '#1E1D3A' : '#FFFFFF'} stroke={ink} strokeWidth={2.4} />
          <Path d="M30 64H210M30 96H210M75 32V128M120 32V128M165 32V128" stroke={ink} strokeWidth={1} opacity={0.12} />
          <Path d={eeg(52, 3.2, 3.1, 122)} fill="none" stroke={ink} strokeWidth={2.2} strokeLinejoin="round" />
          <Path d={eeg(82, 2.6, 4.3, null)} fill="none" stroke={teal} strokeWidth={2.2} strokeLinejoin="round" />
          <Path d={eeg(110, 2.2, 2.4, null)} fill="none" stroke={BRAND.rose} strokeWidth={2} strokeLinejoin="round" opacity={0.85} />
        </G>
      ) : null}
      {kind === 'sinapsis' ? (
        <G>
          <Path d="M60 18C60 50 72 70 120 72C168 70 180 50 180 18Z" fill={dark ? '#1E1D3A' : '#FFFFFF'} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
          {[[96, 40], [120, 34], [144, 40], [108, 56], [134, 56]].map(([x, y]) => <Circle key={`${x}${y}`} cx={x} cy={y} r={7} fill={aqua} stroke={teal} strokeWidth={2} />)}
          {[[104, 82], [116, 88], [126, 80], [138, 87], [112, 95], [130, 94]].map(([x, y]) => <Circle key={`d${x}${y}`} cx={x} cy={y} r={2.6} fill={teal} />)}
          <Path d="M48 124C80 104 160 104 192 124V142H48Z" fill={aqua} stroke={teal} strokeWidth={2.6} strokeLinejoin="round" />
          {[86, 104, 122, 140, 158].map((x) => <Rect key={x} x={x - 4} y={104 + Math.abs(x - 122) * 0.12} width={8} height={10} rx={3} fill={ink} />)}
          <Circle cx={120} cy={88} r={3.2} fill={BRAND.gold} />
        </G>
      ) : null}
    </Svg>
  );
  if (!entrance || reduced) return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ alignItems: 'center' }}>{art}</View>;
  return (
    <AnimatedView accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={({ alignItems: 'center', animationName: enter, animationDuration: 420, animationTimingFunction: motion.easeOut, animationFillMode: 'both' }) as unknown as object}>
      {art}
    </AnimatedView>
  );
}
