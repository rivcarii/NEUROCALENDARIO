import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../services/session';
import { space } from '../theme';

/** Cabecera permanente: siempre muestra de QUIÉN son los datos que se ven. */
export function ProfileHeader({ title }: { title: string }) {
  const { activeProfile, profiles } = useSession();
  const insets = useSafeAreaInsets();
  if (!activeProfile) return null;
  return (
    <View style={{ backgroundColor: activeProfile.color, paddingTop: insets.top + 6, paddingBottom: 10, paddingHorizontal: space.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#ffffffcc', fontSize: 12 }}>{title}</Text>
        <Text accessibilityRole="header" style={{ color: '#fff', fontSize: 20, fontWeight: '700' }} numberOfLines={1}>
          {activeProfile.displayName}
        </Text>
      </View>
      {profiles.length > 1 ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Cambiar de perfil" onPress={() => router.push('/perfiles')}
          style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: space.md, borderRadius: 8, backgroundColor: '#ffffff33' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Cambiar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
