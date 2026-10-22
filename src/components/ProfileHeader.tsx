import { router } from 'expo-router';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Isotipo } from './Brand';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { MAX_CONTENT } from './ui';
import { useSession } from '../services/session';
import { space, useTheme } from '../theme';
import { font } from '../theme/type';

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '·';

/**
 * Cabecera al estilo de las apps de Apple (Salud, Recordatorios): marca discreta arriba, título grande
 * y, a la derecha, la persona cuyos datos se ven (siempre visible; tocarla permite cambiar de persona).
 */
export function ProfileHeader({ title }: { title: string }) {
  const { activeProfile, profiles } = useSession();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  if (!activeProfile) return null;
  const many = profiles.length > 1;
  return (
    <View style={{ backgroundColor: t.bg, paddingTop: insets.top + (Platform.OS === 'web' ? 18 : 4), paddingBottom: 6, paddingHorizontal: space.lg, alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: MAX_CONTENT, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.md }}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Isotipo size={18} />
            <Text style={{ color: t.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.6 }}>NEUROCALENDARIO</Text>
          </View>
          <Text accessibilityRole="header" numberOfLines={1} style={{ color: t.text, fontSize: 34, lineHeight: 40, fontFamily: font.display }}>{title}</Text>
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={many ? 'Cambiar de persona' : `Persona: ${activeProfile.displayName}`}
          accessibilityHint={many ? `Ahora ve los datos de ${activeProfile.displayName}` : 'Ver personas'}
          onPress={() => router.push('/perfiles')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingLeft: 4, paddingRight: 12, borderRadius: 999, backgroundColor: t.card, marginBottom: 4, maxWidth: 190, borderCurve: 'continuous' }}
        >
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: activeProfile.color, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>{initials(activeProfile.displayName)}</Text>
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text numberOfLines={1} style={{ color: t.text, fontWeight: '600', fontSize: 14 }}>{activeProfile.displayName}</Text>
            {many ? <Text style={{ color: t.primary, fontSize: 12, fontWeight: '600' }}>Cambiar</Text> : null}
          </View>
        </PressableScale>
      </View>
    </View>
  );
}
