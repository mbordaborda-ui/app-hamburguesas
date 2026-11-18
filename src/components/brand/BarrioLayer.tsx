import type { ReactNode } from 'react'
import { BurstSticker, SpraySplat, TapeStrip } from './StreetArt'
import { cn } from '@/lib/utils'

type Variant = 'hero' | 'section' | 'subtle' | 'poster'

/**
 * Capa decorativa de barrio: manchas de spray, overspray, doodles y cintas.
 * Siempre por detrás del contenido y sin capturar eventos, así que no afecta
 * la usabilidad ni el foco del teclado.
 */
export function BarrioLayer({
  variant = 'section',
  seed = 4,
  className,
  sticker,
}: {
  variant?: Variant
  seed?: number
  className?: string
  sticker?: ReactNode
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 z-0 overflow-hidden select-none',
        className,
      )}
    >
      {variant === 'hero' && (
        <>
          <SpraySplat
            seed={seed}
            className="absolute -left-24 -top-20 size-64 text-red/[0.07] sm:size-80"
          />
          {sticker && (
            <div className="absolute right-4 top-4 sm:right-8 sm:top-8">{sticker}</div>
          )}
        </>
      )}

      {variant === 'section' && (
        <SpraySplat seed={seed} className="absolute -right-12 -top-12 size-40 text-red/[0.05]" />
      )}

      {variant === 'subtle' && null}

      {variant === 'poster' && (
        <>
          <div className="texture-brick absolute inset-0 opacity-40" />
          <TapeStrip className="-top-2 left-6 -rotate-6" />
          <TapeStrip className="-bottom-2 right-8 rotate-3" />
        </>
      )}
    </div>
  )
}

/** Marco tipo calcomanía para envolver contenido. */
export function StickerFrame({
  children,
  className,
  tone = 'volt',
  rotate = -8,
}: {
  children: ReactNode
  className?: string
  tone?: 'volt' | 'bone' | 'flame' | 'ink' | 'lime' | 'grape'
  rotate?: number
}) {
  return (
    <div className={cn('relative inline-block', className)}>
      <BurstSticker tone={tone} rotate={rotate}>
        {children}
      </BurstSticker>
    </div>
  )
}
