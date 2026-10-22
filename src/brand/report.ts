import { BRAND, ICONS, ISOTIPO, type IconName } from './geometry';

/** Plantilla del informe: misma marca en HTML (teléfono) y PDF (navegador). */
export const PAIN_COLORS = ['#1F7A36', '#3B8F3A', '#5DA33A', '#8DB53A', '#C9B92E', '#E0A800', '#E58A1F', '#E06C1F', '#D84F22', '#C83A25', '#B3261E'];
export const PAIN_SCALE_LABELS: [number, number, string][] = [[0, 0, 'Sin dolor'], [1, 3, 'Leve'], [4, 6, 'Moderado'], [7, 10, 'Intenso']];

/** Isotipo como SVG en texto (para el HTML del informe). */
export function isotipoSvg(size: number, variant: 'tile' | 'white' | 'color' = 'tile'): string {
  const ink = variant === 'color' ? BRAND.indigo : '#FFFFFF';
  const accent = variant === 'color' ? BRAND.teal : '#FFFFFF';
  const bg = variant === 'tile'
    ? `<defs><linearGradient id="ncg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${BRAND.violet}"/><stop offset=".55" stop-color="${BRAND.indigo}"/><stop offset="1" stop-color="${BRAND.indigoDeep}"/></linearGradient></defs><path d="${ISOTIPO.tile}" fill="url(#ncg)"/>`
    : '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">${bg}` +
    `<path d="${ISOTIPO.frame}" fill="none" stroke="${ink}" stroke-width="${ISOTIPO.stroke}" stroke-linejoin="round"/>` +
    `<path d="${ISOTIPO.tabs}" fill="none" stroke="${ink}" stroke-width="${ISOTIPO.stroke}" stroke-linecap="round"/>` +
    `<path d="${ISOTIPO.pathway}" fill="none" stroke="${accent}" stroke-width="${ISOTIPO.stroke - 1}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${ISOTIPO.dendrites}" fill="none" stroke="${accent}" stroke-width="${ISOTIPO.thin}" stroke-linecap="round"/>` +
    `<path d="${ISOTIPO.somas}${ISOTIPO.terminals}" fill="${accent}"/></svg>`;
}

export function iconSvg(name: IconName, color: string, size = 16): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]}" fill="none" stroke="${color}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
