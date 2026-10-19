import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { ProfileHeader } from '../../components/ProfileHeader';
import { useTheme } from '../../theme';

function Glyph({ glyph, color }: { glyph: string; color: unknown }) {
  return <Text style={{ color: color as string, fontSize: 20 }} accessibilityElementsHidden>{glyph}</Text>;
}
const icon = (glyph: string) => {
  const render = ({ color }: { color: unknown }) => <Glyph glyph={glyph} color={color} />;
  return render;
};

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: t.primary, tabBarStyle: { backgroundColor: t.card, minHeight: 60 },
      tabBarLabelStyle: { fontSize: 12 },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Hoy', tabBarIcon: icon('●'), header: () => <ProfileHeader title="Resumen de hoy" /> }} />
      <Tabs.Screen name="calendario" options={{ title: 'Calendario', tabBarIcon: icon('▦'), header: () => <ProfileHeader title="Calendario" /> }} />
      <Tabs.Screen name="episodios" options={{ title: 'Episodios', tabBarIcon: icon('≋'), header: () => <ProfileHeader title="Historial de episodios" /> }} />
      <Tabs.Screen name="medicacion" options={{ title: 'Medicación', tabBarIcon: icon('✚'), header: () => <ProfileHeader title="Medicación" /> }} />
      <Tabs.Screen name="mas" options={{ title: 'Más', tabBarIcon: icon('☰'), header: () => <ProfileHeader title="Más opciones" /> }} />
    </Tabs>
  );
}
