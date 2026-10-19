import { ALLOWED_MIME, MAX_FILE_BYTES } from './schemas';

export type AllowedMime = (typeof ALLOWED_MIME)[number];

/** Detecta el tipo real por los primeros bytes (no confía en la extensión). */
export function sniffMime(b: Uint8Array): AllowedMime | null {
  if (b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return 'application/pdf';
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'image/png';
  return null;
}

export const EXT_FOR_MIME: Record<AllowedMime, string> = {
  'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png',
};

export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'archivo';
  const clean = base.replace(/[^\p{L}\p{N}._ -]/gu, '_').replace(/^\.+/, '').slice(0, 120);
  return clean || 'archivo';
}

export type FileCheck = { ok: true; mime: AllowedMime } | { ok: false; reason: string };

export function validateAttachment(bytes: Uint8Array): FileCheck {
  if (bytes.length === 0) return { ok: false, reason: 'El archivo está vacío.' };
  if (bytes.length > MAX_FILE_BYTES) return { ok: false, reason: 'El archivo supera 15 MB.' };
  const mime = sniffMime(bytes);
  if (!mime) return { ok: false, reason: 'Solo se admiten PDF, JPG o PNG.' };
  return { ok: true, mime };
}

export function hex(buf: ArrayBuffer | Uint8Array): string {
  const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(u, (x) => x.toString(16).padStart(2, '0')).join('');
}
