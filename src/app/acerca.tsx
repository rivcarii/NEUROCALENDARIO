import { Stack } from 'expo-router';
import { Card, H, P, Screen } from '../components/ui';
import { DISCLAIMER } from '../domain/report';

export default function Acerca() {
  return (
    <>
      <Stack.Screen options={{ title: 'Acerca de' }} />
      <Screen>
        <H>NeuroCalendario</H>
        <P muted>Versión 0.1.0 (pruebas)</P>
        <Card>
          <H level={2}>Qué es</H>
          <P>Un diario y calendario personal y familiar para registrar episodios neurológicos, medicación, citas, exámenes y documentos, y preparar informes para la consulta.</P>
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
