import { format, isToday, isTomorrow, isThisWeek, parseISO, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatTime(isoDate: string): string {
  return format(parseISO(isoDate), 'HH:mm');
}

export function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), 'dd MMM yyyy', { locale: es });
}

export function formatDateTime(isoDate: string): string {
  return format(parseISO(isoDate), "dd MMM yyyy 'a las' HH:mm", { locale: es });
}

export function formatDayLabel(isoDate: string): string {
  const date = parseISO(isoDate);
  if (isToday(date)) return 'Hoy';
  if (isTomorrow(date)) return 'Mañana';
  if (isThisWeek(date)) return format(date, 'EEEE', { locale: es });
  return format(date, 'EEEE, dd MMM', { locale: es });
}

export function formatRelative(isoDate: string): string {
  const date = parseISO(isoDate);
  if (isToday(date)) return `Hoy, ${format(date, 'HH:mm')}`;
  if (isTomorrow(date)) return `Mañana, ${format(date, 'HH:mm')}`;
  return format(date, "EEE dd MMM, HH:mm", { locale: es });
}

export function toDateKey(isoDate: string): string {
  return isoDate.split('T')[0];
}

export function snoozeDate(isoDate: string, minutes: number): string {
  return addMinutes(parseISO(isoDate), minutes).toISOString();
}

export function isFuture(isoDate: string): boolean {
  return parseISO(isoDate) > new Date();
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
