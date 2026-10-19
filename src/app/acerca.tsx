import { Stack } from 'expo-router';
import { View } from 'react-native';
import { Mascot } from '../components/Mascot';
import { Card, H, P, Screen } from '../components/ui';
import { DISCLAIMER } from '../domain/report';

export default function Acerca() {
  return (
    <>
      <Stack.Screen options={{ title: 'Acerca de' }} />
      <Screen>
        <View style={{ alignItems: 'center' }}><Mascot mood="hola" size={120} /></View>
        <H>NeuroCalendario</H>
        <P muted>Versión 0.1.0 (pruebas) · Nuri, su mascota, no da consejos médicos: solo le acompaña.</P>
        <Card>
          <H level={2}>Qué es</H>
          <P>Un diario y calendario personal y familiar para anotar síntomas, medicinas, citas, estudios y documentos, y preparar un resumen para su médico.</P>
        </Card>
        <Card>
          <H level={2}>Qué no es</H>
          <P>{DISCLAIMER}</P>
          <P>No es un servicio de emergencias. Ante una emergencia, llame a los servicios de urgencia de su país.</P>
        </Card>
        <Card>
          <H level={2}>Antes de usar datos reales</H>
          <P small>Esta es una versión de pruebas. Compruebe que el bloqueo de pantalla del teléfono está activo, que las copias de seguridad se pueden restaurar y que los recordatorios llegan en su dispositivo.</P>
        </Card>
      </Screen>
    </>
  );
}
