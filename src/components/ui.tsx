import DateTimePicker from '@react-native-community/datetimepicker';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, TextInput, View,
  type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDateShort, formatTime, localDateKey, parseDateKey } from '../domain/time';
import { MIN_TOUCH, space, useTheme } from '../theme';

export function Screen({ children, scroll = true, footer }: { children: ReactNode; scroll?: boolean; footer?: ReactNode }) {
  const t = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['left', 'right', 'bottom']}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : <View style={{ flex: 1, padding: space.lg, gap: space.md }}>{children}</View>}
      {footer}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[{ backgroundColor: t.card, borderRadius: 12, borderWidth: 1, borderColor: t.border, padding: space.lg, gap: space.sm }, style]}>{children}</View>;
}

export function H({ children, level = 1 }: { children: ReactNode; level?: 1 | 2 }) {
  const t = useTheme();
  return <Text accessibilityRole="header" style={{ color: t.text, fontSize: level === 1 ? 24 : 18, fontWeight: '700' }}>{children}</Text>;
}

export function P({ children, muted, small, style }: { children: ReactNode; muted?: boolean; small?: boolean; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <Text style={[{ color: muted ? t.muted : t.text, fontSize: small ? 13 : 16, lineHeight: small ? 18 : 22 }, style as never]}>{children}</Text>;
}

export function Button({ title, onPress, kind = 'primary', disabled, loading, accessibilityHint }: {
  title: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'danger'; disabled?: boolean; loading?: boolean; accessibilityHint?: string;
}) {
  const t = useTheme();
  const bg = kind === 'primary' ? t.primary : kind === 'danger' ? t.danger : 'transparent';
  const fg = kind === 'secondary' ? t.primary : t.onPrimary;
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={title} accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled || !!loading }}
      disabled={disabled || loading} onPress={onPress}
      style={({ pressed }) => [{
        minHeight: MIN_TOUCH, borderRadius: 10, paddingHorizontal: space.lg, alignItems: 'center', justifyContent: 'center',
        backgroundColor: bg, borderWidth: kind === 'secondary' ? 1.5 : 0, borderColor: t.primary,
        opacity: disabled ? 0.5 : pressed ? 0.8 : 1, flexDirection: 'row', gap: space.sm,
      }]}>
      {loading ? <ActivityIndicator color={fg} /> : null}
      <Text style={{ color: fg, fontSize: 16, fontWeight: '600' }}>{title}</Text>
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
          minHeight: MIN_TOUCH, borderWidth: 1, borderColor: error ? t.danger : t.border, borderRadius: 10,
          paddingHorizontal: space.md, paddingVertical: space.sm, color: t.text, backgroundColor: t.card, fontSize: 16,
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
  label?: string; options: { value: T; label: string }[]; value: T | T[] | null; onChange: (v: T) => void; multi?: boolean;
}) {
  const t = useTheme();
  const isOn = (v: T) => (multi ? (value as T[]).includes(v) : value === v);
  return (
    <View style={{ gap: 4 }}>
      {label ? <Text style={{ color: t.text, fontWeight: '600' }}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {options.map((o) => (
          <Pressable key={String(o.value)} onPress={() => onChange(o.value)} accessibilityRole={multi ? 'checkbox' : 'radio'}
            accessibilityState={{ selected: isOn(o.value), checked: isOn(o.value) }} accessibilityLabel={o.label}
            style={{ minHeight: 40, paddingHorizontal: space.md, borderRadius: 20, justifyContent: 'center', backgroundColor: isOn(o.value) ? t.chipOn : t.chip }}>
            <Text style={{ color: isOn(o.value) ? t.onPrimary : t.text }}>{o.label}</Text>
          </Pressable>
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

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <Card style={{ alignItems: 'center' }}>
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
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

export function ProfileBar({ name, color, label = 'Perfil' }: { name: string; color: string; label?: string }) {
  return (
    <View accessibilityRole="summary" accessibilityLabel={`${label}: ${name}`} style={{ backgroundColor: color, paddingVertical: 6, paddingHorizontal: space.lg }}>
      <Text style={{ color: '#fff', fontWeight: '700' }}>{label}: {name}</Text>
    </View>
  );
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Ocurrió un error inesperado.';
}
