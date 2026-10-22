import { View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { Text } from './Text';
import { useTheme } from '../theme';

// Texto del gráfico en la fuente del sistema (si no, el navegador usa una con serifas).
const SVG_FONT = '-apple-system, system-ui, "SF Pro Text", Roboto, Helvetica, Arial, sans-serif';

export interface Bar { label: string; value: number }

/** Barras simples y accesibles (descripción textual completa en accessibilityLabel). */
export function BarChart({ data, title, height = 160, unit = '' }: { data: Bar[]; title: string; height?: number; unit?: string }) {
  const t = useTheme();
  const w = 320;
  const pad = 22;
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = data.length ? (w - pad * 2) / data.length : 0;
  const summary = `${title}. ` + data.map((d) => `${d.label}: ${d.value}${unit}`).join('; ');
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={summary} style={{ gap: 6 }}>
      <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>{title}</Text>
      <Svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`}>
        <Line x1={pad} y1={height - pad} x2={w - pad} y2={height - pad} stroke={t.border} />
        <G>
          {data.map((d, i) => {
            const bh = ((height - pad * 2) * d.value) / max;
            const x = pad + i * bw + 2;
            return (
              <G key={`${d.label}-${i}`}>
                <Rect x={x} y={height - pad - bh} width={Math.max(1, bw - 4)} height={bh} fill={t.primary} rx={Math.min(5, Math.max(1, bw - 4) / 2)} />
                {d.value > 0 ? <SvgText x={x + (bw - 4) / 2} y={height - pad - bh - 3} fontSize={10} fontWeight="600" fontFamily={SVG_FONT} fill={t.text} textAnchor="middle">{d.value}</SvgText> : null}
                {data.length <= 12 || i % Math.ceil(data.length / 8) === 0
                  ? <SvgText x={x + (bw - 4) / 2} y={height - 8} fontSize={9} fontFamily={SVG_FONT} fill={t.muted} textAnchor="middle">{d.label}</SvgText> : null}
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}
