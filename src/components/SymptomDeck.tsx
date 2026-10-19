import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import { ScrollView, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated from 'react-native-reanimated';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { cardSurface, platform, space, useIsDark, useTheme } from '../theme';
import { motion, useReduceMotion } from '../theme/motion';
import { font } from '../theme/type';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// En Jest (sin módulo nativo) Reanimated se simula con un objeto vacío: se usa View sin transiciones.
const AnimatedView = (Animated as { View?: typeof View }).View ?? View;

/** Tipos de afección: cada tarjeta agrupa los síntomas que se parecen (nombres que usa el paciente). */
export const SYMPTOM_GROUPS: { key: string; title: string; hint: string; icon: IconName; accent: string; kinds: { kind: string; icon: IconName }[] }[] = [
  { key: 'cabeza', title: 'Cabeza y equilibrio', hint: 'Dolor, giros, vista', icon: 'bulb-outline', accent: '#4C8BC7',
    kinds: [{ kind: 'Dolor de cabeza', icon: 'thunderstorm-outline' }, { kind: 'Mareo', icon: 'sync-outline' }, { kind: 'Visión borrosa o doble', icon: 'eye-outline' }] },
  { key: 'movimiento', title: 'Movimiento y fuerza', hint: 'Temblor, debilidad', icon: 'body-outline', accent: '#D9822B',
    kinds: [{ kind: 'Temblor', icon: 'pulse-outline' }, { kind: 'Debilidad', icon: 'battery-half-outline' }, { kind: 'Convulsión', icon: 'flash-outline' }] },
  { key: 'sensaciones', title: 'Cómo se siente', hint: 'Hormigueo, cansancio', icon: 'hand-left-outline', accent: '#3E9C7A',
    kinds: [{ kind: 'Hormigueo o adormecimiento', icon: 'finger-print-outline' }, { kind: 'Mucho cansancio', icon: 'moon-outline' }, { kind: 'Desmayo', icon: 'arrow-down-circle-outline' }] },
  { key: 'mente', title: 'Habla y memoria', hint: 'Palabras, olvidos', icon: 'chatbubble-ellipses-outline', accent: '#8A63C9',
    kinds: [{ kind: 'Dificultad para hablar', icon: 'chatbubble-outline' }, { kind: 'Confusión', icon: 'help-circle-outline' }, { kind: 'Olvidos', icon: 'time-outline' }] },
  { key: 'otro', title: 'Otro síntoma', hint: 'Algo distinto', icon: 'add-circle-outline', accent: '#6B7C8C',
    kinds: [{ kind: 'Otro', icon: 'add-circle-outline' }] },
];

/**
 * «Anotar ahora» como baraja horizontal: una tarjeta por tipo de afección, asomando la siguiente por detrás.
 * La tarjeta activa va al frente; las demás se ven más pequeñas y atenuadas (transform + opacity, hilo de UI).
 * Cada síntoma muestra de inmediato un «✓ Anotado» y, después, cuántas veces se ha anotado hoy, para que quede claro que se guardó.
 */
export function SymptomDeck({ counts, flash, onPick }: { counts: Record<string, number>; flash: string | null; onPick: (kind: string) => void }) {
  const t = useTheme();
  const dark = useIsDark();
  const reduced = useReduceMotion();
  const ref = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [w, setW] = useState(0);
  const [active, setActive] = useState(0);
  const cardW = Math.max(240, (w || 320) * 0.8);
  const gap = 12;
  const step = cardW + gap;

  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(SYMPTOM_GROUPS.length - 1, Math.round(e.nativeEvent.contentOffset.x / step)));
    if (i !== active) setActive(i);
  };
  const go = (i: number) => { setActive(i); ref.current?.scrollTo({ x: i * step, animated: !reduced }); };

  return (
    <View style={{ gap: space.sm }} onLayout={onLayout}>
      <ScrollView
        ref={ref} horizontal showsHorizontalScrollIndicator={false} snapToInterval={step} snapToAlignment="start" decelerationRate="fast"
        onScroll={onScroll} scrollEventThrottle={32}
        contentContainerStyle={{ gap, paddingRight: Math.max(0, (w || 320) - cardW), paddingBottom: 14, paddingTop: 4 }}
      >
        {SYMPTOM_GROUPS.map((g, i) => {
          const front = i === active;
          return (
            <AnimatedView
              key={g.key}
              accessibilityLabel={`Tipo: ${g.title}`}
              style={({
                width: cardW, backgroundColor: t.card, borderRadius: platform.cardRadius, borderCurve: 'continuous', overflow: 'hidden',
                borderWidth: 1.5, borderColor: front ? g.accent : t.border, ...cardSurface(dark),
                transitionProperty: ['transform', 'opacity'], transitionDuration: reduced ? 0 : 240, transitionTimingFunction: motion.easeOut,
                transform: [{ translateY: front ? 0 : 10 }, { scale: front ? 1 : 0.94 }],
                opacity: front ? 1 : 0.78,
              }) as unknown as object}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, backgroundColor: g.accent + (dark ? '33' : '22') }}>
                <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: g.accent, alignItems: 'center', justifyContent: 'center', borderCurve: 'continuous' }}>
                  <Ionicons name={g.icon} size={22} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontFamily: font.displaySemi, fontSize: 17 }}>{g.title}</Text>
                  <Text style={{ color: t.muted, fontSize: 13 }}>{g.hint}</Text>
                </View>
              </View>
              <View style={{ padding: space.sm, gap: 6 }}>
                {g.kinds.map((k) => {
                  const n = counts[k.kind] ?? 0;
                  const just = flash === k.kind;
                  return (
                    <PressableScale
                      key={k.kind} accessibilityRole="button" accessibilityLabel={k.kind}
                      accessibilityHint={n > 0 ? `Hoy ya lo anotó ${n} ${n === 1 ? 'vez' : 'veces'}` : undefined}
                      onPress={() => onPick(k.kind)}
                      style={{
                        minHeight: 52, borderRadius: 16, borderCurve: 'continuous', paddingHorizontal: space.md, flexDirection: 'row', alignItems: 'center', gap: space.sm,
                        backgroundColor: just ? g.accent : t.chip,
                      }}
                    >
                      <Ionicons name={just ? 'checkmark-circle' : k.icon} size={22} color={just ? '#FFFFFF' : g.accent} />
                      <Text style={{ flex: 1, color: just ? '#FFFFFF' : t.text, fontWeight: '600' }}>{k.kind}</Text>
                      {just ? (
                        <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Anotado</Text>
                      ) : n > 0 ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: g.accent + '2E' }}>
                          <Ionicons name="checkmark" size={14} color={t.text} />
                          <Text style={{ color: t.text, fontSize: 13, fontWeight: '700' }}>Hoy ×{n}</Text>
                        </View>
                      ) : null}
                    </PressableScale>
                  );
                })}
              </View>
            </AnimatedView>
          );
        })}
      </ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        {SYMPTOM_GROUPS.map((g, i) => (
          <PressableScale key={g.key} accessibilityRole="button" accessibilityLabel={`Ver ${g.title}`} onPress={() => go(i)} hitSlop={10}
            style={{ width: i === active ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i === active ? g.accent : t.border }} />
        ))}
      </View>
    </View>
  );
}
