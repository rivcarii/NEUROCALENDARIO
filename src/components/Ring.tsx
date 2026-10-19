import Svg, { Circle } from 'react-native-svg';
import { View } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme';
import { font } from '../theme/type';

/** Anillo de avance (p. ej. medicinas tomadas hoy). Decorativo: el dato se lee en el texto de al lado. */
export function Ring({ done, total, size = 76 }: { done: number; total: number; size?: number }) {
  const t = useTheme();
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(1, done / total) : 0;
  const full = total > 0 && done >= total;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.chip} strokeWidth={stroke} fill="none" />
        {pct > 0 ? (
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={full ? t.success : t.primary} strokeWidth={stroke} fill="none"
            strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} />
        ) : null}
      </Svg>
      <Text style={{ color: t.text, fontFamily: font.displaySemi, fontSize: size * 0.28 }}>{total > 0 ? `${done}/${total}` : '–'}</Text>
    </View>
  );
}
