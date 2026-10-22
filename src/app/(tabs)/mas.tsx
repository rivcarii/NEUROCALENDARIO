import { router } from 'expo-router';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { NeuroIcon } from '../../components/Brand';
import { PressableScale } from '../../components/PressableScale';
import { Reveal } from '../../components/Reveal';
import { Text } from '../../components/Text';
import { Screen } from '../../components/ui';
import type { IconName } from '../../brand/geometry';
import { isStandalone, isWeb } from '../../services/install';
import { useSession } from '../../services/session';
import { useTheme } from '../../theme';

type Item = { title: string; hint: string; href: string; icon: IconName; color: string; ownerOnly?: boolean; webOnly?: boolean };

/** Listas agrupadas como en Ajustes de iOS; cada fila lleva un icono propio sobre un azulejo de color. */
const GROUPS: { title: string; items: Item[] }[] = [
  { title: 'Seguimiento', items: [
    { title: 'Análisis semanal y mensual', hint: 'Semáforo, escala de dolor y qué comentar al médico', href: '/analisis', icon: 'grafico', color: '#4C46D6' },
    { title: 'Cómo he estado', hint: 'Cuántas veces, cuánto duran y qué tan fuertes', href: '/estadisticas', icon: 'sintomas', color: '#8A4FC9' },
    { title: 'Resumen para el médico', hint: 'Informe PDF para llevar a su cita', href: '/informes', icon: 'informe', color: '#0A7686' },
  ] },
  { title: 'Atención médica', items: [
    { title: 'Mis citas', hint: 'Próximas citas y recordatorios', href: '/citas', icon: 'cita', color: '#D70015' },
    { title: 'Estudios y resultados', hint: 'Resonancias, análisis, electroencefalogramas…', href: '/examenes', icon: 'estudio', color: '#1F7A36' },
    { title: 'Documentos', hint: 'PDF y fotos en almacenamiento privado', href: '/documentos', icon: 'documento', color: '#A04800' },
    { title: 'Notas', hint: 'Notas personales y del cuidador', href: '/notas', icon: 'nota', color: '#636366' },
  ] },
  { title: 'Personas y datos', items: [
    { title: 'Personas', hint: 'Cambiar de persona o añadir otra', href: '/perfiles', icon: 'persona', color: '#4C46D6' },
    { title: 'Acceso familiar', hint: 'Cuentas y permisos', href: '/acceso', icon: 'familia', color: '#8A4FC9', ownerOnly: true },
    { title: 'Respaldo de sus datos', hint: 'Guardar y recuperar sus datos (con clave)', href: '/respaldo', icon: 'respaldo', color: '#0A7686' },
    { title: 'Privacidad y ajustes', hint: 'Bloqueo, avisos y borrar datos', href: '/ajustes', icon: 'escudo', color: '#636366' },
  ] },
  { title: 'NeuroCalendario', items: [
    { title: 'Instalar en este teléfono', hint: 'Cómo tener la app en su pantalla de inicio', href: '/instalar', icon: 'instalar', color: '#4C46D6', webOnly: true },
    { title: 'Acerca de y avisos', hint: 'Qué hace y qué no hace esta app', href: '/acerca', icon: 'info', color: '#636366' },
  ] },
];

export default function Mas() {
  const t = useTheme();
  const { account } = useSession();
  const visible = (i: Item) => (!i.ownerOnly || account?.role === 'owner') && (!i.webOnly || (isWeb && !isStandalone()));
  return (
    <Screen tabs>
      {GROUPS.map((g, gi) => {
        const items = g.items.filter(visible);
        if (!items.length) return null;
        return (
          <Reveal key={g.title} id="mas" index={gi}>
            <View style={{ gap: 6 }}>
              <Text style={{ color: t.muted, fontSize: 13, fontWeight: '600', letterSpacing: 0.4, marginLeft: 16 }}>{g.title.toUpperCase()}</Text>
              <View style={{ backgroundColor: t.card, borderRadius: 18, overflow: 'hidden', borderCurve: 'continuous' }}>
                {items.map((i, n) => (
                  <Fragment key={i.href}>
                    {n > 0 ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.separator, marginLeft: 62 }} /> : null}
                    <PressableScale accessibilityRole="button" accessibilityLabel={`${i.title}. ${i.hint}`} onPress={() => router.push(i.href as never)}
                      style={{ minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: t.card }}>
                      <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: i.color, alignItems: 'center', justifyContent: 'center', borderCurve: 'continuous' }}>
                        <NeuroIcon name={i.icon} size={21} color="#FFFFFF" active />
                      </View>
                      <View style={{ flex: 1, gap: 1 }}>
                        <Text style={{ color: t.text, fontSize: 17 }}>{i.title}</Text>
                        <Text style={{ color: t.muted, fontSize: 13 }}>{i.hint}</Text>
                      </View>
                      <Text style={{ color: t.muted, fontSize: 22, marginTop: -2 }}>›</Text>
                    </PressableScale>
                  </Fragment>
                ))}
              </View>
            </View>
          </Reveal>
        );
      })}
    </Screen>
  );
}
