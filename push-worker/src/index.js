// Servicio de avisos de NeuroCalendario (Cloudflare Worker + D1).
// Privacidad: solo recibe la suscripción push del teléfono y las HORAS de los avisos con un identificador opaco.
// El texto (nombre de la medicina, de la cita) nunca sale del teléfono: el service worker lo busca localmente al recibir el aviso.
import { generateVapid, sendPush } from './webpush.js';

const PUSH_HOSTS = [/\.googleapis\.com$/, /(^|\.)push\.apple\.com$/, /\.mozilla\.com$/, /\.mozaws\.net$/, /\.notify\.windows\.com$/];
const MAX_DUE = 400;
const HORIZON = 9 * 24 * 3600 * 1000;

async function vapidOf(env) {
  const row = await env.DB.prepare('SELECT v FROM meta WHERE k = ?').bind('vapid').first();
  if (row) return JSON.parse(row.v);
  const v = await generateVapid();
  await env.DB.prepare('INSERT OR IGNORE INTO meta (k, v) VALUES (?, ?)').bind('vapid', JSON.stringify(v)).run();
  const again = await env.DB.prepare('SELECT v FROM meta WHERE k = ?').bind('vapid').first();
  return JSON.parse(again.v);
}

async function idOf(endpoint) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function validSub(s) {
  if (!s || typeof s.endpoint !== 'string' || !s.keys || typeof s.keys.p256dh !== 'string' || typeof s.keys.auth !== 'string') return false;
  let u;
  try { u = new URL(s.endpoint); } catch { return false; }
  return u.protocol === 'https:' && PUSH_HOSTS.some((re) => re.test(u.hostname)) && s.endpoint.length < 1000 && s.keys.p256dh.length < 200 && s.keys.auth.length < 100;
}

function cors(req, env) {
  const origin = req.headers.get('Origin') ?? '';
  const ok = env.ALLOWED_ORIGINS.split(',').map((x) => x.trim()).includes(origin);
  return { 'Access-Control-Allow-Origin': ok ? origin : 'null', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
}
const json = (data, status, headers) => new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

async function deliver(env, vapid, sub, payload) {
  const status = await sendPush({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, payload, vapid, env.VAPID_SUBJECT);
  if (status === 404 || status === 410) {
    await env.DB.batch([env.DB.prepare('DELETE FROM due WHERE sub_id = ?').bind(sub.id), env.DB.prepare('DELETE FROM subs WHERE id = ?').bind(sub.id)]);
  }
  return status;
}

export default {
  async fetch(req, env) {
    const h = cors(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    const path = new URL(req.url).pathname;
    try {
      if (req.method === 'GET' && path === '/vapid') return json({ key: (await vapidOf(env)).publicKey }, 200, h);
      if (req.method !== 'POST') return json({ error: 'no encontrado' }, 404, h);
      if (h['Access-Control-Allow-Origin'] === 'null') return json({ error: 'origen no permitido' }, 403, h);
      const body = await req.json();
      const s = body.subscription;
      if (!validSub(s)) return json({ error: 'suscripción no válida' }, 400, h);
      const id = await idOf(s.endpoint);

      if (path === '/sync') {
        const now = Date.now();
        const due = (Array.isArray(body.due) ? body.due : [])
          .filter((d) => Number.isFinite(d.at) && d.at > now - 60000 && d.at < now + HORIZON && typeof d.ref === 'string' && d.ref.length <= 120)
          .slice(0, MAX_DUE);
        const stmts = [
          env.DB.prepare('INSERT INTO subs (id, endpoint, p256dh, auth, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, updated_at = excluded.updated_at')
            .bind(id, s.endpoint, s.keys.p256dh, s.keys.auth, now),
          env.DB.prepare('DELETE FROM due WHERE sub_id = ?').bind(id),
          ...due.map((d) => env.DB.prepare('INSERT OR IGNORE INTO due (sub_id, at, ref) VALUES (?, ?, ?)').bind(id, Math.round(d.at), d.ref)),
        ];
        await env.DB.batch(stmts);
        return json({ ok: true, scheduled: due.length }, 200, h);
      }
      if (path === '/unsubscribe') {
        await env.DB.batch([env.DB.prepare('DELETE FROM due WHERE sub_id = ?').bind(id), env.DB.prepare('DELETE FROM subs WHERE id = ?').bind(id)]);
        return json({ ok: true }, 200, h);
      }
      if (path === '/test') {
        const status = await deliver(env, await vapidOf(env), { id, endpoint: s.endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth }, { ref: 'prueba', at: Date.now() });
        return json({ ok: status >= 200 && status < 300, status }, 200, h);
      }
      return json({ error: 'no encontrado' }, 404, h);
    } catch (e) {
      return json({ error: 'error interno', detail: String(e).slice(0, 200) }, 500, h);
    }
  },

  async scheduled(_event, env) {
    const now = Date.now();
    // Avisos vencidos hace menos de 30 min (si el servicio estuvo parado, no se envía una avalancha vieja).
    const { results } = await env.DB.prepare(
      'SELECT d.sub_id AS id, d.at, d.ref, s.endpoint, s.p256dh, s.auth FROM due d JOIN subs s ON s.id = d.sub_id WHERE d.at <= ? AND d.at > ? ORDER BY d.at LIMIT 200',
    ).bind(now + 20000, now - 30 * 60000).all();
    if (results.length) {
      const vapid = await vapidOf(env);
      for (const r of results) {
        try { await deliver(env, vapid, r, { ref: r.ref, at: r.at }); } catch { /* se reintenta en la siguiente sincronización */ }
        await env.DB.prepare('DELETE FROM due WHERE sub_id = ? AND at = ? AND ref = ?').bind(r.id, r.at, r.ref).run();
      }
    }
    await env.DB.prepare('DELETE FROM due WHERE at <= ?').bind(now - 30 * 60000).run();
    // Suscripciones abandonadas (sin sincronizar en 60 días).
    await env.DB.prepare('DELETE FROM subs WHERE updated_at < ?').bind(now - 60 * 24 * 3600 * 1000).run();
  },
};
