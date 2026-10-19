import { router } from 'expo-router';
import { Text } from '../../components/Text';
import { PressableScale } from '../../components/PressableScale';
import { P, Screen } from '../../components/ui';
import { useSession } from '../../services/session';
import { MIN_TOUCH, radius, space, useTheme } from '../../theme';

const ITEMS: { title: string; hint: string; href: string; ownerOnly?: boolean }[] = [
  { title: 'Mis citas', hint: 'Próximas citas y recordatorios', href: '/citas' },
  { title: 'Estudios y resultados', hint: 'Estudios pedidos y sus resultados', href: '/examenes' },
  { title: 'Documentos', hint: 'PDF y fotos en almacenamiento privado', href: '/documentos' },
  { title: 'Notas', hint: 'Notas personales y del cuidador', href: '/notas' },
  { title: 'Cómo he estado', hint: 'Cuántas veces, cuánto duran y qué tan fuertes', href: '/estadisticas' },
  { title: 'Resumen para el médico', hint: 'Para llevar a su cita', href: '/informes' },
  { title: 'Personas', hint: 'Cambiar de persona o añadir otra', href: '/perfiles' },
  { title: 'Respaldo de sus datos', hint: 'Guardar y recuperar sus datos (con clave)', href: '/respaldo' },
  { title: 'Acceso familiar', hint: 'Cuentas y permisos', href: '/acceso', ownerOnly: true },
  { title: 'Privacidad y ajustes', hint: 'Bloqueo, avisos y borrar datos', href: '/ajustes' },
  { title: 'Acerca de y avisos', hint: 'Qué hace y qué no hace esta app', href: '/acerca' },
];

export default function Mas() {
  const t = useTheme();
  const { account } = useSession();
  return (
    <Screen>
      {ITEMS.filter((i) => !i.ownerOnly || account?.role === 'owner').map((i) => (
        <PressableScale key={i.href} accessibilityRole="button" accessibilityLabel={`${i.title}. ${i.hint}`} onPress={() => router.push(i.href)}
          style={{ minHeight: MIN_TOUCH, backgroundColor: t.card, borderRadius: radius.lg, borderWidth: 1, borderColor: t.border, padding: space.lg, gap: space.sm }}>
          <Text style={{ color: t.text, fontSize: 17, fontWeight: '700' }}>{i.title}</Text>
          <P muted small>{i.hint}</P>
        </PressableScale>
      ))}
    </Screen>
  );
}
