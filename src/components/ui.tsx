import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View, type SwitchProps, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDateShort, formatTime, localDateKey, parseDateKey } from '../domain/time';
import { MIN_TOUCH, TAB_BAR_SPACE, cardSurface, platform, radius, space, useIsDark, useTheme } from '../theme';
import { SYSTEM_FONT, font, size } from '../theme/type';

/** Relleno de campos de formulario (como `tertiarySystemFill` de iOS). */
const fieldFill = (dark: boolean) => (dark ? '#7676803D' : '#7676801C');
import Animated from 'react-native-reanimated';
import { NeuroIcon } from './Brand';
import { NeuroArt, type NeuroArtKind } from './NeuroArt';
import type { IconName } from '../brand/geometry';
import { motion, useReduceMotion } from '../theme/motion';
import { PressableScale } from './PressableScale';

/** Ancho máximo del contenido: en tabletas y navegadores de escritorio no se estira. */
export const MAX_CONTENT = 640;

export function Screen({ children, scroll = true, footer, tabs = false }: { children: ReactNode; scroll?: boolean; footer?: ReactNode; /** Pantalla con barra de pestañas flotante: deja espacio al final. */ tabs?: boolean }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = tabs ? TAB_BAR_SPACE + Math.min(insets.bottom, 34) : space.xl * 2;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['left', 'right', 'bottom']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: bottomPad, width: '100%', maxWidth: MAX_CONTENT, alignSelf: 'center' }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets // iOS: el teclado no tapa el campo que se escribe
          contentInsetAdjustmentBehavior="automatic"
        >
          {children}
        </ScrollView>
      ) : <View style={{ flex: 1, padding: space.lg, gap: space.md, width: '100%', maxWidth: MAX_CONTENT, alignSelf: 'center' }}>{children}</View>}
      {footer}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const dark = useIsDark();
  return (
    <View style={[{
      backgroundColor: t.card, borderRadius: platform.cardRadius, padding: space.lg, gap: space.sm,
      // Estilo «lista agrupada» de Apple: superficie plana, esquinas continuas, sin borde.
      borderCurve: 'continuous', borderWidth: 0, borderColor: t.border,
    }, cardSurface(dark), style]}>{children}</View>
  );
}

export function H({ children, level = 1 }: { children: ReactNode; level?: 1 | 2 }) {
  const t = useTheme();
  return <Text accessibilityRole="header" style={{ color: t.text, fontSize: level === 1 ? size.h1 : size.h2, fontFamily: level === 1 ? font.display : font.displaySemi }}>{children}</Text>;
}

export function P({ children, muted, small, style }: { children: ReactNode; muted?: boolean; small?: boolean; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <Text style={[{ color: muted ? t.muted : t.text, fontSize: small ? size.caption : platform.body, lineHeight: small ? 18 : Math.round(platform.body * 1.4) }, style as never]}>{children}</Text>;
}

export function Button({ title, onPress, kind = 'primary', disabled, loading, accessibilityHint, checked }: {
  title: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'danger'; disabled?: boolean; loading?: boolean; accessibilityHint?: string; /** Estado elegido: muestra una marca para que se vea que quedó guardado. */ checked?: boolean;
}) {
  const t = useTheme();
  // Botones de Apple: «relleno» (principal), «tintado» (secundario) y rojo para lo destructivo.
  const bg = kind === 'primary' ? t.primary : kind === 'danger' ? t.danger : t.chip;
  const fg = kind === 'secondary' ? t.primary : t.onPrimary;
  return (
    <PressableScale
      accessibilityRole="button" accessibilityLabel={title} accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled || !!loading }}
      disabled={disabled || loading} onPress={onPress}
      style={{
        minHeight: MIN_TOUCH, borderRadius: platform.buttonRadius, paddingHorizontal: space.lg, alignItems: 'center', justifyContent: 'center',
        backgroundColor: bg, borderWidth: 0, flexDirection: 'row', gap: space.sm, borderCurve: 'continuous',
      }}>
      {loading ? <ActivityIndicator color={fg} /> : checked ? <Ionicons name="checkmark-circle" size={20} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: size.body, fontWeight: '600', letterSpacing: -0.2 }}>{title}</Text>
    </PressableScale>
  );
}

/** Texto pulsable con área táctil de al menos 44 px y rol de botón para lectores de pantalla. */
export function TapText({ onPress, style, children }: { onPress: () => void; style?: StyleProp<TextStyle>; children: ReactNode }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ minHeight: 44, justifyContent: 'center' }}>
      <Text style={style}>{children}</Text>
    </Pressable>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' }, style]}>{children}</View>;
}

export function TextField({ label, error, hint, ...rest }: TextInputProps & { label: string; error?: string; hint?: string }) {
  const t = useTheme();
  const dark = useIsDark();
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: t.text, fontWeight: '600' }}>{label}</Text>
      <TextInput
        accessibilityLabel={label} placeholderTextColor={t.muted}
        style={{
          // Campo «relleno» de iOS: gris translúcido que se ve igual sobre fondo gris o sobre tarjeta blanca.
          minHeight: MIN_TOUCH, borderWidth: error ? 1.5 : 0, borderColor: t.danger, borderRadius: platform.inputRadius, borderCurve: 'continuous',
          paddingHorizontal: space.md, paddingVertical: space.sm, color: t.text, backgroundColor: fieldFill(dark), fontSize: size.body, fontFamily: SYSTEM_FONT,
          textAlignVertical: rest.multiline ? 'top' : 'center',
        }}
        {...rest}
      />
      {hint && !error ? <Text style={{ color: t.muted, fontSize: 12 }}>{hint}</Text> : null}
      {error ? <Text accessibilityLiveRegion="polite" style={{ color: t.danger, fontSize: 13 }}>{error}</Text> : null}
    </View>
  );
}

export function Chips<T extends string | number>({ label, options, value, onChange, multi }: {
  label?: string; options: { value: T; label: string; a11y?: string }[]; value: T | T[] | null; onChange: (v: T) => void; multi?: boolean;
}) {
  const t = useTheme();
  const isOn = (v: T) => (multi ? (value as T[]).includes(v) : value === v);
  if (!multi && !label && options.length <= 4) return <Segmented options={options} value={value as T} onChange={onChange} />;
  return (
    <View style={{ gap: 4 }}>
      {label ? <Text style={{ color: t.text, fontWeight: '600' }}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {options.map((o) => (
          <PressableScale key={String(o.value)} onPress={() => onChange(o.value)} accessibilityRole={multi ? 'checkbox' : 'radio'}
            accessibilityState={{ selected: isOn(o.value), checked: isOn(o.value) }} accessibilityLabel={o.a11y ?? o.label}
            style={{ minHeight: 44, paddingHorizontal: space.md, borderRadius: radius.pill, justifyContent: 'center', backgroundColor: isOn(o.value) ? t.chipOn : t.chip, borderCurve: 'continuous' }}>
            <Text style={{ color: isOn(o.value) ? t.onPrimary : t.text, fontWeight: isOn(o.value) ? '600' : '400' }}>{o.label}</Text>
          </PressableScale>
        ))}
      </View>
    </View>
  );
}

/** Selector de fecha (AAAA-MM-DD) y, opcionalmente, hora (HH:MM). Trabaja en hora local. */
export function DateTimeField({ label, date, time, onChange, withTime = true, optional, error }: {
  label: string; date: string | null; time?: string | null; withTime?: boolean; optional?: boolean; error?: string;
  onChange: (date: string | null, time: string | null) => void;
}) {
  const t = useTheme();
  const dark = useIsDark();
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  const base = date ? parseDateKey(date) : new Date();
  if (time) { const [h, m] = time.split(':').map(Number); base.setHours(h ?? 0, m ?? 0); }
  const show = (m: 'date' | 'time') => setMode(m);
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: t.text, fontWeight: '600' }}>{label}</Text>
      <Row>
        <Pressable accessibilityRole="button" accessibilityLabel={`${label}: fecha`} onPress={() => show('date')}
          style={{ minHeight: MIN_TOUCH, borderWidth: error ? 1.5 : 0, borderColor: t.danger, borderRadius: 10, paddingHorizontal: space.md, justifyContent: 'center', backgroundColor: fieldFill(dark), borderCurve: 'continuous' }}>
          <Text style={{ color: date ? t.primary : t.muted, fontSize: 17, fontWeight: '500' }}>{date ? formatDateShort(date) : 'Elegir fecha'}</Text>
        </Pressable>
        {withTime ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`${label}: hora`} onPress={() => show('time')}
            style={{ minHeight: MIN_TOUCH, borderWidth: error ? 1.5 : 0, borderColor: t.danger, borderRadius: 10, paddingHorizontal: space.md, justifyContent: 'center', backgroundColor: fieldFill(dark), borderCurve: 'continuous' }}>
            <Text style={{ color: time ? t.primary : t.muted, fontSize: 17, fontWeight: '500' }}>{time ?? 'Hora'}</Text>
          </Pressable>
        ) : null}
        {optional && date ? <Button title="Quitar" kind="secondary" onPress={() => onChange(null, null)} /> : null}
      </Row>
      {mode ? (
        <DateTimePicker
          value={base} mode={mode} is24Hour display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(ev, d) => {
            if (Platform.OS !== 'ios') setMode(null);
            if (ev.type === 'dismissed' || !d) return;
            const nd = mode === 'date' ? localDateKey(d) : (date ?? localDateKey(new Date()));
            const nt = mode === 'time' ? formatTime(d.toISOString()) : (time ?? (withTime ? '09:00' : null));
            onChange(nd, withTime ? nt : null);
          }}
        />
      ) : null}
      {mode && Platform.OS === 'ios' ? <Button title="Listo" kind="secondary" onPress={() => setMode(null)} /> : null}
      {error ? <Text accessibilityLiveRegion="polite" style={{ color: t.danger, fontSize: 13 }}>{error}</Text> : null}
    </View>
  );
}

export function Empty({ title, hint, action, art = 'neurona' }: { title: string; hint?: string; action?: ReactNode; art?: NeuroArtKind }) {
  return (
    <Card style={{ alignItems: 'center' }}>
      <NeuroArt kind={art} size={168} entrance={false} />
      <P style={{ textAlign: 'center' } as never}>{title}</P>
      {hint ? <P muted small>{hint}</P> : null}
      {action}
    </Card>
  );
}

export function Loading() {
  const t = useTheme();
  return <View style={{ padding: space.xl, alignItems: 'center' }}><ActivityIndicator color={t.primary} accessibilityLabel="Cargando" /></View>;
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useTheme();
  return (
    <Card style={{ borderColor: t.danger }}>
      <Text accessibilityRole="alert" style={{ color: t.danger, fontWeight: '600' }}>{message}</Text>
      {onRetry ? <Button title="Reintentar" kind="secondary" onPress={onRetry} /> : null}
    </Card>
  );
}

/** Aviso simple que funciona en todas las plataformas (en web `Alert.alert` no muestra nada). */
export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

export function confirmDestructive(title: string, message: string, confirmLabel: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    // Alert.alert no muestra nada en web (solo se usa en las pruebas de humo en navegador).
    return Promise.resolve(typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}\n\n[${confirmLabel}]`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Conservar', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

/** Indica de quién son los datos en pantallas secundarias (pastilla con iniciales, estilo Apple). */
export function ProfileBar({ name, color, label = 'Perfil' }: { name: string; color: string; label?: string }) {
  const t = useTheme();
  const ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
  return (
    <View accessibilityRole="summary" accessibilityLabel={`${label}: ${name}`} style={{ backgroundColor: t.bg, paddingHorizontal: space.lg, paddingTop: space.sm, alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: MAX_CONTENT, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>{ini}</Text>
        </View>
        <Text style={{ color: t.muted, fontSize: 14 }}>{label}: <Text style={{ color: t.text, fontWeight: '600', fontSize: 14 }}>{name}</Text></Text>
      </View>
    </View>
  );
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Ocurrió un error inesperado.';
}

/** Título de sección con icono en una pastilla tintada. */
export function SectionTitle({ icon, children }: { icon: IconName; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm }}>
      <View style={{ width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: t.tint, borderCurve: 'continuous' }}>
        <NeuroIcon name={icon} size={20} color={t.primary} />
      </View>
      <H level={2}>{children}</H>
    </View>
  );
}

// En Jest (sin módulo nativo) Reanimated se simula con un objeto vacío: se usa View sin transiciones.
const AnimatedView = (Animated as { View?: typeof View }).View ?? View;

/**
 * Control segmentado de Apple: pista gris y una píldora blanca que se desliza a la opción elegida
 * (transform, 220 ms, curva ease-out; sin desplazamiento con «reducir movimiento»).
 */
export function Segmented<T extends string | number>({ options, value, onChange }: { options: { value: T; label: string; a11y?: string }[]; value: T | null; onChange: (v: T) => void }) {
  const t = useTheme();
  const dark = useIsDark();
  const reduced = useReduceMotion();
  const [w, setW] = useState(0);
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const seg = w / options.length;
  return (
    <View accessibilityRole="radiogroup" onLayout={(e) => setW(e.nativeEvent.layout.width - 4)}
      style={{ flexDirection: 'row', backgroundColor: dark ? '#2C2C2E' : '#E4E4EB', borderRadius: 12, padding: 2, borderCurve: 'continuous' }}>
      {w > 0 ? (
        <AnimatedView pointerEvents="none" style={({
          position: 'absolute', top: 2, bottom: 2, left: 2, width: seg, borderRadius: 10, backgroundColor: dark ? '#636366' : '#FFFFFF',
          shadowColor: '#000', shadowOpacity: dark ? 0 : 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
          transform: [{ translateX: idx * seg }], transitionProperty: 'transform', transitionDuration: reduced ? 0 : 220, transitionTimingFunction: motion.easeOut,
        }) as unknown as object} />
      ) : null}
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={String(o.value)} accessibilityRole="radio" accessibilityState={{ selected: on, checked: on }} accessibilityLabel={o.a11y ?? o.label}
            onPress={() => onChange(o.value)} style={{ flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: w > 0 || !on ? 'transparent' : t.card }}>
            <Text style={{ color: t.text, fontSize: 15, fontWeight: on ? '600' : '400' }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Interruptor con los colores de iOS (en web, el de serie es verde azulado de Material). */
export function Toggle(props: SwitchProps) {
  const dark = useIsDark();
  return (
    <Switch
      trackColor={{ true: '#34C759', false: dark ? '#39393D' : '#E9E9EA' }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={dark ? '#39393D' : '#E9E9EA'}
      {...({ activeThumbColor: '#FFFFFF' } as object)}
      {...props}
    />
  );
}
