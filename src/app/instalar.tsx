import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Mascot } from '../components/Mascot';
import { Button, Card, H, P, Screen } from '../components/ui';
import { canPromptInstall, isIos, isStandalone, promptInstall, subscribeInstall } from '../services/install';

export default function Instalar() {
  const [, force] = useState(0);
  useEffect(() => subscribeInstall(() => force((n) => n + 1)), []);
  const ios = isIos();
  return (
    <>
      <Stack.Screen options={{ title: 'Instalar en este teléfono' }} />
      <Screen>
        <View style={{ alignItems: 'center' }}><Mascot mood="hola" size={96} /></View>
        {isStandalone() ? (
          <Card><P>Ya está usando NeuroCalendario como app. 🎉</P></Card>
        ) : ios ? (
          <Card>
            <H level={2}>En iPhone o iPad</H>
            <P>1. Abra esta página en <P>Safari</P> (debe ser Safari, no otro navegador).</P>
            <P>2. Toque el botón <P>Compartir</P> (el cuadrado con una flecha, abajo).</P>
            <P>3. Elija <P>«Agregar a pantalla de inicio»</P>.</P>
            <P>4. Toque <P>Agregar</P>. Se abrirá a pantalla completa y funciona sin internet.</P>
          </Card>
        ) : (
          <Card>
            <H level={2}>En Android</H>
            {canPromptInstall() ? (
              <Button title="Instalar NeuroCalendario" onPress={() => void promptInstall()} />
            ) : (
              <>
                <P>1. Abra esta página en <P>Chrome</P>.</P>
                <P>2. Toque el menú <P>⋮</P> (arriba a la derecha).</P>
                <P>3. Elija <P>«Instalar app»</P> o <P>«Agregar a la pantalla de inicio»</P>.</P>
              </>
            )}
          </Card>
        )}
        <Card>
          <H level={2}>Actualizaciones</H>
          <P>Cuando haya una versión nueva, la app se lo avisará con una ventana: toque «Actualizar ahora». Sus datos no se tocan.</P>
        </Card>
        <Card>
          <H level={2}>Lo que cambia en la versión instalada desde el navegador</H>
          <P small>• Los avisos de medicinas y citas solo suenan con la app abierta.</P>
          <P small>• No se pueden adjuntar documentos ni fotos.</P>
          <P small>• El resumen para el médico se guarda desde la ventana de impresión («Guardar como PDF»).</P>
          <P muted small>Estas funciones sí están completas en la app de Android/iPhone compilada.</P>
        </Card>
      </Screen>
    </>
  );
}
