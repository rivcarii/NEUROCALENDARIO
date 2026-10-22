import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { GlassTabBar } from '../../components/GlassTabBar';
import { ProfileHeader } from '../../components/ProfileHeader';
import { useTheme } from '../../theme';

export default function TabsLayout() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Tabs
        tabBar={() => null} // la barra es una capa propia (GlassTabBar) sobre el grupo
        screenOptions={{ animation: 'none', sceneStyle: { backgroundColor: t.bg } }} // sin animación al cambiar de pestaña
      >
        <Tabs.Screen name="index" options={{ title: 'Hoy', header: () => <ProfileHeader title="Hoy" /> }} />
        <Tabs.Screen name="calendario" options={{ title: 'Calendario', header: () => <ProfileHeader title="Calendario" /> }} />
        <Tabs.Screen name="episodios" options={{ title: 'Síntomas', header: () => <ProfileHeader title="Síntomas" /> }} />
        <Tabs.Screen name="medicacion" options={{ title: 'Medicinas', header: () => <ProfileHeader title="Medicinas" /> }} />
        <Tabs.Screen name="mas" options={{ title: 'Más', header: () => <ProfileHeader title="Más" /> }} />
      </Tabs>
      <GlassTabBar />
    </View>
  );
}
