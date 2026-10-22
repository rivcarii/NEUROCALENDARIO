import { LineCapStyle, PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { BRAND, ICONS, ISOTIPO, type IconName } from '../brand/geometry';
import { PAIN_COLORS, PAIN_SCALE_LABELS } from '../brand/report';
import { LEVEL_COLOR, LEVEL_LABEL } from './analysis';
import type { Block } from './reportDoc';

/**
 * Dibuja el informe como PDF real (A4) sin motor de impresión: sirve en el navegador y en la app instalada,
 * donde la ventana de impresión no existe o no deja guardar. Solo fuentes estándar (Helvetica, codificación WinAnsi).
 */
const W = 595.28, H = 841.89, M = 40;
const hex = (h: string) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255] as const;

const REPLACE: Record<string, string> = { '≥': '>=', '≤': '<=', '→': '->', '✔': 'v', '●': '*', '—': '-', '–': '-', '′': "'", ' ': ' ' };

export async function buildReportPdf(doc: Block[], opts: { title: string }): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(opts.title);
  pdf.setCreator('NeuroCalendario');
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ok = new Set(reg.getCharacterSet());
  const clean = (s: string) => [...String(s ?? '')].map((c) => REPLACE[c] ?? (c === '\n' || ok.has(c.codePointAt(0)!) ? c : '?')).join('');
  const col = (h: string) => { const [r, g, b] = hex(h); return rgb(r, g, b); };

  /** Isotipo vectorial (misma geometría que la app). `x`,`y` = esquina superior izquierda. */
  const isotipo = (pg: PDFPage, x: number, y: number, size: number, mode: 'tile' | 'white' | 'color') => {
    const sc = size / 100;
    const ink = mode === 'color' ? col(BRAND.indigo) : col('#FFFFFF');
    const acc = mode === 'color' ? col(BRAND.teal) : col('#FFFFFF');
    if (mode === 'tile') pg.drawSvgPath(ISOTIPO.tile, { x, y, scale: sc, color: col(BRAND.indigo) });
    pg.drawSvgPath(ISOTIPO.frame, { x, y, scale: sc, borderColor: ink, borderWidth: ISOTIPO.stroke });
    pg.drawSvgPath(ISOTIPO.tabs, { x, y, scale: sc, borderColor: ink, borderWidth: ISOTIPO.stroke, borderLineCap: LineCapStyle.Round });
    pg.drawSvgPath(ISOTIPO.pathway, { x, y, scale: sc, borderColor: acc, borderWidth: ISOTIPO.stroke - 1, borderLineCap: LineCapStyle.Round });
    pg.drawSvgPath(ISOTIPO.dendrites, { x, y, scale: sc, borderColor: acc, borderWidth: ISOTIPO.thin, borderLineCap: LineCapStyle.Round });
    pg.drawSvgPath(ISOTIPO.somas + ISOTIPO.terminals, { x, y, scale: sc, color: acc });
  };
  const icon = (pg: PDFPage, name: IconName, x: number, y: number, size: number, color: string) =>
    pg.drawSvgPath(ICONS[name], { x, y, scale: size / 24, borderColor: col(color), borderWidth: 2.1, borderLineCap: LineCapStyle.Round });

  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;
  const newPage = () => { page = pdf.addPage([W, H]); y = H - M; };
  const need = (h: number) => { if (y - h < M + 14) newPage(); };

  function wrap(text: string, f: PDFFont, size: number, width: number): string[] {
    const lines: string[] = [];
    for (const para of clean(text).split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        // palabra más larga que la línea: se parte
        let w = word;
        while (f.widthOfTextAtSize(w, size) > width) {
          let n = w.length;
          while (n > 1 && f.widthOfTextAtSize(w.slice(0, n), size) > width) n--;
          if (line) { lines.push(line); line = ''; }
          lines.push(w.slice(0, n)); w = w.slice(n);
        }
        const test = line ? `${line} ${w}` : w;
        if (f.widthOfTextAtSize(test, size) <= width) line = test; else { if (line) lines.push(line); line = w; }
      }
      lines.push(line);
    }
    return lines;
  }
  function text(t: string, o: { size?: number; font?: PDFFont; color?: string; x?: number; width?: number; gap?: number } = {}) {
    const size = o.size ?? 10, f = o.font ?? reg, x = o.x ?? M, width = o.width ?? W - 2 * M;
    for (const ln of wrap(t, f, size, width)) {
      need(size + 3);
      y -= size + 2;
      page.drawText(ln, { x, y, size, font: f, color: col(o.color ?? '#1B1B1B') });
    }
    y -= o.gap ?? 4;
  }

  for (const b of doc) {
    switch (b.t) {
      case 'cover': {
        const h = 148;
        page.drawRectangle({ x: M, y: y - h, width: W - 2 * M, height: h, color: col(BRAND.indigo) });
        // franja de profundidad (degradado aproximado con dos capas)
        page.drawRectangle({ x: M + (W - 2 * M) * 0.62, y: y - h, width: (W - 2 * M) * 0.38, height: h, color: col(BRAND.indigoDeep), opacity: 0.45 });
        page.drawCircle({ x: W - M - 46, y: y - 46, size: 42, color: col(BRAND.violet), opacity: 0.35 });
        isotipo(page, M + 16, y - 16, 40, 'white');
        const wx = M + 64;
        page.drawText('Neuro', { x: wx, y: y - 36, size: 16, font: bold, color: col('#FFFFFF') });
        page.drawText('Calendario', { x: wx + bold.widthOfTextAtSize('Neuro', 16), y: y - 36, size: 16, font: reg, color: col('#FFFFFF') });
        page.drawText(clean(b.subtitle), { x: wx, y: y - 50, size: 8.5, font: reg, color: col('#E8E7FF') });
        page.drawText(clean(b.title), { x: M + 16, y: y - 86, size: 19, font: bold, color: col('#FFFFFF') });
        let mx = M + 16;
        for (const [k, v] of b.rows) {
          const vw = Math.max(bold.widthOfTextAtSize(clean(v), 10), reg.widthOfTextAtSize(clean(k.toUpperCase()), 7.5));
          page.drawText(clean(k.toUpperCase()), { x: mx, y: y - 112, size: 7.5, font: reg, color: col('#D9D8FF') });
          page.drawText(clean(v), { x: mx, y: y - 126, size: 10, font: bold, color: col('#FFFFFF') });
          mx += vw + 22;
        }
        y -= h + 12; break;
      }
      case 'h1': text(b.text, { size: 20, font: bold, color: BRAND.ink, gap: 6 }); break;
      case 'h2': {
        need(44); y -= 12;
        const ix = b.icon ? M + 28 : M;
        if (b.icon) {
          page.drawRectangle({ x: M, y: y - 20, width: 20, height: 20, color: col(BRAND.indigo) });
          icon(page, b.icon, M + 3, y - 3, 14, '#FFFFFF');
        }
        page.drawText(clean(b.text), { x: ix, y: y - 15, size: 14, font: bold, color: col(BRAND.indigo) });
        y -= 26;
        page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1.2, color: col(BRAND.lavender) }); y -= 8; break;
      }
      case 'kpis': {
        const n = b.items.length, gap = 8, w = (W - 2 * M - gap * (n - 1)) / n, h = 52;
        need(h + 8);
        b.items.forEach((k, i) => {
          const x = M + i * (w + gap);
          page.drawRectangle({ x, y: y - h, width: w, height: h, color: col('#F2F2F7') });
          page.drawText(clean(k.value), { x: x + 8, y: y - 22, size: 16, font: bold, color: col(BRAND.indigo) });
          wrap(k.label + (k.hint ? ` ${k.hint}` : ''), reg, 7.5, w - 14).slice(0, 2).forEach((ln, j) => page.drawText(ln, { x: x + 8, y: y - 34 - j * 9, size: 7.5, font: reg, color: col('#3A3A3C') }));
        });
        y -= h + 10; break;
      }
      case 'painScale': {
        const w = (W - 2 * M) / 11;
        need(40);
        PAIN_COLORS.forEach((c, i) => {
          page.drawRectangle({ x: M + i * w, y: y - 18, width: w, height: 18, color: col(c) });
          const lb = String(i);
          page.drawText(lb, { x: M + i * w + w / 2 - bold.widthOfTextAtSize(lb, 9) / 2, y: y - 13, size: 9, font: bold, color: col('#FFFFFF') });
        });
        for (const [a, z, l] of PAIN_SCALE_LABELS) {
          const lb = clean(`${l} (${a === z ? a : `${a}-${z}`})`);
          const cx = M + ((a + z + 1) / 2) * w;
          page.drawText(lb, { x: cx - reg.widthOfTextAtSize(lb, 7.5) / 2, y: y - 29, size: 7.5, font: reg, color: col('#3A3A3C') });
        }
        y -= 40; break;
      }
      case 'h3': need(70); y -= 4; text(b.text, { size: 11, font: bold, gap: 3 }); break;
      case 'kv': for (const [k, v] of b.rows) text(`${k}: ${v}`, { size: 10.5, gap: 1 }); y -= 4; break;
      case 'p': {
        if (b.style === 'warn') {
          const lines = wrap(b.text, bold, 9.5, W - 2 * M - 16);
          const h = lines.length * 12.5 + 12;
          need(h); page.drawRectangle({ x: M, y: y - h, width: W - 2 * M, height: h, color: col('#FFF2F2'), borderColor: col('#F5C2C2'), borderWidth: 1 });
          let yy = y - 6;
          for (const ln of lines) { yy -= 11.5; page.drawText(ln, { x: M + 8, y: yy, size: 9.5, font: bold, color: col('#1B1B1B') }); yy -= 1; }
          y -= h + 8;
        } else text(b.text, { size: b.style === 'muted' ? 8.5 : 10, color: b.style === 'muted' ? '#666666' : '#1B1B1B' });
        break;
      }
      case 'list': for (const i of b.items) text(`-  ${i}`, { size: 10, x: M + 6, width: W - 2 * M - 6, gap: 2 }); y -= 4; break;
      case 'gauge': {
        text(b.value === null ? `${b.label} - sin datos` : `${b.label}  (${b.value}/100)`, { size: 11, font: bold, gap: 3 });
        need(16); const bw = W - 2 * M;
        page.drawRectangle({ x: M, y: y - 10, width: bw, height: 10, color: col('#E6ECF2') });
        if (b.value) page.drawRectangle({ x: M, y: y - 10, width: (bw * b.value) / 100, height: 10, color: col(LEVEL_COLOR[b.level]) });
        y -= 20; break;
      }
      case 'strip': {
        need(70);
        text(b.title, { size: 8.5, color: '#444444', gap: 3 });
        const cell = 17, gap = 3, per = Math.floor((W - 2 * M + gap) / (cell + gap));
        for (let i = 0; i < b.cells.length; i += per) {
          need(cell + 4);
          b.cells.slice(i, i + per).forEach((c, j) => {
            const x = M + j * (cell + gap);
            page.drawRectangle({ x, y: y - cell, width: cell, height: cell, color: col(LEVEL_COLOR[c.level]) });
            const lbl = clean(c.label);
            page.drawText(lbl, { x: x + cell / 2 - reg.widthOfTextAtSize(lbl, 7) / 2, y: y - cell + 5.5, size: 7, font: reg, color: col(c.level === 'amarillo' || c.level === 'sin_datos' ? '#222222' : '#FFFFFF') });
          });
          y -= cell + 3;
        }
        // leyenda
        need(14); let lx = M;
        for (const lv of ['verde', 'amarillo', 'rojo', 'sin_datos'] as const) {
          page.drawRectangle({ x: lx, y: y - 9, width: 9, height: 9, color: col(LEVEL_COLOR[lv]) });
          const lab = LEVEL_LABEL[lv]; page.drawText(lab, { x: lx + 13, y: y - 8, size: 8, font: reg, color: col('#444444') });
          lx += 13 + reg.widthOfTextAtSize(lab, 8) + 14;
        }
        y -= 16; break;
      }
      case 'bars': {
        if (!b.data.length) break;
        need(70 + 40);
        text(b.title, { size: 8.5, color: '#444444', gap: 3 });
        const bh = 70, bw = W - 2 * M, n = b.data.length, slot = bw / n, max = Math.max(1, ...b.data.map((d) => d.value));
        need(bh + 22);
        b.data.forEach((d, i) => {
          const h = (bh - 20) * (d.value / max);
          const x = M + i * slot + 2;
          page.drawRectangle({ x, y: y - bh + 10, width: Math.max(1, slot - 4), height: h, color: col(BRAND.indigo) });
          if (d.value > 0) { const v = String(d.value); page.drawText(v, { x: x + (slot - 4) / 2 - reg.widthOfTextAtSize(v, 7) / 2, y: y - bh + 12 + h, size: 7, font: reg }); }
          if (n <= 16 || i % Math.ceil(n / 12) === 0) { const lb = clean(d.label); page.drawText(lb, { x: x + (slot - 4) / 2 - reg.widthOfTextAtSize(lb, 7) / 2, y: y - bh + 1, size: 7, font: reg, color: col('#555555') }); }
        });
        y -= bh + 8; break;
      }
      case 'finding': {
        const f = b.finding;
        const color = { bien: '#1F7A36', info: BRAND.indigo, atencion: '#A04800', importante: '#D70015' }[f.tone];
        const label = { bien: 'Bien', info: 'Información', atencion: 'Atención', importante: 'Importante' }[f.tone];
        const w = W - 2 * M - 14;
        const lines = [...wrap(`${label.toUpperCase()}  ${f.title}`, bold, 10, w), ...wrap(f.text, reg, 9.5, w), ...wrap(`Base: ${f.basis}`, reg, 8, w)];
        const h = lines.length * 12 + 8;
        need(Math.min(h, 120));
        page.drawRectangle({ x: M, y: y - h, width: 4, height: h, color: col(color) });
        page.drawRectangle({ x: M + 4, y: y - h, width: W - 2 * M - 4, height: h, color: col('#F7F7FB') });
        let yy = y - 4;
        const t1 = wrap(`${label.toUpperCase()}  ${f.title}`, bold, 10, w), t2 = wrap(f.text, reg, 9.5, w), t3 = wrap(`Base: ${f.basis}`, reg, 8, w);
        for (const ln of t1) { yy -= 11; page.drawText(ln, { x: M + 10, y: yy, size: 10, font: bold, color: col(color) }); yy -= 1; }
        for (const ln of t2) { yy -= 11; page.drawText(ln, { x: M + 10, y: yy, size: 9.5, font: reg }); yy -= 1; }
        for (const ln of t3) { yy -= 10.5; page.drawText(ln, { x: M + 10, y: yy, size: 8, font: reg, color: col('#666666') }); yy -= 1.5; }
        y -= h + 6; break;
      }
      case 'table': {
        if (!b.rows.length) { text(b.empty ?? 'Sin registros en el período.', { size: 9, color: '#666666' }); break; }
        const inner = W - 2 * M, n = b.headers.length;
        const weight = b.headers.map((h, c) => Math.min(40, Math.max(6, h.length, ...b.rows.slice(0, 40).map((r) => Math.min(40, (r[c] ?? '').length)))));
        const sum = weight.reduce((a, z) => a + z, 0);
        const minW = b.headers.map((h) => Math.max(30, ...h.split(' ').map((w) => bold.widthOfTextAtSize(clean(w), n > 5 ? 8 : 9) + 12)));
        const widths = weight.map((wt, i) => Math.max(minW[i]!, (wt / sum) * inner));
        const k = inner / widths.reduce((a, z) => a + z, 0);
        const cw = widths.map((x) => x * k);
        const size = n > 5 ? 8 : 9;
        const row = (cells: string[], f: PDFFont, fill?: string) => {
          const wrapped = cells.map((c, i) => wrap(c || '', f, size, cw[i]! - 8));
          const h = Math.max(...wrapped.map((l) => l.length)) * (size + 2.5) + 6;
          need(Math.min(h, 140));
          let x = M;
          wrapped.forEach((lines, i) => {
            page.drawRectangle({ x, y: y - h, width: cw[i]!, height: h, color: fill ? col(fill) : undefined, borderColor: col('#E3E3E8'), borderWidth: 0.6 });
            lines.forEach((ln, li) => page.drawText(ln, { x: x + 4, y: y - 4 - size - li * (size + 2.5) + 1.5, size, font: f, color: col('#1B1B1B') }));
            x += cw[i]!;
          });
          y -= h;
        };
        row(b.headers, bold, '#F2F2F7');
        for (const r of b.rows) row(r.map((c) => c ?? ''), reg);
        y -= 8; break;
      }
    }
  }
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 30 }, end: { x: W - M, y: 30 }, thickness: 0.6, color: col('#E3E3E8') });
    isotipo(p, M, 25, 11, 'tile');
    p.drawText('NeuroCalendario', { x: M + 15, y: 16.5, size: 7.5, font: bold, color: col(BRAND.indigo) });
    p.drawText(clean(' · informe creado con los datos anotados por el paciente o su cuidador'), { x: M + 15 + bold.widthOfTextAtSize('NeuroCalendario', 7.5), y: 16.5, size: 7.5, font: reg, color: col('#6C6C70') });
    const pg = `${i + 1} / ${pages.length}`;
    p.drawText(pg, { x: W - M - reg.widthOfTextAtSize(pg, 7.5), y: 16.5, size: 7.5, font: reg, color: col('#6C6C70') });
  });
  return pdf.save();
}
