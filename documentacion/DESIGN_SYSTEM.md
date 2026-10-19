# Sistema de diseño

Resultado de aplicar los skills de diseño (crítica y sistema) y de animación para Expo.

## Tokens (`src/theme`)
| Categoría | Valores | Archivo |
|---|---|---|
| Color | claro/oscuro; texto, apagado, primario, peligro, éxito, aviso, chip, `onHeader*` | `index.ts` |
| Espaciado | 4 · 8 · 12 · 16 · 24 | `space` |
| Radio | 8 · 10 · 12 · 20 (píldora) | `radius` |
| Tipografía | **Fraunces** (títulos, nombre del perfil) + **Atkinson Hyperlegible** (lectura y formularios); escala 13/16/17/20/28 | `type.ts` |
| Movimiento | pulsar 120 ms, estado 160 ms, escala 0,97, ease-out `cubic-bezier(0.23, 1, 0.32, 1)` | `motion.ts` |
| Táctil | mínimo 48 (objetivos ≥44) | `MIN_TOUCH` |

- **Por qué estas fuentes**: Fraunces da carácter y calidez a los títulos; Atkinson Hyperlegible fue diseñada para baja visión y distingue caracteres ambiguos (0/O, 1/l) — importante en horas, dosis y fechas. Efecto visible: el cero lleva una barra («08:00»). Si no cargan, la app usa la tipografía del sistema.
- En React Native el peso se elige con la familia: `components/Text.tsx` traduce `fontWeight` a la familia correcta; no use `fontWeight` con `fontFamily` propia.
- La auditoría de colores fijos encontró `#fff`/`#B3261E`/`rgba` dispersos en cabeceras y onboarding; ahora son tokens (`onHeader`, `danger`…). Contraste AA verificado por prueba (`tests/contrast.test.ts`).

## Componentes (`src/components`)
| Componente | Variantes / estados | Notas |
|---|---|---|
| `Button` | primary · secondary · danger; deshabilitado, cargando | Escala 0,97 al pulsar (`PressableScale`). |
| `Chips` | simple/múltiple; seleccionado | Transición de color 120 ms; `a11y` para etiquetas largas («6 de 10»). |
| `TextField`, `DateTimeField` | error, pista | Etiqueta siempre visible; error con rol de alerta. |
| `Card`, `H`, `P`, `Row`, `Screen` | — | `H` nivel 1 = Fraunces 700, nivel 2 = Fraunces 600. |
| `ProfileHeader` / `ProfileBar` | color por perfil | Siempre indica de quién son los datos. |
| `TapText`, `PressableScale` | — | Área táctil ≥44 px; rol de botón. |
| `BarChart` | — | Descripción textual completa para lectores de pantalla. |

## Movimiento: decisiones (skill de animación)
| Elemento | ¿Se anima? | Propósito | Herramienta |
|---|---|---|---|
| Cambio de pestaña | **No** (`animation: 'none'`) | — (son pares; decenas de veces al día) | — |
| Pulsar botón/chip/tarjeta/día | Sí, 120 ms, escala 0,97 | feedback | Transición CSS de Reanimated (hilo de UI) |
| Chip seleccionado, día elegido | Sí, color 120 ms | indicación de estado | idem |
| Pantallas (push/volver) | Plataforma por defecto | continuidad espacial | Native stack |
| Listas, historial, toma marcada | **No** | muy frecuentes | — |
| Háptica | Éxito al marcar toma; ligera en omitida y registro rápido | confirmación | `expo-haptics`, nunca como único aviso |
| «Reducir movimiento» del sistema | Sin escala ni transición | accesibilidad | `useReduceMotion` |

**Pendiente de comprobar en teléfono** (no se puede juzgar desde código ni navegador): sensación de la escala al pulsar en un Android de gama baja, sincronía de la háptica y que las transiciones de Reanimated funcionen en compilación de producción (Reanimated 4 requiere la nueva arquitectura, ya activada).

## Apariencia por plataforma (iOS · Android · web instalable)
| Aspecto | iOS | Android (Material 3) | Web instalada |
|---|---|---|---|
| Tarjetas | sombra suave + filo fino | elevación 1 (sin borde en claro) | como iOS |
| Botones | radio 12 | píldora (24) | como iOS |
| Campos | radio 10 | radio 8 | como iOS |
| Texto base | 17 (Dynamic Type) | 16 | 17 |
| Barra de pestañas | filo fino, etiquetas 11 | elevación 8, sin borde, etiquetas 12 | filo |
| Cabecera de pantallas | botón «atrás» sin texto, sin sombra | flecha estándar con sombra | — |
| Teclado | el contenido se desplaza solo (`automaticallyAdjustKeyboardInsets`), se cierra arrastrando | se cierra al desplazar | `interactive-widget=resizes-content` |
| Barra de estado / zona segura | `StatusBar` auto + márgenes seguros | edge-to-edge + márgenes seguros | `viewport-fit=cover`, `theme-color` claro/oscuro |

Común: tamaño de letra del sistema respetado hasta ×1,6; contenido de ancho máximo 640 (tabletas y escritorio no estiran la interfaz); objetivos táctiles ≥44/48.

**Web móvil** (`scripts/build-pwa.mjs`, hoja `nc-mobile`): sin destello gris al tocar, `100dvh`, `overscroll-behavior: none`, sin selección de texto en controles, campos a 16 px (evita el zoom de iOS), `touch-action: manipulation`, fondo según el modo (sin parpadeo blanco), foco visible.

**Rendimiento**: historial paginado de 40 en 40; solo se empaqueta la fuente de iconos usada (web de 10,4 MB a 6,2 MB).

**Pendiente de comprobar en teléfono real**: sombras/elevación, tamaño de letra y barra de pestañas en iOS y Android nativos; zonas seguras y teclado en Safari/Chrome reales. Solo se verificó en Chromium emulando teléfonos (la plataforma «web» no ejecuta las ramas iOS/Android del código).

## Estilo «cristal» (iOS 26+ / Liquid Glass) y corrección de la web instalada
A partir de una captura en iPhone se corrigió: etiquetas cortadas en la barra de pestañas, franja vacía bajo la barra (la raíz ahora es `position: fixed; inset: 0`, no `100dvh`) y contenido cortado antes de la barra.
- **Barra de pestañas flotante en cápsula de cristal** (`components/GlassTabBar.tsx`, `Glass.tsx`): iOS = desenfoque nativo del sistema; web = `backdrop-filter` con borde superior de «luz»; Android = barra Material sólida. El contenido pasa por debajo (`Screen tabs` deja el margen). Con «reducir transparencia» el cristal pasa a sólido.
- Formas concéntricas: tarjetas de radio 26 (iOS/web), botones y chips en cápsula, cabecera con esquinas inferiores continuas y título grande con tracking negativo.
- Pestañas sin animación al cambiar; solo el relleno de la activa cambia de color (120 ms).
- **Sobre «iOS 27»**: no dispongo de la guía oficial de iOS 27; el diseño sigue el lenguaje «Liquid Glass» (iOS 26) y los principios de Apple (materiales, concentricidad, jerarquía). Cuando exista la guía de iOS 27 conviene revisarlo.
- **Sin verificar en dispositivo**: el cálculo real de las zonas seguras del iPhone (isla dinámica e indicador de inicio) y el aspecto del desenfoque; solo se probó en Chromium emulando un iPhone, sin zonas seguras.
