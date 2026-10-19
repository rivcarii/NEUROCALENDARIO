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
