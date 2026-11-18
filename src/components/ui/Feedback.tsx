import type { ReactNode } from 'react'
import { SpraySplat } from '@/components/brand/StreetArt'
import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-xl', className)} />
}

export function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-carbon">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-9 w-full rounded-2xl" />
      </div>
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block size-5 animate-spin rounded-full border-2 border-red border-t-transparent',
        className,
      )}
    />
  )
}

export function EmptyState({
  emoji = '🍔',
  title,
  description,
  action,
  hint,
}: {
  emoji?: string
  title: string
  description?: string
  action?: ReactNode
  hint?: string
}) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <SpraySplat
        seed={11}
        className="pointer-events-none absolute -right-10 -top-12 size-48 text-red/[0.06]"
      />
      <span className="relative grid size-20 place-items-center">
        <SpraySplat seed={21} className="absolute inset-0 text-red/15" />
        <span className="relative text-5xl">{emoji}</span>
      </span>
      <h3 className="relative font-display text-lg text-bone">{title}</h3>
      {description && <p className="relative max-w-xs text-sm text-ash">{description}</p>}
      {action && <div className="relative">{action}</div>}
      {hint && <p className="relative font-marker text-xs text-red/70">{hint}</p>}
    </div>
  )
}

export function ProgressBar({
  value,
  max = 100,
  className,
  tone = 'volt',
  showGlow,
}: {
  value: number
  max?: number
  className?: string
  tone?: 'volt' | 'flame' | 'lime' | 'yellow'
  showGlow?: boolean
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))
  const colors = {
    volt: 'bg-red',
    flame: 'bg-flame',
    lime: 'bg-lime',
    yellow: 'bg-yellow',
  }
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-white/10', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-700 ease-out',
          colors[tone],
          showGlow && 'shadow-[0_0_14px_0_rgba(255,212,0,0.6)]',
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export function Rating({
  value,
  count,
  size = 'sm',
}: {
  value: number
  count?: number
  size?: 'sm' | 'md'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-bold text-yellow',
        size === 'sm' ? 'text-xs' : 'text-sm',
      )}
    >
      <span aria-hidden>★</span>
      {value.toFixed(1)}
      {count !== undefined && <span className="font-medium text-ash">({count})</span>}
    </span>
  )
}

export function StarInput({
  value,
  onChange,
  size = 'md',
}: {
  value: number
  onChange: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} estrellas`}
          className={cn(
            'transition-transform duration-150 active:scale-90',
            sizes[size],
            star <= value ? 'text-yellow' : 'text-white/20',
          )}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-end justify-between gap-3', className)}>
      <div>
        <h2 className="font-display text-xl leading-tight text-bone sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-ash sm:text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
