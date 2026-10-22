import { useEffect, useState } from 'react';
import { Modal, View } from 'react-native';
import { Text } from './Text';
import { Isotipo } from './Brand';
import { Button } from './ui';
import { applyUpdate, postpone, startUpdates, subscribeUpdates, updatesSupported } from '../services/updates';
import { radius, space, useTheme } from '../theme';
import { font } from '../theme/type';

/**
 * Ventana «Hay una versión nueva» (solo web instalable). Se queda hasta que la persona elige;
 * «Más tarde» vuelve a preguntar en 15 minutos o al abrir la app otra vez.
 */
export function UpdatePrompt() {
  const t = useTheme();
  const [version, setVersion] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!updatesSupported()) return;
    startUpdates();
    return subscribeUpdates(setVersion);
  }, []);

  if (!version) return null;
  const label = version === 'nueva' ? '' : ` (${version.split('+')[0]})`;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={postpone}>
      <View style={{ flex: 1, backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center', padding: space.lg }}>
        <View
          accessibilityViewIsModal accessibilityRole="alert"
          style={{ backgroundColor: t.card, borderRadius: 28, borderCurve: 'continuous', padding: space.xl, gap: space.md, maxWidth: 420, width: '100%', alignItems: 'center' }}
        >
          <Isotipo size={72} />
          <Text style={{ color: t.text, fontSize: 20, fontFamily: font.displaySemi, textAlign: 'center' }}>Hay una versión nueva de NeuroCalendario</Text>
          <Text style={{ color: t.muted, fontSize: 16, textAlign: 'center' }}>
            Actualice para tener las últimas mejoras{label}. Sus datos no se tocan y la app se reinicia en un segundo.
          </Text>
          <View style={{ alignSelf: 'stretch', gap: space.sm }}>
            <Button title="Actualizar ahora" loading={busy} onPress={() => { setBusy(true); void applyUpdate(); }} />
            <Button title="Más tarde" kind="secondary" onPress={postpone} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
