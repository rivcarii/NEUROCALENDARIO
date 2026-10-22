/* eslint-disable import/namespace -- los enums de Android existen en tiempo de ejecución */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Store } from '../db/store';
import { notificationContent } from '../domain/reminders';
import { collectPlanned } from './planner';
import { newId } from './ids';

const CHANNEL = 'recordatorios';

export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
    }),
  });
}

export async function ensurePermission(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export interface RescheduleResult {
  scheduled: number;
  permission: boolean;
  /** La plataforma no puede programar avisos con la app cerrada (versión web). */
  unsupported?: boolean;
}

/**
 * Cancela todo lo programado y vuelve a programar los próximos recordatorios de
 * todos los perfiles accesibles. Las notificaciones locales no son un servicio de
 * emergencia: pueden retrasarse o no entregarse (modo ahorro, permisos, reinicio).
 */
export async function rescheduleAll(store: Store, showDetails: boolean, now = new Date()): Promise<RescheduleResult> {
  if (Platform.OS === 'web') return { scheduled: 0, permission: true, unsupported: true };
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const p of await store.listProfiles()) await store.db.run('DELETE FROM reminders WHERE profile_id = ?', [p.id]);

  const perProfile = await collectPlanned(store, now);
  const batch = perProfile.slice(0, 60);
  if (batch.length === 0) return { scheduled: 0, permission: true };

  if (!(await ensurePermission())) return { scheduled: 0, permission: false };
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Recordatorios', importance: Notifications.AndroidImportance.HIGH,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    });
  }
  let scheduled = 0;
  for (const { profileId, r, label } of batch) {
    const content = notificationContent(r, showDetails, label);
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: { ...content, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(r.fireAt), channelId: CHANNEL },
    });
    await store.db.run(
      'INSERT INTO reminders (id, profile_id, kind, ref_id, fire_at, notification_id, created_at) VALUES (?,?,?,?,?,?,?)',
      [newId(), profileId, r.kind, r.refId, r.fireAt, notificationId, now.toISOString()],
    );
    scheduled++;
  }
  return { scheduled, permission: true };
}

export async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
