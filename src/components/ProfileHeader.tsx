import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Text } from './Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../services/session';
import { space, useTheme } from '../theme';
import { MAX_CONTENT } from './ui';
import { font } from '../theme/type';

/** Cabecera permanente: siempre muestra de QUIÉN son los datos que se ven. */
export function ProfileHeader({ title }: { title: string }) {
  const { activeProfile, profiles } = useSession();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  if (!activeProfile) return null;
  return (
    <View style={{ backgroundColor: activeProfile.color, paddingTop: insets.top + 6, paddingBottom: 10, paddingHorizontal: space.lg, alignItems: 'center' }}>
     <View style={{ width: '100%', maxWidth: MAX_CONTENT, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.onHeaderSoft, fontSize: 12 }}>{title}</Text>
        <Text accessibilityRole="header" style={{ color: t.onHeader, fontSize: 22, fontFamily: font.display }} numberOfLines={1}>
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
