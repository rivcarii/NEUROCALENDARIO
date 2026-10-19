import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { EXT_FOR_MIME, hex, sanitizeFileName, validateAttachment } from '../domain/files';
import type { FileAdapter } from '../domain/backup';
import type { DocumentInput } from '../domain/schemas';

/** Directorio privado de la app (sandbox). Nunca se expone con enlaces públicos. */
function privateRoot(): Directory {
  const d = new Directory(Paths.document, 'attachments');
  if (!d.exists) d.create({ intermediates: true });
  return d;
}

const SAFE_PATH = /^attachments\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(pdf|jpg|png)$/;

function resolveStored(storagePath: string): File {
  if (!SAFE_PATH.test(storagePath)) throw new Error('Ruta de archivo no válida.');
  return new File(Paths.document, storagePath);
}

export interface StoredAttachment {
  fileName: string;
  mimeType: DocumentInput['mimeType'];
  sizeBytes: number;
  sha256: string;
  storagePath: string;
}

/** Valida por contenido y copia el archivo al almacenamiento privado del perfil. */
export async function storeAttachment(sourceUri: string, originalName: string, profileId: string): Promise<StoredAttachment> {
  const src = new File(sourceUri);
  const bytes = await src.bytes();
  const check = validateAttachment(bytes);
  if (!check.ok) throw new Error(check.reason);
  const dir = new Directory(privateRoot(), profileId);
  if (!dir.exists) dir.create({ intermediates: true });
  const id = Crypto.randomUUID();
  const dest = new File(dir, `${id}.${EXT_FOR_MIME[check.mime]}`);
  dest.create();
  dest.write(bytes);
  const sha256 = hex(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes));
  return {
    fileName: sanitizeFileName(originalName),
    mimeType: check.mime,
    sizeBytes: bytes.length,
    sha256,
    storagePath: `attachments/${profileId}/${id}.${EXT_FOR_MIME[check.mime]}`,
  };
}

export function attachmentUri(storagePath: string): string {
  return resolveStored(storagePath).uri;
}

export function deleteAttachment(storagePath: string): void {
  const f = resolveStored(storagePath);
  if (f.exists) f.delete();
}

export function deleteProfileFiles(profileId: string): void {
  const d = new Directory(privateRoot(), profileId);
  if (d.exists) d.delete();
}

export const expoFileAdapter: FileAdapter = {
  async readBase64(path) {
    return resolveStored(path).base64();
  },
  async writeBase64(path, b64) {
    const f = resolveStored(path);
    const parent = f.parentDirectory;
    if (!parent.exists) parent.create({ intermediates: true });
    if (!f.exists) f.create();
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    if (!validateAttachment(bytes).ok) throw new Error('Archivo adjunto de la copia no válido.');
    f.write(bytes);
  },
};
