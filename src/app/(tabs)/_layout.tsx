import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProfileHeader } from '../../components/ProfileHeader';
import { useTheme } from '../../theme';
import { font } from '../../theme/type';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
// Sin animación entre pestañas: son pares, no una jerarquía, y se usan decenas de veces al día.
const icon = (on: IconName, off: IconName) => {
  const render = ({ color, focused }: { color: unknown; focused: boolean }) => (
    <Ionicons name={focused ? on : off} size={24} color={color as string} accessibilityElementsHidden importantForAccessibility="no" />
  );
  return render;
};

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: t.primary, tabBarStyle: { backgroundColor: t.card, minHeight: 60 },
      tabBarLabelStyle: { fontSize: 12, fontFamily: font.body }, animation: 'none',
    }}>
      <Tabs.Screen name="index" options={{ title: 'Hoy', tabBarIcon: icon('today', 'today-outline'), header: () => <ProfileHeader title="Mi día" /> }} />
      <Tabs.Screen name="calendario" options={{ title: 'Calendario', tabBarIcon: icon('calendar', 'calendar-outline'), header: () => <ProfileHeader title="Calendario" /> }} />
      <Tabs.Screen name="episodios" options={{ title: 'Síntomas', tabBarIcon: icon('pulse', 'pulse-outline'), header: () => <ProfileHeader title="Mis síntomas" /> }} />
      <Tabs.Screen name="medicacion" options={{ title: 'Medicinas', tabBarIcon: icon('medkit', 'medkit-outline'), header: () => <ProfileHeader title="Mis medicinas" /> }} />
      <Tabs.Screen name="mas" options={{ title: 'Más', tabBarIcon: icon('menu', 'menu-outline'), header: () => <ProfileHeader title="Más" /> }} />
    </Tabs>
  );
}
