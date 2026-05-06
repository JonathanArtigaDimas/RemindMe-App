import * as chrono from 'chrono-node';

export interface NLPResult {
  /** Texto original sin la parte de la fecha */
  title: string;
  /** Fecha/hora detectada, null si no se encontró ninguna */
  date: Date | null;
  /** Texto de la fecha encontrada, para mostrarlo en el badge */
  dateText: string | null;
}

/** Palabras/expresiones que son puramente temporales y deben eliminarse del título */
const TEMPORAL_WORDS_ES = [
  /\b(el\s+)?(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\b/gi,
  /\bmañana\b/gi,
  /\bhoy\b/gi,
  /\bpasado\s+mañana\b/gi,
  /\bla\s+próxima\s+semana\b/gi,
  /\besta\s+(semana|noche|tarde|mañana)\b/gi,
  /\ba\s+las?\s+\d{1,2}(:\d{2})?\s*(am|pm|hrs?|horas?)?\b/gi,
  /\blas?\s+\d{1,2}(:\d{2})?\s*(am|pm|hrs?|horas?)?\b/gi,
  /\bde\s+la\s+(mañana|tarde|noche)\b/gi,
  /\ben\s+\d+\s+(minutos?|horas?|días?|semanas?)\b/gi,
  /\bel\s+\d{1,2}\s+(de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi,
];

/**
 * Analiza un texto en lenguaje natural (español) y extrae fecha, hora y título limpio.
 *
 * @example
 * parseNaturalLanguage('Llamar al cliente mañana a las 2pm')
 * // → { title: 'Llamar al cliente', date: Date(...), dateText: 'mañana a las 2pm' }
 */
export function parseNaturalLanguage(input: string): NLPResult {
  const trimmed = input.trim();
  if (!trimmed) return { title: '', date: null, dateText: null };

  // Use chrono-node with Spanish locale + reference date = now
  const results = chrono.es.parse(trimmed, new Date(), { forwardDate: true });

  if (!results || results.length === 0) {
    return { title: trimmed, date: null, dateText: null };
  }

  const result = results[0];
  const parsedDate = result.date();
  const dateText = result.text; // e.g. "mañana a las 2pm"

  // Build a clean title by removing the matched date text and extra whitespace
  let cleanTitle = trimmed;

  // Remove the exact matched date string
  cleanTitle = cleanTitle.replace(dateText, '');

  // Remove leftover temporal words that chrono might have missed contextually
  for (const pattern of TEMPORAL_WORDS_ES) {
    cleanTitle = cleanTitle.replace(pattern, '');
  }

  // Clean up leading/trailing punctuation and spaces
  cleanTitle = cleanTitle
    .replace(/\s{2,}/g, ' ')
    .replace(/\b(el|la|los|las|un|una|de|del|a|al|en|con|por|para|y|e|o|u)\s*$/gi, '') // trailing lonely articles/preps
    .replace(/^[\s,;:]+|[\s,;:]+$/g, '')
    .trim();

  return {
    title: cleanTitle || trimmed,
    date: parsedDate,
    dateText,
  };
}

/**
 * Formats the detected date text for the UI badge.
 */
export function formatDetectedDate(date: Date): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (isToday) return `Hoy a las ${timeStr}`;
  if (isTomorrow) return `Mañana a las ${timeStr}`;

  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
