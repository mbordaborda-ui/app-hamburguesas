import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* Generador pseudoaleatorio determinista                              */
/* ------------------------------------------------------------------ */

const rng = (seed: number) => {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

type Point = [number, number]

/** Curva cerrada suave (blob) a partir de puntos. */
function smoothClosedPath(points: Point[]) {
  const n = points.length
  const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const start = mid(points[n - 1], points[0])
  let d = `M${start[0].toFixed(1)},${start[1].toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const p = points[i]
    const next = points[(i + 1) % n]
    const m = mid(p, next)
    d += `Q${p[0].toFixed(1)},${p[1].toFixed(1)} ${m[0].toFixed(1)},${m[1].toFixed(1)}`
  }
  return `${d}Z`
}

/* ------------------------------------------------------------------ */
/* Manchas y overspray                                                 */
/* ------------------------------------------------------------------ */

export function SpraySplat({
  seed = 7,
  points = 11,
  wobble = 0.36,
  drops = 9,
  className,
}: {
  seed?: number
  points?: number
  wobble?: number
  drops?: number
  className?: string
}) {
  const { blob, droplets } = useMemo(() => {
    const random = rng(seed * 7919 + 13)
    const pts: Point[] = []
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2
      const radius = 62 * (1 - wobble / 2 + random() * wobble)
      pts.push([100 + Math.cos(angle) * radius, 100 + Math.sin(angle) * radius])
    }
    const droplets = Array.from({ length: drops }, () => {
      const angle = random() * Math.PI * 2
      const distance = 76 + random() * 30
      return {
        x: 100 + Math.cos(angle) * distance,
        y: 100 + Math.sin(angle) * distance,
        r: 1.4 + random() * 4.8,
      }
    })
    return { blob: smoothClosedPath(pts), droplets }
  }, [seed, points, wobble, drops])

  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden focusable="false">
      <path d={blob} fill="currentColor" />
      {droplets.map((drop, index) => (
        <circle key={index} cx={drop.x} cy={drop.y} r={drop.r} fill="currentColor" />
      ))}
    </svg>
  )
}

export function SprayDots({
  seed = 3,
  count = 60,
  width = 300,
  height = 200,
  className,
}: {
  seed?: number
  count?: number
  width?: number
  height?: number
  className?: string
}) {
  const dots = useMemo(() => {
    const random = rng(seed * 104729 + 7)
    return Array.from({ length: count }, () => ({
      x: random() * width,
      y: random() * height,
      r: 0.6 + random() * 2.2,
      o: 0.2 + random() * 0.7,
    }))
  }, [seed, count, width, height])

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden focusable="false">
      {dots.map((dot, index) => (
        <circle key={index} cx={dot.x} cy={dot.y} r={dot.r} fill="currentColor" opacity={dot.o} />
      ))}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Doodles de marcador                                                 */
/* ------------------------------------------------------------------ */

export function TagArrow({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 62"
      className={cn(flip && '-scale-x-100', className)}
      aria-hidden
      focusable="false"
    >
      <path
        d="M6 50C20 22 50 8 94 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M94 13 78 6M94 13 88 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Scribble({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 60" className={className} aria-hidden focusable="false">
      <path
        d="M4 42c18-30 34 16 52-6s28 18 46-6 30 20 48-2 26 8 46-14"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Crown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 72" className={className} aria-hidden focusable="false">
      <path
        d="M8 58 2 12l24 20L50 2l24 30 24-20-6 46z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <rect x="8" y="58" width="84" height="11" rx="3" fill="currentColor" />
    </svg>
  )
}

export function Star4({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path d="M12 0l2.6 8.1L23 12l-8.4 3.9L12 24l-2.6-8.1L1 12l8.4-3.9z" fill="currentColor" />
    </svg>
  )
}

export function Barcode({ className }: { className?: string }) {
  const bars = [3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2]
  let x = 0
  return (
    <svg viewBox="0 0 100 30" className={className} aria-hidden focusable="false">
      {bars.map((bar, index) => {
        const rect = (
          <rect
            key={index}
            x={x}
            y={index % 3 === 0 ? 0 : 2}
            width={bar * 0.9}
            height={index % 3 === 0 ? 30 : 26}
            fill="currentColor"
          />
        )
        x += bar * 0.9 + 1.6
        return rect
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Stickers                                                            */
/* ------------------------------------------------------------------ */

export type StickerTone =
  | 'red'
  | 'orange'
  | 'magenta'
  | 'acid'
  | 'violet'
  | 'yellow'
  | 'cream'
  | 'ink'
  /* alias legado */
  | 'volt'
  | 'bone'
  | 'flame'
  | 'lime'
  | 'grape'

const stickerTones: Record<StickerTone, string> = {
  red: 'bg-red text-white',
  orange: 'bg-orange text-ink',
  magenta: 'bg-magenta text-white',
  acid: 'bg-acid text-ink',
  violet: 'bg-violet text-white',
  yellow: 'bg-yellow text-ink',
  cream: 'bg-bone text-ink',
  ink: 'bg-carbon text-bone',
  /* legado */
  volt: 'bg-yellow text-ink',
  bone: 'bg-bone text-ink',
  flame: 'bg-orange text-ink',
  lime: 'bg-acid text-ink',
  grape: 'bg-violet text-white',
}

/** Rellenos claros necesitan contorno oscuro; rellenos oscuros, contorno crema. */
const stickerOutline: Record<StickerTone, string> = {
  red: 'border-bone/90',
  orange: 'border-ink',
  magenta: 'border-bone/90',
  acid: 'border-ink',
  violet: 'border-bone/90',
  yellow: 'border-ink',
  cream: 'border-ink',
  ink: 'border-bone/80',
  volt: 'border-ink',
  bone: 'border-ink',
  flame: 'border-ink',
  lime: 'border-ink',
  grape: 'border-bone/90',
}

export function Sticker({
  children,
  tone = 'red',
  rotate = -7,
  size = 'md',
  className,
  style,
  shape = 'cut',
}: {
  children: ReactNode
  tone?: StickerTone
  rotate?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
  style?: CSSProperties
  /** `torn` = borde recortado a mano, `cut` = calcomanía clásica. */
  shape?: 'cut' | 'torn'
}) {
  const sizes = {
    sm: 'px-2.5 py-1 text-[9px]',
    md: 'px-3 py-1.5 text-[10px]',
    lg: 'px-4 py-2 text-xs',
  }
  return (
    <span
      style={{ transform: `rotate(${rotate}deg)`, ...style }}
      className={cn(
        'relative isolate inline-flex items-center font-display uppercase tracking-[0.08em]',
        'border-[2.5px] shadow-sticker',
        shape === 'torn' ? 'torn-1 rounded-none border-0' : 'rounded-lg',
        stickerTones[tone],
        stickerOutline[tone],
        sizes[size],
        className,
      )}
    >
      {/* Trama de impresión de la calcomanía */}
      <span
        aria-hidden
        className="sticker-print pointer-events-none absolute inset-0 opacity-55 mix-blend-multiply"
      />
      <span className="relative inline-flex items-center gap-1">{children}</span>
    </span>
  )
}

/** Título con lettering graffiti: degradado + contorno + volumen. */
export function GraffitiTitle({
  children,
  fill = 'yellow',
  className,
  tilt = false,
  animate,
}: {
  children: ReactNode
  fill?: 'fire' | 'red' | 'yellow' | 'hot'
  className?: string
  tilt?: boolean
  animate?: boolean
}) {
  const fills = {
    fire: 'tag-fill-fire',
    red: 'tag-fill-red',
    yellow: 'tag-fill-yellow',
    hot: 'tag-fill-hot',
  }
  return (
    <span
      className={cn(
        'tag-3d font-display uppercase',
        fills[fill],
        tilt && 'tag-tilt inline-block',
        animate && 'animate-tag-in',
        className,
      )}
    >
      {children}
    </span>
  )
}

const BURST_CLIP = (() => {
  const spikes = 14
  const points: string[] = []
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
    const radius = i % 2 === 0 ? 50 : 40
    points.push(
      `${(50 + Math.cos(angle) * radius).toFixed(2)}% ${(50 + Math.sin(angle) * radius).toFixed(2)}%`,
    )
  }
  return `polygon(${points.join(',')})`
})()

/** Sticker "explosión" tipo calcomanía de esquina. */
export function BurstSticker({
  children,
  tone = 'yellow',
  rotate = -10,
  className,
}: {
  children: ReactNode
  tone?: StickerTone
  rotate?: number
  className?: string
}) {
  return (
    <span
      style={{ transform: `rotate(${rotate}deg)`, clipPath: BURST_CLIP }}
      className={cn(
        'relative grid size-24 place-items-center p-2 text-center font-display text-[10px] leading-tight uppercase tracking-[0.08em] sm:size-28 sm:text-[11px]',
        stickerTones[tone],
        className,
      )}
    >
      <span
        aria-hidden
        className="sticker-print pointer-events-none absolute inset-0 opacity-45 mix-blend-multiply"
      />
      <span className="relative max-w-[80%]">{children}</span>
    </span>
  )
}

/** Cinta adhesiva. */
export function TapeStrip({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'tape pointer-events-none absolute block h-7 w-28 bg-bone/25 backdrop-blur-[1px]',
        className,
      )}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Ilustraciones urbanas                                               */
/* ------------------------------------------------------------------ */

export function SprayCan({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <rect x="26" y="8" width="12" height="8" rx="2" fill="currentColor" opacity="0.55" />
      <rect x="29" y="2" width="6" height="7" rx="1.5" fill="currentColor" opacity="0.35" />
      <rect x="18" y="18" width="28" height="42" rx="6" fill="currentColor" />
      <rect x="24" y="26" width="16" height="12" rx="2" fill="#0A0A0A" opacity="0.35" />
      <circle cx="32" cy="48" r="3.5" fill="#0A0A0A" opacity="0.35" />
    </svg>
  )
}

/** Hamburguesa estilo graffiti: contornos gruesos y rellenos planos. */
export function BurgerGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 104" className={className} aria-hidden focusable="false">
      <g stroke="#0B0B0D" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M13 48c0-20 21-34 47-34s47 14 47 34z" fill="#FFD21F" />
        <path d="M9 55c8-7 17 4 25-2s17 7 25 1 17 6 25 0 16 5 24-3v11c-8 8-16-3-24 3s-17-6-25 0-17-7-25-1-17 5-25 2z" fill="#A8E600" />
        <rect x="11" y="65" width="98" height="15" rx="7.5" fill="#7A3CFF" />
        <path d="M13 84h94c0 11-9 17-19 17H32c-10 0-19-6-19-17z" fill="#FF6A00" />
      </g>
      <g fill="#0B0B0D">
        <circle cx="44" cy="31" r="2.8" />
        <circle cx="62" cy="25" r="2.8" />
        <circle cx="79" cy="33" r="2.8" />
      </g>
    </svg>
  )
}

/** Moto de domicilio estilo graffiti. */
export function ScooterGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 130 92" className={className} aria-hidden focusable="false">
      <g stroke="#0B0B0D" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" fill="none">
        <circle cx="28" cy="70" r="15" strokeWidth="7" />
        <circle cx="102" cy="70" r="15" strokeWidth="7" />
        <path d="M28 70h30l12-30h20" strokeWidth="9" />
        <path d="M74 40h24l6 30" strokeWidth="9" />
        <path d="M92 40l6-16h14" strokeWidth="7" />
      </g>
      <rect x="34" y="30" width="30" height="26" rx="6" fill="#1769FF" stroke="#0B0B0D" strokeWidth="5" />
      <path d="M96 12h16" stroke="#0B0B0D" strokeWidth="8" strokeLinecap="round" />
    </svg>
  )
}

export function Boombox({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" className={className} aria-hidden focusable="false">
      <rect x="2" y="6" width="60" height="36" rx="6" fill="currentColor" />
      <circle cx="16" cy="24" r="9" fill="#0A0A0A" opacity="0.4" />
      <circle cx="16" cy="24" r="3" fill="currentColor" />
      <circle cx="48" cy="24" r="9" fill="#0A0A0A" opacity="0.4" />
      <circle cx="48" cy="24" r="3" fill="currentColor" />
      <rect x="28" y="16" width="8" height="16" rx="2" fill="#0A0A0A" opacity="0.4" />
      <rect x="22" y="0" width="20" height="6" rx="3" fill="currentColor" />
    </svg>
  )
}

/** Texto con contorno tipo grafiti (sticker lettering). */
export function GraffitiText({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span className={cn('sticker-text font-display uppercase', className)}>{children}</span>
  )
}

/** Separador con línea de marcador y chispa. */
export function MarkerDivider({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)} aria-hidden>
      <span className="h-[3px] flex-1 rounded-full bg-white/10" />
      <Star4 className="size-3 text-red" />
      <span className="h-[3px] flex-1 rounded-full bg-white/10" />
    </div>
  )
}

/** Banda de cinta adhesiva con frases de barrio. */
const bandTones: Record<'yellow' | 'red' | 'orange' | 'ink', string> = {
  yellow: 'bg-yellow text-ink',
  red: 'bg-red text-white',
  orange: 'bg-orange text-ink',
  ink: 'bg-graphite text-bone',
}

export function StreetBand({
  items,
  rotate = -1.5,
  tone = 'yellow',
  className,
}: {
  items: string[]
  rotate?: number
  tone?: 'yellow' | 'red' | 'orange' | 'ink'
  className?: string
}) {
  const repeated = [...items, ...items]
  return (
    // El contenedor recorta el sangrado de la cinta rotada: sin esto la página
    // gana scroll horizontal en móvil.
    <div aria-hidden className={cn('relative w-full overflow-hidden py-1.5', className)}>
      <div
        className="-mx-[6%] w-[112%] origin-center"
        style={{ transform: `rotate(${rotate}deg)` }}
      >
        <div className={cn('flex w-max animate-marquee items-center py-2', bandTones[tone])}>
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {repeated.map((item, index) => (
                <span
                  key={index}
                  className="flex shrink-0 items-center gap-5 whitespace-nowrap pl-5 font-display text-xs uppercase tracking-widest sm:text-sm"
                >
                  {item}
                  <Star4 className="size-2.5 shrink-0" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
