import type { ReactNode } from 'react'
import { Sticker, type StickerTone } from '@/components/brand/StreetArt'
import { badgeMeta, type BadgeTone } from '@/lib/badges'
import { cn } from '@/lib/utils'
import type { ProductBadge } from '@/types'

export type Tone = BadgeTone

const tones: Record<BadgeTone, string> = {
  /* identidad */
  red: 'bg-red text-white',
  orange: 'bg-orange text-ink',
  magenta: 'bg-magenta text-white',
  acid: 'bg-acid text-ink',
  violet: 'bg-violet text-white',
  yellow: 'bg-yellow text-ink',
  cream: 'bg-bone text-ink',
  /* neutrales */
  neutral: 'bg-white/10 text-bone',
  outline: 'border border-white/20 text-ash',
  /* legado */
  volt: 'bg-yellow text-ink',
  flame: 'bg-orange text-ink',
  lime: 'bg-acid text-ink',
  grape: 'bg-violet text-white',
}

export function Pill({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const stickerToneFor = (tone: BadgeTone): StickerTone => {
  if (tone === 'neutral') return 'ink'
  if (tone === 'outline') return 'cream'
  if (tone === 'volt') return 'yellow'
  if (tone === 'flame') return 'orange'
  if (tone === 'lime') return 'acid'
  if (tone === 'grape') return 'violet'
  return tone as StickerTone
}

export function ProductBadgePill({ badge }: { badge: ProductBadge }) {
  const meta = badgeMeta[badge]
  return (
    <Pill tone={meta.tone}>
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </Pill>
  )
}

/** Versión calcomanía: la que se usa en tarjetas, banners y heroes. */
export function ProductBadgeSticker({
  badge,
  rotate,
  size = 'sm',
}: {
  badge: ProductBadge
  rotate?: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const meta = badgeMeta[badge]
  return (
    <Sticker tone={stickerToneFor(meta.tone)} rotate={rotate} size={size}>
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </Sticker>
  )
}

export function SpicyMeter({ level }: { level: 0 | 1 | 2 | 3 }) {
  if (!level) return null
  return (
    <span className="inline-flex items-center gap-0.5" title={`Picante nivel ${level}`}>
      {Array.from({ length: level }).map((_, i) => (
        <span key={i} className="text-[11px] leading-none">
          🌶️
        </span>
      ))}
    </span>
  )
}
