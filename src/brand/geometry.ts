/**
 * Identidad de NeuroCalendario: geometría única (sin dependencias de React) que comparten la app,
 * los iconos de instalación, el informe HTML y el PDF. Cambiar aquí cambia la marca en todas partes.
 * Solo curvas de Bézier (sin arcos) para que también funcione en el PDF (pdf-lib).
 */

const K = 0.5523;
const n = (v: number) => Math.round(v * 100) / 100;

/** Círculo como 4 curvas cúbicas. */
export function circ(cx: number, cy: number, r: number): string {
  const k = K * r;
  return `M${n(cx - r)} ${n(cy)}C${n(cx - r)} ${n(cy - k)} ${n(cx - k)} ${n(cy - r)} ${n(cx)} ${n(cy - r)}C${n(cx + k)} ${n(cy - r)} ${n(cx + r)} ${n(cy - k)} ${n(cx + r)} ${n(cy)}` +
    `C${n(cx + r)} ${n(cy + k)} ${n(cx + k)} ${n(cy + r)} ${n(cx)} ${n(cy + r)}C${n(cx - k)} ${n(cy + r)} ${n(cx - r)} ${n(cy + k)} ${n(cx - r)} ${n(cy)}Z`;
}

/** Rectángulo de esquinas redondeadas. */
export function rr(x: number, y: number, w: number, h: number, r: number): string {
  const k = K * r;
  return `M${n(x + r)} ${n(y)}H${n(x + w - r)}C${n(x + w - r + k)} ${n(y)} ${n(x + w)} ${n(y + r - k)} ${n(x + w)} ${n(y + r)}` +
    `V${n(y + h - r)}C${n(x + w)} ${n(y + h - r + k)} ${n(x + w - r + k)} ${n(y + h)} ${n(x + w - r)} ${n(y + h)}` +
    `H${n(x + r)}C${n(x + r - k)} ${n(y + h)} ${n(x)} ${n(y + h - r + k)} ${n(x)} ${n(y + h - r)}` +
    `V${n(y + r)}C${n(x)} ${n(y + r - k)} ${n(x + r - k)} ${n(y)} ${n(x + r)} ${n(y)}Z`;
}

/** Colores de marca (no dependen del tema claro/oscuro). */
export const BRAND = {
  indigo: '#4C46D6',
  indigoDeep: '#2E2A9E',
  violet: '#7B61FF',
  teal: '#12A4B6',
  tealInk: '#0A7686',
  lavender: '#E8E7FF',
  aqua: '#D7F4F7',
  rose: '#F2709C',
  gold: '#F5B841',
  ink: '#1C1C1E',
} as const;

/**
 * Isotipo (caja 100×100): un calendario cuyo interior es una «N» trazada por dos neuronas unidas por una sinapsis.
 * - `frame` y `tabs`: el calendario (trazo).
 * - `pathway`: la N (trazo) — vía nerviosa de una neurona a otra.
 * - `dendrites`: ramas sobre cada neurona (trazo).
 * - `somas` / `terminals`: cuerpos neuronales y botones sinápticos (relleno).
 */
export const ISOTIPO = {
  tile: rr(0, 0, 100, 100, 23),
  frame: rr(16, 22, 68, 62, 15),
  tabs: 'M37 13V28M63 13V28',
  pathway: 'M35 72V46C45 52 55 66 65 72V46',
  dendrites: 'M35 46L29.5 39.5M35 46L40.5 39.5M65 46L59.5 39.5M65 46L70.5 39.5',
  somas: `${circ(35, 46, 5.4)}${circ(65, 46, 5.4)}`,
  terminals: `${circ(35, 72, 3.6)}${circ(65, 72, 3.6)}`,
  stroke: 6.4,
  thin: 3.6,
} as const;

/**
 * Iconografía propia (caja 24×24, trazo redondeado de 1,8). Misma familia en pestañas, listas, informe y PDF.
 */
export const ICONS = {
  hoy: `${circ(12, 12, 4)}M12 2.8V4.6M12 19.4V21.2M2.8 12H4.6M19.4 12H21.2M5.5 5.5L6.8 6.8M17.2 17.2L18.5 18.5M18.5 5.5L17.2 6.8M6.8 17.2L5.5 18.5`,
  calendario: `${rr(3.5, 5, 17, 15.5, 3.4)}M8 3V7M16 3V7M3.5 9.8H20.5M8.5 16.5L12 13.4L15.5 16.5`,
  sintomas: 'M2.5 12.5H6.8L8.8 7.5L12 17.5L14.6 5.8L16.6 12.5H21.5',
  medicinas: `${rr(3, 8.5, 18, 7, 3.5)}M12 8.5V15.5M6 10.8C6.8 10.4 7.6 10.3 8.5 10.4`,
  mas: `${rr(4, 4, 6.5, 6.5, 2)}${rr(13.5, 4, 6.5, 6.5, 2)}${rr(4, 13.5, 6.5, 6.5, 2)}${circ(16.75, 16.75, 3.25)}`,
  cerebro: 'M11.5 4.6C9.6 3.6 7 4.3 6.3 6.6C4.4 6.9 3.3 9 4.2 10.7C3 12.1 3.4 14.5 5.1 15.2C5 17.4 7.1 19.2 9.2 18.6C10 19.8 11 20.1 12 19.6M12.5 4.6C14.4 3.6 17 4.3 17.7 6.6C19.6 6.9 20.7 9 19.8 10.7C21 12.1 20.6 14.5 18.9 15.2C19 17.4 16.9 19.2 14.8 18.6C14 19.8 13 20.1 12 19.6M12 4.8V19.4M8 9.2C9.4 9.2 10.2 10.6 9.6 12M16 9.2C14.6 9.2 13.8 10.6 14.4 12M8.2 15.2C9.2 14.6 10.4 14.8 11 15.6M15.8 15.2C14.8 14.6 13.6 14.8 13 15.6',
  neurona: `${circ(8.5, 12, 2.8)}M6.5 10L3.8 6.8M6.4 14L3.6 17.2M5.7 12H2.6M7.6 9.4L7.2 5.6M11.3 12H17M17 12L19.8 9.2M17 12L19.8 14.8${circ(20.4, 8.6, 0.9)}${circ(20.4, 15.4, 0.9)}`,
  crisis: 'M13.2 2.6L5.8 13.4H11.4L10.4 21.4L18.2 10.2H12.6L13.2 2.6Z',
  informe: `${rr(5, 3, 14, 18, 2.6)}M8.5 7.5H15.5M8.5 17V14M12 17V11.5M15.5 17V13`,
  sueno: 'M15.6 4.4C11.4 5.6 9.2 10.4 11 14.4C12.7 18.2 17 19.6 20.6 17.8C17.2 21.4 10.4 21.2 6.8 17.2C3.2 13.2 4.2 6.6 9.2 4.4C11.2 3.5 13.6 3.5 15.6 4.4Z',
  cita: `${rr(3.5, 5, 17, 15.5, 3.4)}M8 3V7M16 3V7M3.5 9.8H20.5${circ(12, 15, 3)}M12 13.4V15L13.2 15.8`,
  estudio: `${circ(12, 12, 8.5)}${circ(12, 12, 4.6)}M12 3.5V7.4M12 16.6V20.5M3.5 12H7.4M16.6 12H20.5`,
  nota: `${rr(4.5, 3, 15, 18, 2.6)}M8 8H16M8 12H16M8 16H12.5`,
  documento: 'M3.5 7.2C3.5 6 4.4 5 5.6 5H9.6L11.6 7.2H18.4C19.6 7.2 20.5 8.2 20.5 9.4V17.4C20.5 18.6 19.6 19.6 18.4 19.6H5.6C4.4 19.6 3.5 18.6 3.5 17.4V7.2Z',
  persona: `${circ(12, 8, 3.6)}M4.8 20C5.6 16.2 8.4 14.2 12 14.2C15.6 14.2 18.4 16.2 19.2 20`,
  familia: `${circ(9, 8.5, 3)}${circ(16.6, 9.6, 2.4)}M3.5 19.5C4.1 16.2 6.3 14.4 9 14.4C11.7 14.4 13.9 16.2 14.5 19.5M15 14.6C17.6 14.4 19.8 16 20.5 19`,
  escudo: 'M12 3L19 5.8V11.2C19 15.6 16.1 19 12 20.8C7.9 19 5 15.6 5 11.2V5.8L12 3ZM9 12L11.2 14.2L15.2 10',
  respaldo: 'M19.6 12.8C19.2 16.8 15.9 20 12 20C7.6 20 4 16.4 4 12C4 7.6 7.6 4 12 4C14.6 4 16.9 5.2 18.4 7.2M18.6 3.8V7.6H14.8M12 8.4V12.4L14.6 14',
  ajustes: 'M4 7H14M18 7H20M4 17H8M12 17H20M4 12H20' + circ(16, 7, 2) + circ(10, 17, 2),
  info: `${circ(12, 12, 8.5)}M12 11V16.4M12 7.8V8`,
  instalar: 'M12 3.8V14.2M7.8 10.2L12 14.4L16.2 10.2M4.5 15.5V18C4.5 19.1 5.4 20 6.5 20H17.5C18.6 20 19.5 19.1 19.5 18V15.5',
  grafico: `${rr(3.5, 3.5, 17, 17, 3.4)}M8 16.5V12M12 16.5V8M16 16.5V13.5`,
  check: 'M5.5 12.5L10 17L18.5 7.5',
  alerta: 'M12 3.8L21 19.4H3L12 3.8ZM12 9.8V14M12 16.6V16.8',
} as const;

export type IconName = keyof typeof ICONS;
export const ICON_STROKE = 1.8;
