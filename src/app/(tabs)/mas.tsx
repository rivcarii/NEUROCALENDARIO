import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { Card, P, Screen } from '../../components/ui';
import { useSession } from '../../services/session';
import { MIN_TOUCH, useTheme } from '../../theme';

const ITEMS: { title: string; hint: string; href: string; ownerOnly?: boolean }[] = [
  { title: 'Citas médicas', hint: 'Próximas citas y recordatorios', href: '/citas' },
  { title: 'Exámenes y resultados', hint: 'Estudios pedidos y sus resultados', href: '/examenes' },
  { title: 'Documentos', hint: 'PDF y fotos en almacenamiento privado', href: '/documentos' },
  { title: 'Notas', hint: 'Notas personales y del cuidador', href: '/notas' },
  { title: 'Estadísticas', hint: 'Frecuencia, duración e intensidad', href: '/estadisticas' },
  { title: 'Informes PDF', hint: 'Para llevar a la consulta', href: '/informes' },
  { title: 'Perfiles', hint: 'Cambiar o crear perfiles', href: '/perfiles' },
  { title: 'Copias de seguridad', hint: 'Exportar y restaurar (cifrado)', href: '/respaldo' },
  { title: 'Acceso familiar', hint: 'Cuentas y permisos', href: '/acceso', ownerOnly: true },
  { title: 'Privacidad y ajustes', hint: 'Bloqueo, notificaciones, eliminar datos', href: '/ajustes' },
  { title: 'Acerca de y avisos', hint: 'Qué hace y qué no hace esta app', href: '/acerca' },
];

export default function Mas() {
  const t = useTheme();
  const { account } = useSession();
  return (
    <Screen>
      {ITEMS.filter((i) => !i.ownerOnly || account?.role === 'owner').map((i) => (
        <Pressable key={i.href} accessibilityRole="button" accessibilityLabel={`${i.title}. ${i.hint}`} onPress={() => router.push(i.href)}>
          <Card style={{ minHeight: MIN_TOUCH }}>
            <Text style={{ color: t.text, fontSize: 17, fontWeight: '700' }}>{i.title}</Text>
            <P muted small>{i.hint}</P>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
