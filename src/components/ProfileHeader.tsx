import { router } from 'expo-router';
import { Platform, Pressable, View } from 'react-native';
import { Text } from './Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../services/session';
import { LinearGradient } from 'expo-linear-gradient';
import { shade, space, useTheme } from '../theme';
import { MAX_CONTENT } from './ui';
import { font } from '../theme/type';

/** Cabecera permanente: siempre muestra de QUIÉN son los datos que se ven. */
export function ProfileHeader({ title }: { title: string }) {
  const { activeProfile, profiles } = useSession();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  if (!activeProfile) return null;
  return (
    <View style={{ overflow: 'hidden', backgroundColor: activeProfile.color, paddingTop: insets.top + (Platform.OS === 'web' ? 26 : 6), paddingBottom: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, borderCurve: 'continuous', paddingHorizontal: space.lg, alignItems: 'center' }}>
     <LinearGradient pointerEvents="none" colors={[activeProfile.color, shade(activeProfile.color, 0.3)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
     {/* círculos translúcidos: profundidad sin imágenes */}
     <View pointerEvents="none" style={{ position: 'absolute', width: 210, height: 210, borderRadius: 105, right: -60, top: -90, backgroundColor: '#FFFFFF', opacity: 0.1 }} />
     <View pointerEvents="none" style={{ position: 'absolute', width: 120, height: 120, borderRadius: 60, right: 70, bottom: -70, backgroundColor: '#FFFFFF', opacity: 0.07 }} />
     <View style={{ width: '100%', maxWidth: MAX_CONTENT, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.onHeaderSoft, fontSize: 13, letterSpacing: 0.3 }}>{title}</Text>
        <Text accessibilityRole="header" style={{ color: t.onHeader, fontSize: 28, lineHeight: 32, letterSpacing: -0.4, fontFamily: font.display }} numberOfLines={1}>
          {activeProfile.displayName}
        </Text>
      </View>
      {profiles.length > 1 ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Cambiar de persona" onPress={() => router.push('/perfiles')}
          style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: space.md, borderRadius: 8, backgroundColor: t.headerButton }}>
          <Text style={{ color: t.onHeader, fontWeight: '700' }}>Cambiar</Text>
        </Pressable>
      ) : null}
     </View>
    </View>
  );
}
