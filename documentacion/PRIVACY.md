# Privacidad

## Resumen
- Los datos de salud se guardan **solo en el dispositivo**. La app no tiene servidor, analítica, publicidad ni inteligencia artificial.
- El código propio de la app no envía datos por red (comprobado por prueba automática sobre `src/`). La única petición es, en la versión web instalable, descargar `version.json` del propio sitio (un GET sin datos) para avisar de versiones nuevas. No se solicita token de notificaciones push ni se usa ningún servicio remoto.
- Los datos salen del teléfono únicamente cuando **usted** comparte un informe PDF, un documento o una copia de seguridad.

## Datos tratados
Episodios y síntomas, medicación y tomas, citas, exámenes, documentos, notas, nombre y año de nacimiento opcional de cada perfil. Son **datos de salud (categoría especial)**.

## Responsabilidad y consentimiento
El propietario administra la app, pero **la propiedad técnica no sustituye la autorización de la persona** cuyos datos se registran. Registre datos de otra persona solo con su conocimiento y consentimiento, y permita que consulte, corrija o elimine su perfil. Si la sincronización se habilita en el futuro, la persona debe poder acceder y revocar por sí misma.

## Notificaciones
Por defecto muestran solo «Tiene un recordatorio pendiente/de cita». El usuario puede activar detalles en **Ajustes**; en ese caso el nombre del medicamento o la cita aparecerá en la pantalla bloqueada.

## Control de datos
- **Exportar**: copia cifrada por perfil (Más → Copias de seguridad) e informe PDF.
- **Eliminar un perfil**: borra todos sus datos y archivos (confirmación escribiendo el nombre).
- **Eliminar todo**: Ajustes → escribir ELIMINAR.
- **Desinstalar la app** borra todos los datos locales.
- Registros técnicos mínimos: el *log* de auditoría guarda quién y cuándo, **sin contenido clínico**.

## Esta app no es
Un dispositivo médico, un servicio de diagnóstico ni de emergencias. Los informes y estadísticas son descriptivos.

## Avisos web (opcional)
Si se activan los avisos en la versión web, el servicio de avisos de NeuroCalendario (Cloudflare) recibe solo la dirección push del navegador y las horas de los recordatorios con identificadores opacos. Ningún dato de salud ni nombre sale del teléfono. Detalles en `AVISOS.md`.
