import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDateShort, formatTime, localDateKey, parseDateKey } from '../domain/time';
import { MIN_TOUCH, TAB_BAR_SPACE, cardSurface, platform, radius, space, useIsDark, useTheme } from '../theme';
import { font, size } from '../theme/type';
import { Mascot, type MascotMood } from './Mascot';
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
      // iOS/web: sombra suave + filo; Android: elevación; modo oscuro: solo filo.
      borderWidth: Platform.OS === 'android' && !dark ? 0 : StyleSheet.hairlineWidth * 2, borderColor: t.border,
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
  const bg = kind === 'primary' ? t.primary : kind === 'danger' ? t.danger : 'transparent';
  const fg = kind === 'secondary' ? t.primary : t.onPrimary;
  return (
    <PressableScale
      accessibilityRole="button" accessibilityLabel={title} accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled || !!loading }}
      disabled={disabled || loading} onPress={onPress}
      style={{
        minHeight: MIN_TOUCH, borderRadius: platform.buttonRadius, paddingHorizontal: space.lg, alignItems: 'center', justifyContent: 'center',
        backgroundColor: bg, borderWidth: kind === 'secondary' ? 1.5 : 0, borderColor: t.primary, flexDirection: 'row', gap: space.sm,
      }}>
      {loading ? <ActivityIndicator color={fg} /> : checked ? <Ionicons name="checkmark-circle" size={20} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: size.body, fontWeight: '600' }}>{title}</Text>
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
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: t.text, fontWeight: '600' }}>{label}</Text>
      <TextInput
        accessibilityLabel={label} placeholderTextColor={t.muted}
        style={{
          minHeight: MIN_TOUCH, borderWidth: 1, borderColor: error ? t.danger : t.border, borderRadius: platform.inputRadius,
          paddingHorizontal: space.md, paddingVertical: space.sm, color: t.text, backgroundColor: t.card, fontSize: size.body, fontFamily: font.body,
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
  return (
    <View style={{ gap: 4 }}>
      {label ? <Text style={{ color: t.text, fontWeight: '600' }}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {options.map((o) => (
          <PressableScale key={String(o.value)} onPress={() => onChange(o.value)} accessibilityRole={multi ? 'checkbox' : 'radio'}
            accessibilityState={{ selected: isOn(o.value), checked: isOn(o.value) }} accessibilityLabel={o.a11y ?? o.label}
            style={{ minHeight: 44, paddingHorizontal: space.md, borderRadius: radius.pill, justifyContent: 'center', backgroundColor: isOn(o.value) ? t.chipOn : t.chip }}>
            <Text style={{ color: isOn(o.value) ? t.onPrimary : t.text }}>{o.label}</Text>
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
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  const base = date ? parseDateKey(date) : new Date();
  if (time) { const [h, m] = time.split(':').map(Number); base.setHours(h ?? 0, m ?? 0); }
  const show = (m: 'date' | 'time') => setMode(m);
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: t.text, fontWeight: '600' }}>{label}</Text>
      <Row>
        <Pressable accessibilityRole="button" accessibilityLabel={`${label}: fecha`} onPress={() => show('date')}
          style={{ minHeight: MIN_TOUCH, borderWidth: 1, borderColor: error ? t.danger : t.border, borderRadius: 10, paddingHorizontal: space.md, justifyContent: 'center', backgroundColor: t.card }}>
          <Text style={{ color: t.text, fontSize: 16 }}>{date ? formatDateShort(date) : 'Elegir fecha'}</Text>
        </Pressable>
        {withTime ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`${label}: hora`} onPress={() => show('time')}
            style={{ minHeight: MIN_TOUCH, borderWidth: 1, borderColor: error ? t.danger : t.border, borderRadius: 10, paddingHorizontal: space.md, justifyContent: 'center', backgroundColor: t.card }}>
            <Text style={{ color: t.text, fontSize: 16 }}>{time ?? 'Hora'}</Text>
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

export function Empty({ title, hint, action, mood = 'descanso' }: { title: string; hint?: string; action?: ReactNode; mood?: MascotMood }) {
  return (
    <Card style={{ alignItems: 'center' }}>
      <Mascot mood={mood} size={72} />
      <P>{title}</P>
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

export function ProfileBar({ name, color, label = 'Perfil' }: { name: string; color: string; label?: string }) {
  const t = useTheme();
  return (
    <View accessibilityRole="summary" accessibilityLabel={`${label}: ${name}`} style={{ backgroundColor: color, paddingVertical: 6, paddingHorizontal: space.lg }}>
      <Text style={{ color: t.onHeader, fontWeight: '700' }}>{label}: {name}</Text>
    </View>
  );
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Ocurrió un error inesperado.';
}

/** Título de sección con icono en una pastilla tintada. */
export function SectionTitle({ icon, children }: { icon: React.ComponentProps<typeof Ionicons>['name']; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm }}>
      <View style={{ width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: t.chip, borderCurve: 'continuous' }}>
        <Ionicons name={icon} size={19} color={t.primary} accessibilityElementsHidden importantForAccessibility="no" />
      </View>
      <H level={2}>{children}</H>
    </View>
  );
}
