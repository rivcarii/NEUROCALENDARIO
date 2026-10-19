import { PROFILE_COLORS } from '../src/domain/labels';

jest.mock('react-native', () => ({ useColorScheme: () => 'light' }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { light, dark } = require('../src/theme') as typeof import('../src/theme');

function lum(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}

describe('contraste de color (WCAG AA 4.5:1)', () => {
  it.each([['claro', light], ['oscuro', dark]] as const)('texto sobre fondos en tema %s', (_n, t) => {
    for (const k of ['text', 'muted', 'primary', 'danger', 'success', 'warn'] as const) {
      expect(ratio(t[k], t.card)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t[k], t.bg)).toBeGreaterThanOrEqual(4.5);
    }
    expect(ratio(t.onPrimary, t.primary)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t.text, t.chip)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t.onPrimary, t.chipOn)).toBeGreaterThanOrEqual(4.5);
  });
  it('texto blanco sobre cada color de perfil', () => {
    for (const c of PROFILE_COLORS) expect(ratio('#FFFFFF', c)).toBeGreaterThanOrEqual(4.5);
  });
});
