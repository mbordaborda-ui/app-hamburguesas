/**
 * Horario de atención: dominio puro, sin React.
 *
 * `storeStatus` responde tres preguntas: ¿está abierto ahora?, ¿cuándo cambia? y
 * ¿cómo se lo contamos al cliente? Soporta varios turnos por día y turnos que
 * cruzan medianoche (ej. 18:00 – 02:00).
 */

import type { Settings, Shift, WeeklyHours } from '@/types'

/** Nombres en orden domingo → sábado (índice = `Date.getDay()`). */
export const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
/** Orden de lectura: lunes primero. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

/** Mensaje de marca que se muestra cuando el local no recibe pedidos. */
export const CLOSED_MESSAGE = '🍔 Cocina en pausa, Volvemos pronto 🔥'

export interface StoreStatus {
  open: boolean
  /** Texto corto: "Abierto ahora" / "Cerrado". */
  label: string
  /** Frase útil: "Cerramos hoy a las 10:00 p. m." / "Abrimos mañana a las 12:00 p. m." */
  detail: string
  /** ISO del próximo cambio de estado (apertura o cierre). */
  nextChangeAt?: string
}

export function minutesOf(time: string): number {
  const [h, m] = time.split(':').map((n) => Number(n))
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0)
}

function dateAtMinutes(base: Date, minutes: number): Date {
  const date = new Date(base)
  date.setHours(0, 0, 0, 0)
  date.setMinutes(minutes)
  return date
}

function shiftByDays(base: Date, days: number): Date {
  const date = new Date(base)
  date.setDate(date.getDate() + days)
  return date
}

export function formatClock(date: Date): string {
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

/** "12:00 p. m. – 10:00 p. m." o "Cerrado". */
export function summarizeShifts(shifts: Shift[]): string {
  if (shifts.length === 0) return 'Cerrado'
  const today = new Date()
  return shifts
    .map(
      (shift) =>
        `${formatClock(dateAtMinutes(today, minutesOf(shift.open)))} – ${formatClock(
          dateAtMinutes(today, minutesOf(shift.close)),
        )}`,
    )
    .join(' · ')
}

function dayPhrase(target: Date, now: Date): string {
  const startOf = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const days = Math.round((startOf(target) - startOf(now)) / 86_400_000)
  if (days <= 0) return 'hoy'
  if (days === 1) return 'mañana'
  return `el ${DAY_LABELS[target.getDay()].toLowerCase()}`
}

interface Interval {
  open: Date
  close: Date
}

function buildIntervals(hours: WeeklyHours, now: Date): Interval[] {
  const byDay = new Map(hours.map((entry) => [entry.day, entry.shifts]))
  const intervals: Interval[] = []

  // Del día anterior (turnos que cruzan medianoche) a una semana adelante.
  for (let offset = -1; offset <= 7; offset++) {
    const day = shiftByDays(now, offset)
    for (const shift of byDay.get(day.getDay()) ?? []) {
      const open = dateAtMinutes(day, minutesOf(shift.open))
      let close = dateAtMinutes(day, minutesOf(shift.close))
      if (close <= open) close = shiftByDays(close, 1)
      intervals.push({ open, close })
    }
  }

  return intervals
}

export function storeStatus(settings: Settings, now: Date = new Date()): StoreStatus {
  if (!settings.isOpen) {
    return { open: false, label: 'Cerrado', detail: 'Estamos ajustando la cocina.' }
  }

  const hours = settings.hours
  if (!hours || hours.length === 0) {
    return { open: true, label: 'Abierto ahora', detail: 'Recibiendo pedidos.' }
  }

  const intervals = buildIntervals(hours, now)

  const current = intervals.find((interval) => now >= interval.open && now < interval.close)
  if (current) {
    return {
      open: true,
      label: 'Abierto ahora',
      detail: `Cerramos ${dayPhrase(current.close, now)} a las ${formatClock(current.close)}`,
      nextChangeAt: current.close.toISOString(),
    }
  }

  const upcoming = intervals
    .filter((interval) => interval.open.getTime() > now.getTime())
    .sort((a, b) => a.open.getTime() - b.open.getTime())[0]

  if (!upcoming) {
    return { open: false, label: 'Cerrado', detail: 'Vuelve pronto.' }
  }

  return {
    open: false,
    label: 'Cerrado',
    detail: `Abrimos ${dayPhrase(upcoming.open, now)} a las ${formatClock(upcoming.open)}`,
    nextChangeAt: upcoming.open.toISOString(),
  }
}

/** Horario 24/7 (útil como preset del admin y en pruebas). */
export function alwaysOpenHours(): WeeklyHours {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    shifts: [{ open: '00:00', close: '23:59' }],
  }))
}
