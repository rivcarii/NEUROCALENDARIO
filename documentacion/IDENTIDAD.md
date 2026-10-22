# Identidad visual de NeuroCalendario

Una sola fuente de verdad: **`src/brand/geometry.ts`**. La app, los iconos de instalación, el informe HTML y el PDF dibujan la marca con esa geometría; si cambia ahí, cambia en todas partes. Usar esta guía también en proyectos hermanos para mantener la misma identidad.

## Isologo
- **Isotipo**: un calendario (marco con dos anillas) cuyo interior es una **«N» trazada por dos neuronas** — cuerpos neuronales arriba con sus dendritas, la vía nerviosa en diagonal y botones sinápticos abajo. Une las dos ideas del producto: calendario + neurología.
- **Logotipo**: «**Neuro**Calendario» en la fuente del sistema; «Neuro» en peso 800 e índigo, «Calendario» en peso 500.
- **Versiones**: azulejo (degradado violeta → índigo → índigo profundo, trazo blanco), color (índigo + turquesa, sin fondo), blanco (sobre la portada del informe) y monocromo (icono temático de Android).
- **Área de respeto**: al menos 25 % del tamaño del isotipo alrededor. Tamaño mínimo: 16 px.
- Archivos: `assets/brand/isotipo.svg`, `assets/brand/isotipo-color.svg`; iconos de app en `assets/` y `public/`.

## Color
| Token | Valor | Uso |
| --- | --- | --- |
| Índigo de marca | `#4C46D6` | Acciones principales, títulos del informe, iconos activos |
| Violeta / índigo profundo | `#7B61FF` / `#2E2A9E` | Degradado del isotipo y la portada |
| Turquesa | `#12A4B6` (texto `#0A7686`) | Acento neuronal (sinapsis, ilustraciones) |
| Lavanda / agua | `#E8E7FF` / `#D7F4F7` | Fondos de ilustración y separadores del informe |
| Fondos | claro `#F2F2F7` + tarjetas `#FFFFFF`; oscuro `#000000` + `#1C1C1E` | Igual que las listas agrupadas de iOS |
| Semáforo | verde `#2E7D4F` · amarillo `#E0A800` · rojo `#C0392B` · gris `#B8C2CC` | Solo para estado del día; siempre con palabra, nunca solo color |

Todos los textos cumplen WCAG AA (4,5:1); lo comprueba `tests/contrast.test.ts`.

## Tipografía
Fuente del sistema (SF Pro en Apple). Título grande 34/700, títulos 30 y 22, cuerpo 17, nota 13. Interletraje negativo en títulos.

## Iconografía
Set propio en `ICONS` (caja 24 × 24, trazo redondeado 1,8; 2,3 cuando está activo): hoy, calendario, síntomas (trazado tipo EEG), medicinas, más, cerebro, neurona, crisis, informe, sueño, cita, estudio, nota, documento, persona, familia, escudo, respaldo, ajustes, info, instalar, gráfico, alerta. En listas van en blanco sobre un azulejo de color (como Ajustes de iOS).

## Ilustraciones (`NeuroArt`)
Escenas de neurociencia con la paleta de marca, decorativas (ocultas a lectores de pantalla):
- **Cerebro** (vista lateral, cisuras central y lateral, cerebelo, tronco y red neuronal) — bienvenida.
- **Neurona** (soma, núcleo, dendritas, axón mielinizado, botones terminales) — estados vacíos.
- **Ondas** (registro tipo EEG con un complejo punta-onda) — acerca de.
- **Sinapsis** (vesículas, neurotransmisores, receptores) — «todo al día».
No hay mascota: el tono es sobrio y clínico, cálido por el color, no por un personaje.

## Calendario neurológico
Basado en diarios de cefalea y calendarios de crisis: cuadrícula mensual con el **semáforo** del día y una **clave por tipo de evento** (crisis, dolor de cabeza, medicina para el síntoma, cita, estudio), más un **resumen del mes** (días con cefalea, días con crisis, días con medicina para el síntoma, días con dolor intenso, días seguidos sin crisis y días con registros).

## Informe (plantilla)
Portada con el isotipo en blanco sobre el degradado de marca, nombre, período y autor; aviso médico; títulos de sección con icono en azulejo índigo; indicadores en tarjetas; escala de dolor 0–10 en color; semáforo por día; hallazgos con borde de color según importancia y su base; pie con el isotipo y número de página. Misma plantilla en el HTML (teléfono) y en el PDF directo (navegador).

## Movimiento
Sobrio y con propósito (frecuencia → propósito → duración): pulsar escala 0,97 (120 ms); píldora del control segmentado e indicador de la barra se deslizan (transform, 220 ms, ease-out `cubic-bezier(0.23, 1, 0.32, 1)`); entradas escalonadas una vez por sesión; ilustraciones aparecen con opacidad + 8 px. Las pestañas no se deslizan. «Reducir movimiento» elimina desplazamientos.
