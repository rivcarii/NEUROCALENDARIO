/** Utilidades de fecha. Todo se almacena en ISO 8601 UTC; los días se calculan en hora local. */

export function durationMinutes(startedAt: string, endedAt: string | null): number | null {
  if (!endedAt) return null;
  const ms = Date.parse(endedAt) - Date.parse(startedAt);
  if (Number.isNaN(ms) || ms < 0) return null;
  return Math.round(ms / 60000);
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null) return 'en curso / sin fin registrado';
  if (minutes < 1) return 'menos de 1 min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** AAAA-MM-DD en hora local. */
export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isoToLocalDateKey(iso: string): string {
  return localDateKey(new Date(iso));
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

/** Combina una fecha local AAAA-MM-DD y HH:MM en un instante ISO UTC. */
export function localToIso(dateKey: string, hhmm: string): string {
  const [h, min] = hhmm.split(':').map(Number);
  const d = parseDateKey(dateKey);
  d.setHours(h ?? 0, min ?? 0, 0, 0);
  return d.toISOString();
}

export function startOfLocalDayIso(dateKey: string): string {
  return parseDateKey(dateKey).toISOString();
}

export function endOfLocalDayIso(dateKey: string): string {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + 1);
  return d.toISOString(); // límite exclusivo
}

export function addDays(dateKey: string, n: number): string {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + n);
  return localDateKey(d);
}

/** Lunes como primer día de la semana. */
export function startOfWeek(dateKey: string): string {
  const d = parseDateKey(dateKey);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return localDateKey(d);
}

export function monthGrid(year: number, month0: number): string[] {
  const first = localDateKey(new Date(year, month0, 1));
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const DIAS_CORTOS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export const monthName = (m0: number) => MESES[m0] ?? '';

export function formatDateLong(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${formatTime(iso)}`;
}

export function formatDateShort(dateKey: string): string {
  const [y, m, d] = dateKey.split('-');
  return `${d}/${m}/${y}`;
}
