import { BRAND } from '../brand/geometry';
import { iconSvg, isotipoSvg, PAIN_COLORS, PAIN_SCALE_LABELS } from '../brand/report';
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
    return `<rect x="${x.toFixed(1)}" y="${(h - pad - bh).toFixed(1)}" width="${Math.max(1, bw - 4).toFixed(1)}" height="${bh.toFixed(1)}" rx="4" fill="${BRAND.indigo}"/>` +
      (d.value > 0 ? `<text x="${(x + (bw - 4) / 2).toFixed(1)}" y="${(h - pad - bh - 3).toFixed(1)}" font-size="9" text-anchor="middle">${d.value}</text>` : '') +
      (data.length <= 16 || i % Math.ceil(data.length / 12) === 0
        ? `<text x="${(x + (bw - 4) / 2).toFixed(1)}" y="${h - 10}" font-size="8" text-anchor="middle" fill="#6C6C70">${esc(d.label)}</text>` : '');
  }).join('');
  return `<figure><figcaption>${esc(title)}</figcaption><svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="${esc(title)}">` +
    `<line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="#D1D1D6"/>${bars}</svg></figure>`;
}

const TONE = { bien: ['#1F7A36', 'Bien'], info: [BRAND.indigo, 'Información'], atencion: ['#A04800', 'Atención'], importante: ['#D70015', 'Importante'] } as const;

function block(x: Block): string {
  switch (x.t) {
    case 'cover':
      return `<header class="cover"><div class="brand">${isotipoSvg(46, 'white')}<div><div class="wm"><b>Neuro</b>Calendario</div><div class="sub">${esc(x.subtitle)}</div></div></div>` +
        `<h1>${esc(x.title)}</h1><div class="meta">${x.rows.map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div></header>`;
    case 'h1': return `<h1>${esc(x.text)}</h1>`;
    case 'h2': return `<h2>${x.icon ? `<span class="ico">${iconSvg(x.icon, '#FFFFFF', 15)}</span>` : ''}${esc(x.text)}</h2>`;
    case 'h3': return `<h3>${esc(x.text)}</h3>`;
    case 'p': return x.style === 'warn' ? `<div class="warn">${esc(x.text)}</div>` : `<p class="${x.style ?? ''}">${esc(x.text)}</p>`;
    case 'kv': return `<p>${x.rows.map(([k, v]) => `<b>${esc(k)}:</b> ${esc(v)}`).join('<br>')}</p>`;
    case 'list': return `<ul>${x.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
    case 'kpis': return `<div class="kpis">${x.items.map((k) => `<div class="kpi"><b>${esc(k.value)}</b><span>${esc(k.label)}${k.hint ? ` <i>${esc(k.hint)}</i>` : ''}</span></div>`).join('')}</div>`;
    case 'painScale':
      return `<div class="pain">${PAIN_COLORS.map((c, i) => `<div style="background:${c}">${i}</div>`).join('')}</div>` +
        `<div class="painlbl">${PAIN_SCALE_LABELS.map(([a, z, l]) => `<span style="flex:${z - a + 1}">${esc(l)} (${a === z ? a : `${a}–${z}`})</span>`).join('')}</div>`;
    case 'table':
      return x.rows.length === 0 ? `<p class="muted">${esc(x.empty ?? 'Sin registros en el período.')}</p>` :
        `<table><thead><tr>${x.headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>` +
        x.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('') + '</tbody></table>';
    case 'bars': return barChartSvg(x.data, x.title);
    case 'strip':
      return `<figure><figcaption>${esc(x.title)}</figcaption><div class="strip">${x.cells.map((c) =>
        `<span style="background:${LEVEL_COLOR[c.level]};color:${c.level === 'amarillo' || c.level === 'sin_datos' ? '#1C1C1E' : '#fff'}" title="${esc(LEVEL_LABEL[c.level])}">${esc(c.label)}</span>`).join('')}</div></figure>`;
    case 'gauge':
      return `<div class="gauge"><b>${esc(x.label)}</b>${x.value === null ? ' · sin datos' : ` · ${x.value}/100`}` +
        `<div class="track"><div class="fill" style="width:${x.value ?? 0}%;background:${LEVEL_COLOR[x.level]}"></div></div></div>`;
    case 'finding': {
      const [color, label] = TONE[x.finding.tone];
      return `<div class="finding" style="border-left-color:${color}"><b style="color:${color}">${label.toUpperCase()}</b> <b>${esc(x.finding.title)}</b><br>${esc(x.finding.text)}<br><span class="muted">Base: ${esc(x.finding.basis)}</span></div>`;
    }
    default: return '';
  }
}

/** HTML autocontenido (sin recursos externos) con la plantilla de marca, para convertir a PDF. */
export function buildReportHtml(r: ReportInput): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Resumen NeuroCalendario</title>
<style>
  @page{margin:16mm 14mm 18mm}
  body{font-family:-apple-system,"SF Pro Text",Helvetica,Arial,sans-serif;font-size:11px;color:#1C1C1E;margin:0}
  .cover{background:linear-gradient(135deg,${BRAND.violet},${BRAND.indigo} 55%,${BRAND.indigoDeep});color:#fff;border-radius:18px;padding:18px 20px;margin-bottom:12px}
  .cover .brand{display:flex;align-items:center;gap:10px}.cover .wm{font-size:17px;letter-spacing:-.2px}.cover .wm b{font-weight:800}
  .cover .sub{font-size:10px;opacity:.85}.cover h1{font-size:22px;margin:14px 0 10px;letter-spacing:-.3px}
  .cover .meta{display:flex;gap:18px;flex-wrap:wrap}.cover .meta span{display:block;font-size:9px;opacity:.8;text-transform:uppercase;letter-spacing:.5px}.cover .meta b{font-size:12px}
  h1{font-size:20px} h2{display:flex;align-items:center;gap:8px;font-size:15px;color:${BRAND.indigo};margin:22px 0 8px;padding-bottom:5px;border-bottom:1.5px solid ${BRAND.lavender}}
  h2 .ico{display:inline-flex;width:24px;height:24px;border-radius:7px;background:${BRAND.indigo};align-items:center;justify-content:center}
  h3{font-size:12px;margin:12px 0 4px} table{width:100%;border-collapse:collapse;margin:6px 0;page-break-inside:auto}
  tr{page-break-inside:avoid} th,td{border-bottom:1px solid #E3E3E8;padding:5px 6px;text-align:left;vertical-align:top}
  th{background:#F2F2F7;color:#3A3A3C;font-weight:600} .muted{color:#6C6C70}
  .warn{border-radius:12px;background:#FFF2F2;color:#5C0B0B;padding:9px 11px;margin:10px 0;font-weight:600;border:1px solid #F5C2C2}
  figure{margin:8px 0} figcaption{font-size:10px;color:#3A3A3C;margin-bottom:3px}
  .strip{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px} .strip span{width:22px;height:22px;border-radius:6px;font-size:9px;display:flex;align-items:center;justify-content:center}
  .gauge{margin:8px 0} .track{height:12px;background:#E5E5EA;border-radius:6px;margin-top:4px;overflow:hidden} .fill{height:100%;border-radius:6px}
  .kpis{display:flex;gap:8px;margin:10px 0}.kpi{flex:1;background:#F2F2F7;border-radius:12px;padding:8px 10px}.kpi b{display:block;font-size:18px;color:${BRAND.indigo}}.kpi span{font-size:9.5px;color:#3A3A3C}.kpi i{color:#6C6C70;font-style:normal}
  .pain{display:flex;border-radius:8px;overflow:hidden;margin-top:4px}.pain div{flex:1;color:#fff;text-align:center;font-weight:700;padding:5px 0;font-size:10px}
  .painlbl{display:flex;font-size:9px;color:#3A3A3C;margin:3px 0 8px}.painlbl span{text-align:center}
  .finding{background:#F7F7FB;border-left:5px solid;border-radius:0 10px 10px 0;padding:7px 10px;margin:6px 0;page-break-inside:avoid}
  footer{margin-top:24px;display:flex;align-items:center;gap:6px;color:#6C6C70;font-size:9px;border-top:1px solid #E3E3E8;padding-top:8px}
</style></head><body>
${buildReportDoc(r).map(block).join('\n')}
<footer>${isotipoSvg(14, 'tile')}<span><b>NeuroCalendario</b> · informe creado con los datos anotados por el paciente o su cuidador.</span></footer>
</body></html>`;
}
