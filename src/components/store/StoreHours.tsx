import { Clock } from 'lucide-react'
import { DAY_LABELS, WEEK_ORDER, summarizeShifts } from '@/lib/hours'
import { cn } from '@/lib/utils'
import { useStoreStatus } from '@/hooks/useStoreStatus'
import { useDb } from '@/store/db'

/** Píldora de estado: "Abierto ahora" / "Cerrado". */
export function StoreStatusPill({ className }: { className?: string }) {
  const status = useStoreStatus()
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
        status.open
          ? 'border-acid/40 bg-acid/10 text-acid'
          : 'border-flame/40 bg-flame/10 text-flame',
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', status.open ? 'bg-acid' : 'bg-flame')} aria-hidden />
      {status.label}
    </span>
  )
}

/** Tarjeta con el horario de la semana y el día de hoy resaltado. */
export function StoreHoursCard({ className }: { className?: string }) {
  const hours = useDb((s) => s.settings.hours) ?? []
  const status = useStoreStatus()
  const today = new Date().getDay()
  const byDay = new Map(hours.map((entry) => [entry.day, entry.shifts]))

  return (
    <section className={cn('rounded-[28px] border border-white/[0.08] bg-carbon p-5', className)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-white/[0.06] text-red">
            <Clock className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-lg text-bone">HORARIO DE ATENCIÓN</h2>
            <p className="text-xs text-ash">{status.detail}</p>
          </div>
        </div>
        <StoreStatusPill />
      </header>

      <ul className="mt-4 divide-y divide-white/[0.06]">
        {WEEK_ORDER.map((day) => {
          const shifts = byDay.get(day) ?? []
          const isToday = day === today
          return (
            <li
              key={day}
              className={cn(
                'flex items-center justify-between gap-3 py-2 text-sm',
                isToday ? 'text-bone' : 'text-ash',
              )}
            >
              <span className={cn('flex items-center gap-2', isToday && 'font-bold')}>
                {isToday && <span className="size-1.5 rounded-full bg-red" aria-hidden />}
                {DAY_LABELS[day]}
                {isToday && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red">Hoy</span>
                )}
              </span>
              <span className={cn('text-right text-xs', shifts.length === 0 && 'text-concrete')}>
                {summarizeShifts(shifts)}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
