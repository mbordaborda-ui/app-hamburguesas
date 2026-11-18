import { describe, expect, it } from 'vitest'
import { alwaysOpenHours, storeStatus, summarizeShifts } from '@/lib/hours'
import type { Settings, WeeklyHours } from '@/types'

const settingsWith = (hours: WeeklyHours, isOpen = true) => ({ isOpen, hours }) as Settings

const everyDay = (open: string, close: string): WeeklyHours =>
  Array.from({ length: 7 }, (_, day) => ({ day, shifts: [{ open, close }] }))

describe('storeStatus', () => {
  it('abierto dentro del turno', () => {
    const status = storeStatus(settingsWith(everyDay('12:00', '22:00')), new Date(2026, 8, 21, 20, 0))
    expect(status.open).toBe(true)
    expect(status.label).toBe('Abierto ahora')
    expect(status.nextChangeAt).toBeTruthy()
  })

  it('cerrado antes de abrir, con la próxima apertura', () => {
    const status = storeStatus(settingsWith(everyDay('12:00', '22:00')), new Date(2026, 8, 21, 9, 0))
    expect(status.open).toBe(false)
    expect(status.detail).toContain('Abrimos hoy')
  })

  it('cerrado después de cerrar, abre mañana', () => {
    const status = storeStatus(settingsWith(everyDay('12:00', '22:00')), new Date(2026, 8, 21, 23, 0))
    expect(status.open).toBe(false)
    expect(status.detail).toContain('mañana')
  })

  it('respeta turnos que cruzan medianoche', () => {
    const status = storeStatus(settingsWith(everyDay('18:00', '02:00')), new Date(2026, 8, 22, 1, 0))
    expect(status.open).toBe(true)
  })

  it('el interruptor maestro cierra aunque el horario diga abierto', () => {
    const status = storeStatus(
      settingsWith(everyDay('12:00', '22:00'), false),
      new Date(2026, 8, 21, 20, 0),
    )
    expect(status.open).toBe(false)
  })

  it('24 h siempre abierto', () => {
    expect(storeStatus(settingsWith(alwaysOpenHours()), new Date(2026, 8, 21, 3, 30)).open).toBe(true)
  })

  it('sin horario definido queda abierto', () => {
    expect(storeStatus(settingsWith([]), new Date(2026, 8, 21, 3, 30)).open).toBe(true)
  })
})

describe('summarizeShifts', () => {
  it('lista los turnos del día', () => {
    expect(summarizeShifts([{ open: '12:00', close: '22:00' }])).toContain('–')
  })

  it('día sin turnos es cerrado', () => {
    expect(summarizeShifts([])).toBe('Cerrado')
  })
})
