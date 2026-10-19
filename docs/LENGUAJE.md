# Lenguaje de la interfaz

La app habla como habla un paciente, no como un historial clínico. Los nombres internos (código, base de datos) no cambian: `episode`, `medication`, etc.

| Antes (técnico) | Ahora (paciente) |
|---|---|
| Episodio | Síntoma |
| Tipo de episodio | ¿Qué sintió? |
| Intensidad subjetiva (0–10) | ¿Qué tan fuerte fue? (0 = nada, 10 = lo peor) |
| Síntomas asociados | ¿Sintió también…? |
| Contexto y actividad previa | ¿Qué estaba haciendo antes? |
| Posibles desencadenantes según el usuario | ¿Qué cree que lo provocó? |
| Estado de recuperación (completa / parcial / sin recuperar) | ¿Cómo quedó después? (Quedó bien / Mejoró, pero no del todo / Sigue mal) |
| Registro rápido / Registrar episodio completo | Anotar ahora / Anotar con más detalle |
| Cefalea · vértigo · síncope… | Dolor de cabeza · mareo · desmayo… |
| Medicación · medicamento | Medicinas · medicina |
| Pauta / horarios prescritos | Horarios de la medicina |
| Prescrito por · Presentación | Recetada por · Forma |
| Tomada / Omitida | La tomé / No la tomé |
| Suspendido | Pausada |
| Recordatorio / notificación | Aviso |
| Exámenes | Estudios |
| Origen del resultado: informe médico / declarado por el usuario | De dónde es el resultado: informe del médico / lo anoto yo |
| Estadísticas · duración media/mediana | Cómo he estado · duración habitual / la mitad duró menos de |
| Informe PDF | Resumen para el médico |
| Perfil / perfil activo | Persona / es quien ve ahora |
| Copia de seguridad cifrada · restaurar | Respaldo con clave · recuperar |
| Eliminar | Borrar (con «¿Borrar este síntoma?» → «Borrar» / «Conservar») |
| Lectura / escritura / administrador | Solo puede ver / Puede ver y anotar / Administra |

**Reglas**: frases cortas, preguntas en vez de campos técnicos, «usted» cálido, sin siglas (PDF es la excepción: se conoce). El **resumen para el médico** (PDF) mezcla ambos registros a propósito: palabras del paciente con encabezados claros para el profesional («Fuerza (0–10)», «Cómo quedó»…).
