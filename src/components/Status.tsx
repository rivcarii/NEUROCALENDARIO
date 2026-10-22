import { View } from 'react-native';
import { Text } from './Text';
import { LEVEL_COLOR, LEVEL_LABEL, type Finding, type Level } from '../domain/analysis';
import { space, useIsDark, useTheme } from '../theme';
import { font } from '../theme/type';

/** Texto sobre cada color del semáforo con contraste suficiente (el amarillo lleva texto oscuro). */
export const onLevel = (l: Level) => (l === 'amarillo' || l === 'sin_datos' ? '#1B1B1B' : '#FFFFFF');

/** Medidor 0–100 del estado: barra con el color del semáforo y una etiqueta en palabras (el color nunca va solo). */
export function Gauge({ value, level, title }: { value: number | null; level: Level; title?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }} accessible accessibilityRole="progressbar" accessibilityLabel={`${title ?? 'Estado'}: ${LEVEL_LABEL[level]}${value === null ? '' : `, ${value} de 100`}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: LEVEL_COLOR[level] }} />
        <Text style={{ color: t.text, fontFamily: font.displaySemi, fontSize: 18 }}>{LEVEL_LABEL[level]}</Text>
        {value !== null ? <Text style={{ color: t.muted, marginLeft: 'auto' }}>{value}/100</Text> : null}
      </View>
      <View style={{ height: 12, borderRadius: 6, backgroundColor: t.chip, overflow: 'hidden' }}>
        <View style={{ width: `${value ?? 0}%`, height: '100%', backgroundColor: LEVEL_COLOR[level], borderRadius: 6 }} />
      </View>
    </View>
  );
}

/** Fila de días como cuadritos de color (semáforo por día). */
export function LevelStrip({ cells, size = 26 }: { cells: { key: string; label: string; level: Level }[]; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
      {cells.map((c) => (
        <View key={c.key} accessible accessibilityLabel={`${c.label}: ${LEVEL_LABEL[c.level]}`}
          style={{ width: size, height: size, borderRadius: 8, backgroundColor: LEVEL_COLOR[c.level], alignItems: 'center', justifyContent: 'center', borderCurve: 'continuous' }}>
          <Text style={{ color: onLevel(c.level), fontSize: 11, fontWeight: '700' }}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function Legend() {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
      {(['verde', 'amarillo', 'rojo', 'sin_datos'] as const).map((l) => (
        <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: LEVEL_COLOR[l] }} />
          <Text style={{ color: t.muted, fontSize: 13 }}>{LEVEL_LABEL[l]}</Text>
        </View>
      ))}
    </View>
  );
}

const TONE = { bien: ['#1F7A36', 'Bien', 'checkmark-circle'], info: ['#4C46D6', 'Información', 'information-circle'], atencion: ['#A04800', 'Atención', 'alert-circle'], importante: ['#D70015', 'Importante', 'warning'] } as const;

export function FindingCard({ f }: { f: Finding }) {
  const t = useTheme();
  const dark = useIsDark();
  const [color, label] = TONE[f.tone];
  return (
    <View accessible style={{ backgroundColor: t.card, borderRadius: 18, borderCurve: 'continuous', padding: space.md, gap: 4, borderWidth: 1, borderColor: t.border, borderLeftWidth: 6, borderLeftColor: color }}>
      <Text style={{ color: dark ? t.text : color, fontWeight: '700', fontSize: 13 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: t.text, fontFamily: font.displaySemi, fontSize: 16 }}>{f.title}</Text>
      <Text style={{ color: t.text }}>{f.text}</Text>
      <Text style={{ color: t.muted, fontSize: 12 }}>Base: {f.basis}</Text>
    </View>
  );
}
