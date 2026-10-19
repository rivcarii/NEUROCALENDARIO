import * as LocalAuthentication from 'expo-local-authentication';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { Account, Profile } from '../db/types';
import { Store } from '../db/store';
import { getDb } from './database';
import { newId } from './ids';

type Status = 'loading' | 'onboarding' | 'locked' | 'ready' | 'error';

interface Session {
  status: Status;
  error: string | null;
  store: Store | null;
  account: Account | null;
  profiles: Profile[];
  activeProfile: Profile | null;
  /** Se incrementa tras cada cambio de datos; las pantallas lo usan para recargar. */
  version: number;
  bump: () => void;
  setActiveProfile: (id: string) => Promise<void>;
  refreshProfiles: () => Promise<void>;
  onboard: (ownerName: string, personName: string, relationship: string) => Promise<void>;
  appLockEnabled: boolean;
  setAppLock: (on: boolean) => Promise<{ ok: boolean; message?: string }>;
  unlock: () => Promise<void>;
  lockNow: () => void;
}

const Ctx = createContext<Session | null>(null);

export function useSession(): Session {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession fuera de SessionProvider');
  return v;
}

/** Perfil activo garantizado (solo dentro de pantallas con sesión lista). */
export function useActive(): { store: Store; profile: Profile; account: Account } {
  const s = useSession();
  if (!s.store || !s.activeProfile || !s.account) throw new Error('Sesión sin perfil activo');
  return { store: s.store, profile: s.activeProfile, account: s.account };
}

const opts = { newId };

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [appLockEnabled, setLockEnabled] = useState(false);
  const lockedRef = useRef(false);

  const load = useCallback(async (s: Store) => {
    const acc = await s.getAccount();
    const list = await s.listProfiles();
    const saved = await s.getSetting('active_profile_id');
    const active = list.find((p) => p.id === saved) ?? list[0] ?? null;
    setAccount(acc ?? null);
    setProfiles(list);
    setActiveId(active?.id ?? null);
    setLockEnabled((await s.getSetting('app_lock')) === '1');
    return list.length > 0;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const db = await getDb();
        const owner = await db.get<{ id: string }>("SELECT id FROM accounts WHERE role = 'owner' ORDER BY created_at LIMIT 1");
        if (!owner) { setStatus('onboarding'); return; }
        const s = new Store(db, owner.id, opts);
        setStore(s);
        const has = await load(s);
        if (!has) { setStatus('onboarding'); return; }
        const lock = (await s.getSetting('app_lock')) === '1';
        lockedRef.current = lock;
        setStatus(lock ? 'locked' : 'ready');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error desconocido al abrir la base de datos.');
        setStatus('error');
      }
    })();
  }, [load]);

  // Bloquea al pasar a segundo plano si el bloqueo está activo.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'background' && lockedRef.current === false && appLockEnabled) {
        lockedRef.current = true;
        setStatus((cur) => (cur === 'ready' ? 'locked' : cur));
      }
    });
    return () => sub.remove();
  }, [appLockEnabled]);

  const value = useMemo<Session>(() => ({
    status, error, store, account, profiles,
    activeProfile: profiles.find((p) => p.id === activeId) ?? null,
    version,
    bump: () => setVersion((v) => v + 1),
    setActiveProfile: async (id) => {
      if (!store) return;
      // Se comprueba contra la base (no contra el estado en memoria) y con permiso del usuario actual.
      const list = await store.listProfiles();
      if (!list.some((p) => p.id === id)) return;
      await store.setSetting('active_profile_id', id);
      setProfiles(list);
      setActiveId(id);
      setVersion((v) => v + 1);
    },
    refreshProfiles: async () => { if (store) { await load(store); setVersion((v) => v + 1); } },
    onboard: async (ownerName, personName, relationship) => {
      const db = await getDb();
      let s = store;
      if (!s) {
        s = await Store.createFirstOwner(db, ownerName, opts);
        setStore(s);
      }
      await s.createProfile({ displayName: personName, relationship, isPrimary: true });
      await load(s);
      setStatus('ready');
    },
    appLockEnabled,
    setAppLock: async (on) => {
      if (!store) return { ok: false };
      if (on) {
        const hw = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hw || !enrolled) {
          return { ok: false, message: 'Este dispositivo no tiene huella, rostro o código de pantalla configurado.' };
        }
        const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Confirme para activar el bloqueo', disableDeviceFallback: false });
        if (!r.success) return { ok: false, message: 'No se pudo verificar su identidad.' };
      }
      await store.setSetting('app_lock', on ? '1' : '0');
      setLockEnabled(on);
      lockedRef.current = false;
      return { ok: true };
    },
    unlock: async () => {
      const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Desbloquear NeuroCalendario', disableDeviceFallback: false });
      if (r.success) { lockedRef.current = false; setStatus('ready'); }
    },
    lockNow: () => { if (appLockEnabled) { lockedRef.current = true; setStatus('locked'); } },
  }), [status, error, store, account, profiles, activeId, version, appLockEnabled, load]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
