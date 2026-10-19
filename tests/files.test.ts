import { hex, sanitizeFileName, sniffMime, validateAttachment } from '../src/domain/files';

const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
describe('validación de adjuntos', () => {
  it('detecta tipos reales por contenido', () => {
    expect(sniffMime(pdf)).toBe('application/pdf');
    expect(sniffMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(sniffMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png');
  });
  it('rechaza ejecutables, vacíos y demasiado grandes aunque se llamen .pdf', () => {
    expect(validateAttachment(new Uint8Array([0x4d, 0x5a, 0x90, 0x00]))).toMatchObject({ ok: false }); // MZ
    expect(validateAttachment(new Uint8Array([]))).toMatchObject({ ok: false });
    expect(validateAttachment(new Uint8Array(16 * 1024 * 1024).fill(0x25))).toMatchObject({ ok: false });
    expect(validateAttachment(pdf)).toEqual({ ok: true, mime: 'application/pdf' });
  });
  it('sanea nombres con rutas', () => {
    expect(sanitizeFileName('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFileName('C:\\x\\informe médico.pdf')).toBe('informe médico.pdf');
    expect(sanitizeFileName('..hidden<>.pdf')).toBe('hidden__.pdf');
    expect(hex(new Uint8Array([1, 255]))).toBe('01ff');
  });
});
