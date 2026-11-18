import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function AdminCard({
  title,
  subtitle,
  action,
  children,
  className,
  padded = true,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <section className={cn('rounded-3xl border border-white/[0.08] bg-carbon', className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3.5">
          <div>
            {title && <h2 className="font-display text-sm uppercase tracking-wide text-bone">{title}</h2>}
            {subtitle && <p className="text-[11px] text-ash">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn(padded && 'p-4')}>{children}</div>
    </section>
  )
}

export function Kpi({
  label,
  value,
  hint,
  tone = 'volt',
  icon,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'volt' | 'lime' | 'flame' | 'grape' | 'yellow' | 'red'
  icon?: ReactNode
}) {
  const tones = {
    volt: 'text-red bg-red/12',
    red: 'text-red bg-red/12',
    lime: 'text-lime bg-lime/12',
    yellow: 'text-yellow bg-yellow/12',
    flame: 'text-flame bg-flame/12',
    grape: 'text-grape bg-grape/12',
  }
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-carbon p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-concrete">{label}</span>
        {icon && (
          <span className={cn('grid size-8 place-items-center rounded-xl', tones[tone])}>{icon}</span>
        )}
      </div>
      <p className="mt-2 font-display text-2xl text-bone">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-ash">{hint}</p>}
    </div>
  )
}

export function DataTable({
  headers,
  children,
}: {
  headers: string[]
  children: ReactNode
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/[0.08]">
            {headers.map((header) => (
              <th
                key={header}
                className="whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-concrete"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function Bar({ label, value, max, tone = 'volt' }: { label: string; value: number; max: number; tone?: 'volt' | 'flame' | 'lime' | 'yellow' }) {
  const percent = max > 0 ? (value / max) * 100 : 0
  const colors = { volt: 'bg-red', flame: 'bg-flame', lime: 'bg-lime', yellow: 'bg-yellow' }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="truncate text-ash">{label}</span>
        <span className="font-bold text-bone">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={cn('h-full rounded-full transition-[width] duration-700', colors[tone])} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
