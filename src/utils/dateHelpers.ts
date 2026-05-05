import { format, isToday, isTomorrow, isThisWeek, parseISO, addMinutes, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

export function toDate(dateVal: number | string): Date {
  if (typeof dateVal === 'number') return new Date(dateVal);
  const parsed = parseISO(dateVal);
  return isValid(parsed) ? parsed : new Date(dateVal);
}

export function formatTime(isoDate: number | string): string {
  const date = toDate(isoDate);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDate(isoDate: number | string): string {
  return format(toDate(isoDate), 'dd MMM yyyy', { locale: es });
}

export function formatDateTime(isoDate: number | string): string {
  return format(toDate(isoDate), "dd MMM yyyy 'a las' HH:mm", { locale: es });
}

export function formatDayLabel(isoDate: number | string): string {
  const date = toDate(isoDate);
  if (isToday(date)) return 'Hoy';
  if (isTomorrow(date)) return 'Mañana';
  if (isThisWeek(date)) return format(date, 'EEEE', { locale: es });
  return format(date, 'EEEE, dd MMM', { locale: es });
}

export function formatRelative(isoDate: number | string): string {
  const date = toDate(isoDate);
  if (isToday(date)) return `Hoy, ${format(date, 'HH:mm')}`;
  if (isTomorrow(date)) return `Mañana, ${format(date, 'HH:mm')}`;
  return format(date, "EEE dd MMM, HH:mm", { locale: es });
}

export function toDateKey(isoDate: number | string): string {
  return toDate(isoDate).toISOString().split('T')[0];
}

export function snoozeDate(isoDate: number | string, minutes: number): number {
  return addMinutes(toDate(isoDate), minutes).getTime();
}

export function isFuture(isoDate: number | string): boolean {
  return toDate(isoDate).getTime() > Date.now();
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
