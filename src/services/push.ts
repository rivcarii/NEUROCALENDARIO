/**
 * Avisos en el teléfono con la app CERRADA (versión web instalable): Web Push con el servicio propio de
 * NeuroCalendario (Cloudflare Worker, carpeta push-worker/).
 *
 * Privacidad: al servicio solo se envían la suscripción push del navegador y las HORAS de los avisos con un
 * identificador opaco. El texto («Es hora de: …») se guarda en este dispositivo (Cache Storage) y el service
 * worker lo pone al recibir el aviso; si está desactivado «mostrar detalles», el texto es genérico.
 */
import { Platform } from 'react-native';
import type { Store } from '../db/store';
import { notificationContent } from '../domain/reminders';
import { collectPlanned } from './planner';

export const PUSH_URL = (process.env.EXPO_PUBLIC_PUSH_URL ?? '').replace(/\/$/, '');
const BASE = process.env.EXPO_PUBLIC_BASE_URL ?? '';
/** Caché local con los textos de los avisos (nombre distinto de las cachés «nc-…» de versión, que se borran al actualizar). */
export const TEXTS_CACHE = 'ncpush-textos';
const TEXTS_KEY = `${BASE}/__push-texts.json`;
const MAX = 300;
const HORIZON_MS = 8 * 24 * 3600 * 1000;

export type PushState =
  | 'no_web' // app nativa: usa avisos locales
  | 'sin_servidor' // esta publicación no tiene servicio configurado
  | 'no_soportado' // el navegador no admite avisos
  | 'instalar_ios' // iPhone/iPad: primero hay que agregar la app a la pantalla de inicio
  | 'denegado' // la persona bloqueó los avisos
  | 'apagado'
  | 'activo';

const isIos = () => typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
const standalone = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

export async function pushState(): Promise<PushState> {
  if (Platform.OS !== 'web') return 'no_web';
  if (!PUSH_URL) return 'sin_servidor';
  if (isIos() && !standalone()) return 'instalar_ios';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') return 'no_soportado';
  if (Notification.permission === 'denied') return 'denegado';
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === 'granted' ? 'activo' : 'apagado';
}

function keyBytes(b64: string): Uint8Array {
  const s = b64.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64.length + 3) % 4);
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function post(path: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(`${PUSH_URL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(typeof data.error === 'string' ? `Servicio de avisos: ${data.error}` : `Servicio de avisos no disponible (${res.status}).`);
  return data;
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/** Pide permiso (debe llamarse desde un toque) y suscribe este dispositivo. */
export async function enablePush(store: Store, showDetails: boolean): Promise<number> {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('No se dio permiso para mostrar avisos. Puede activarlo en Ajustes del teléfono → Notificaciones → NeuroCalendario.');
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const res = await fetch(`${PUSH_URL}/vapid`);
    if (!res.ok) throw new Error('El servicio de avisos no respondió. Inténtelo más tarde.');
    const { key } = (await res.json()) as { key: string };
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) as BufferSource });
  }
  return syncPush(store, showDetails, sub);
}

/** Envía al servicio las horas de los próximos avisos y guarda los textos en este dispositivo. */
export async function syncPush(store: Store, showDetails: boolean, given?: PushSubscription | null): Promise<number> {
  if (Platform.OS !== 'web' || !PUSH_URL) return 0;
  const sub = given ?? (await currentSubscription());
  if (!sub || Notification.permission !== 'granted') return 0;
  const now = new Date();
  const planned = (await collectPlanned(store, now)).filter((p) => Date.parse(p.r.fireAt) - now.getTime() < HORIZON_MS).slice(0, MAX);
  const texts: Record<string, { title: string; body: string }> = {};
  const due = planned.map((p, i) => {
    const ref = `${p.r.kind === 'cita' ? 'c' : 'm'}${i}-${Date.parse(p.r.fireAt).toString(36)}`;
    texts[ref] = notificationContent(p.r, showDetails, p.label);
    return { at: Date.parse(p.r.fireAt), ref };
  });
  const cache = await caches.open(TEXTS_CACHE);
  await cache.put(TEXTS_KEY, new Response(JSON.stringify(texts), { headers: { 'Content-Type': 'application/json' } }));
  const json = sub.toJSON();
  const r = await post('/sync', { subscription: { endpoint: json.endpoint, keys: json.keys }, due });
  return typeof r.scheduled === 'number' ? r.scheduled : due.length;
}

export async function testPush(): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) throw new Error('Este teléfono no tiene los avisos activados.');
  const json = sub.toJSON();
  const r = await post('/test', { subscription: { endpoint: json.endpoint, keys: json.keys } });
  if (!r.ok) throw new Error(`El servicio de avisos no pudo entregar la prueba (código ${String(r.status)}).`);
}

export async function disablePush(): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) return;
  const json = sub.toJSON();
  await post('/unsubscribe', { subscription: { endpoint: json.endpoint, keys: json.keys } }).catch(() => undefined);
  await sub.unsubscribe();
  await caches.delete(TEXTS_CACHE);
}
