import { LEVEL_COLOR, LEVEL_LABEL } from './analysis';
import { buildReportDoc, type Block, type ReportInput } from './reportDoc';

export function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function barChartSvg(data: { label: string; value: number }[], title: string): string {
  if (data.length === 0) return '';
  const w = 640, h = 160, pad = 28;
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = (w - pad * 2) / data.length;
  const bars = data.map((d, i) => {
    const bh = ((h - pad * 2) * d.value) / max;
    const x = pad + i * bw + 2;
    return `<rect x="${x.toFixed(1)}" y="${(h - pad - bh).toFixed(1)}" width="${Math.max(1, bw - 4).toFixed(1)}" height="${bh.toFixed(1)}" fill="#2F5D8A"/>` +
      (d.value > 0 ? `<text x="${(x + (bw - 4) / 2).toFixed(1)}" y="${(h - pad - bh - 3).toFixed(1)}" font-size="9" text-anchor="middle">${d.value}</text>` : '') +
      (data.length <= 16 || i % Math.ceil(data.length / 12) === 0
        ? `<text x="${(x + (bw - 4) / 2).toFixed(1)}" y="${h - 10}" font-size="8" text-anchor="middle" fill="#555">${esc(d.label)}</text>` : '');
  }).join('');
  return `<figure><figcaption>${esc(title)}</figcaption><svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="${esc(title)}">` +
    `<line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="#999"/>${bars}</svg></figure>`;
}

const TONE = { bien: ['#2E7D4F', 'Bien'], info: ['#2F5D8A', 'Información'], atencion: ['#B7791F', 'Atención'], importante: ['#C0392B', 'Importante'] } as const;

function block(x: Block): string {
  switch (x.t) {
    case 'h1': return `<h1>${esc(x.text)}</h1>`;
    case 'h2': return `<h2>${esc(x.text)}</h2>`;
    case 'h3': return `<h3>${esc(x.text)}</h3>`;
    case 'p': return x.style === 'warn' ? `<div class="warn">${esc(x.text)}</div>` : `<p class="${x.style ?? ''}">${esc(x.text)}</p>`;
    case 'kv': return `<p>${x.rows.map(([k, v]) => `<b>${esc(k)}:</b> ${esc(v)}`).join('<br>')}</p>`;
    case 'list': return `<ul>${x.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
    case 'table':
      return x.rows.length === 0 ? `<p class="muted">${esc(x.empty ?? 'Sin registros en el período.')}</p>` :
        `<table><thead><tr>${x.headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>` +
        x.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('') + '</tbody></table>';
    case 'bars': return barChartSvg(x.data, x.title);
    case 'strip':
      return `<figure><figcaption>${esc(x.title)}</figcaption><div class="strip">${x.cells.map((c) =>
        `<span style="background:${LEVEL_COLOR[c.level]};color:${c.level === 'amarillo' ? '#222' : '#fff'}" title="${esc(LEVEL_LABEL[c.level])}">${esc(c.label)}</span>`).join('')}</div></figure>`;
    case 'gauge':
      return `<div class="gauge"><b>${esc(x.label)}</b>${x.value === null ? ' · sin datos' : ` · ${x.value}/100`}` +
        `<div class="track"><div class="fill" style="width:${x.value ?? 0}%;background:${LEVEL_COLOR[x.level]}"></div></div></div>`;
    case 'finding': {
      const [color, label] = TONE[x.finding.tone];
      return `<div class="finding" style="border-left:5px solid ${color}"><b style="color:${color}">${label}</b> · <b>${esc(x.finding.title)}</b><br>${esc(x.finding.text)}<br><span class="muted">Base: ${esc(x.finding.basis)}</span></div>`;
    }
  }
}

/** HTML autocontenido (sin recursos externos) para convertir a PDF. */
export function buildReportHtml(r: ReportInput): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Resumen NeuroCalendario</title>
<style>
  body{font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:11px;color:#1b1b1b;margin:24px}
  h1{font-size:20px;margin:0 0 4px} h2{font-size:15px;border-bottom:2px solid #2F5D8A;padding-bottom:3px;margin-top:22px}
  h3{font-size:12px;margin:12px 0 4px} table{width:100%;border-collapse:collapse;margin:6px 0;page-break-inside:auto}
  tr{page-break-inside:avoid} th,td{border:1px solid #bbb;padding:4px 6px;text-align:left;vertical-align:top}
  th{background:#eef3f8} .muted{color:#666} .warn{border:1px solid #c0392b;background:#fdf1ef;padding:8px;margin:12px 0;font-weight:600}
  figure{margin:8px 0} figcaption{font-size:10px;color:#444}
  .strip{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px} .strip span{width:22px;height:22px;border-radius:5px;font-size:9px;display:flex;align-items:center;justify-content:center}
  .gauge{margin:8px 0} .track{height:12px;background:#e6ecf2;border-radius:6px;margin-top:4px;overflow:hidden} .fill{height:100%}
  .finding{background:#f7f9fb;padding:6px 8px;margin:6px 0;page-break-inside:avoid}
</style></head><body>
${buildReportDoc(r).map(block).join('\n')}
</body></html>`;
}
