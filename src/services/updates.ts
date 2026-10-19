/**
 * Actualizaciones de la versión web instalable (PWA), con el mismo flujo que Dulza:
 * service worker + version.json. Cuando hay una versión nueva se avisa con una ventana
 * («Actualizar ahora» / «Más tarde»); los datos no se tocan. En Android/iPhone nativos no hace nada.
 */
import { Platform } from 'react-native';

export const APP_BUILD = process.env.EXPO_PUBLIC_APP_BUILD ?? 'dev';
const BASE = process.env.EXPO_PUBLIC_BASE_URL ?? '';
const SNOOZE_MS = 15 * 60 * 1000;
const CHECK_MS = 10 * 60 * 1000;

type Listener = (remote: string | null) => void;
const listeners = new Set<Listener>();
let started = false;
let waiting: ServiceWorker | null = null;
let remoteLabel: string | null = null;
let snoozeUntil = 0;
let reg: ServiceWorkerRegistration | null = null;

export const updatesSupported = (): boolean =>
  Platform.OS === 'web' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator && APP_BUILD !== 'dev';

/** Avisa a la interfaz de que hay (o ya no hay) una versión nueva. */
function emit(): void {
  const show = remoteLabel !== null && Date.now() >= snoozeUntil;
  listeners.forEach((l) => l(show ? remoteLabel : null));
}

export function subscribeUpdates(l: Listener): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

async function remoteVersion(): Promise<string | null> {
  try {
    const r = await fetch(`${BASE}/version.json?t=${Date.now()}`, { cache: 'no-store' });
    return r.ok ? ((await r.json()) as { version?: string }).version ?? null : null;
  } catch {
    return null;
  }
}

/** Busca una versión nueva. `manual` ignora el «más tarde». Devuelve si hay una. */
export async function checkForUpdate(manual = false): Promise<boolean> {
  if (!updatesSupported()) return false;
  reg?.update().catch(() => undefined);
  if (manual) snoozeUntil = 0;
  if (reg?.waiting && navigator.serviceWorker.controller) {
    waiting = reg.waiting;
    remoteLabel = remoteLabel ?? 'nueva';
    emit();
    return true;
  }
  const v = await remoteVersion();
  if (v && v !== APP_BUILD) {
    remoteLabel = v;
    // da un momento al service worker para terminar de bajar la versión nueva
    setTimeout(() => { waiting = reg?.waiting ?? waiting; emit(); }, reg?.installing ? 4000 : 1000);
    return true;
  }
  remoteLabel = null;
  return false;
}

export function postpone(): void {
  snoozeUntil = Date.now() + SNOOZE_MS;
  emit();
}

/** Activa la versión nueva. Si el navegador no la bajó, borra lo guardado y recarga (los datos de la app no se tocan). */
export async function applyUpdate(): Promise<void> {
  if (waiting) {
    waiting.postMessage('skipWaiting'); // al activarse, «controllerchange» recarga
    setTimeout(() => location.reload(), 5000);
    return;
  }
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('nc-')).map((k) => caches.delete(k)));
  } catch { /* se recarga igualmente */ }
  location.reload();
}

/** Registra el service worker y vigila versiones nuevas. Seguro de llamar varias veces. */
export function startUpdates(): void {
  if (started || !updatesSupported()) return;
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (local && !location.search.includes('sw')) return; // desarrollo: sin caché agresiva
  started = true;
  navigator.serviceWorker.register(`${BASE}/sw.js`).then((r) => {
    reg = r;
    r.addEventListener('updatefound', () => {
      const w = r.installing;
      w?.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) {
          waiting = w;
          remoteLabel = remoteLabel ?? 'nueva';
          emit();
        }
      });
    });
    void checkForUpdate();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) void checkForUpdate(); });
    window.addEventListener('online', () => void checkForUpdate());
    setInterval(() => void checkForUpdate(), CHECK_MS);
  }).catch(() => undefined);
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    location.reload();
  });
}
