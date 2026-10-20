/** Entrega de un PDF ya creado en el navegador: compartir (móvil) o descargar. Solo web. */
export interface WebPdf { url: string; name: string; bytes: Uint8Array }

export function makeWebPdf(bytes: Uint8Array, name: string): WebPdf {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  return { url: URL.createObjectURL(blob), name, bytes };
}

export async function shareWebPdf(p: WebPdf, title: string): Promise<'compartido' | 'cancelado' | 'no_disponible'> {
  const file = new File([p.bytes as BlobPart], p.name, { type: 'application/pdf' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (!nav.canShare?.({ files: [file] })) return 'no_disponible';
  try { await nav.share({ files: [file], title }); return 'compartido'; } catch (e) {
    return e instanceof Error && e.name === 'AbortError' ? 'cancelado' : 'no_disponible';
  }
}

export function downloadWebPdf(p: WebPdf): void {
  const a = document.createElement('a');
  a.href = p.url; a.download = p.name; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
}

export function openWebPdf(p: WebPdf): void {
  window.open(p.url, '_blank', 'noopener');
}
