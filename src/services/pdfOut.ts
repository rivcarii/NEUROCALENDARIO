/** Entrega de un archivo creado en el navegador: compartir (móvil, incluida la app instalada en iPhone) o descargar. Solo web. */
export interface WebPdf { url: string; name: string; bytes: Uint8Array; mime: string }
export type WebFile = WebPdf;

export function makeWebFile(data: Uint8Array | string, name: string, mime: string): WebFile {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const blob = new Blob([bytes as BlobPart], { type: mime });
  return { url: URL.createObjectURL(blob), name, bytes, mime };
}

export function makeWebPdf(bytes: Uint8Array, name: string): WebPdf {
  return makeWebFile(bytes, name, 'application/pdf');
}

export async function shareWebFile(p: WebFile, title: string): Promise<'compartido' | 'cancelado' | 'no_disponible'> {
  const file = new File([p.bytes as BlobPart], p.name, { type: p.mime });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (!nav.canShare?.({ files: [file] })) return 'no_disponible';
  try { await nav.share({ files: [file], title }); return 'compartido'; } catch (e) {
    return e instanceof Error && e.name === 'AbortError' ? 'cancelado' : 'no_disponible';
  }
}
export const shareWebPdf = shareWebFile;

export function downloadWebFile(p: WebFile): void {
  const a = document.createElement('a');
  a.href = p.url; a.download = p.name; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
}
export const downloadWebPdf = downloadWebFile;

export function openWebPdf(p: WebPdf): void {
  window.open(p.url, '_blank', 'noopener');
}
