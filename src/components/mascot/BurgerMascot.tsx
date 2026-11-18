import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'
import { MascotGlyph } from './MascotGlyph'
import {
  mascotPersonalities,
  type MascotId,
  type MascotPersonality,
} from '@/data/mascot'
import { cn } from '@/lib/utils'
import { useMascot, useMascotLine } from '@/store/mascot'

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const isLightColor = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 150
}

/** Emojis que flotan alrededor de cada actitud. */
const personalityEmojis: Record<MascotId, string[]> = {
  tranqui: ['🧢', '🍔', '✨'],
  bandida: ['💋', '💕', '🌶️'],
  pesada: ['👑', '💪', '🍔'],
  en_llamas: ['🔥', '🌶️', '💨'],
  delivery: ['🛵', '📦', '💨'],
  hambrienta: ['🍟', '🤤', '🍔'],
}

/* ------------------------------------------------------------------ */
/* Figura: usa tu PNG si existe, si no dibuja el personaje SVG         */
/* ------------------------------------------------------------------ */

function MascotFigure({
  personality,
  className,
}: {
  personality: MascotPersonality
  className?: string
}) {
  const [missing, setMissing] = useState(false)

  useEffect(() => setMissing(false), [personality.id])

  // El SVG es el modo principal. Solo se intenta la imagen si hay una ruta
  // definida y el archivo existe; si falla, cae de vuelta al SVG.
  if (!personality.image || missing) {
    return <MascotGlyph personality={personality} className={className} />
  }

  return (
    <img
      src={personality.image}
      alt=""
      aria-hidden
      draggable={false}
      loading="lazy"
      decoding="async"
      onError={() => setMissing(true)}
      className={cn('object-contain', className)}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Partículas de aerosol al tocar                                      */
/* ------------------------------------------------------------------ */

function MascotParticles({ burst, color }: { burst: number; color: string }) {
  // Configuración determinista: se recalcula en cada toque sin usar Math.random.
  const dots = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 + (burst % 7) * 0.4
    const distance = 68 + ((i * 37 + burst * 17) % 58)
    return {
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      size: 5 + ((i * 13 + burst * 5) % 9),
      delay: (i % 4) * 0.04,
      color: i % 3 === 0 ? color : '#FFD21F',
    }
  })

  return (
    <span key={burst} aria-hidden className="pointer-events-none absolute inset-0 z-10">
      {dots.map((dot, index) => (
        <span
          key={index}
          className="animate-particle absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: dot.size,
            height: dot.size,
            background: dot.color,
            animationDelay: `${dot.delay}s`,
            ['--dx' as string]: `${dot.dx}px`,
            ['--dy' as string]: `${dot.dy}px`,
          }}
        />
      ))}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Emojis que suben flotando                                           */
/* ------------------------------------------------------------------ */

const FLOAT_SPOTS = [
  { left: '8%', delay: '0s', size: 'text-lg' },
  { left: '80%', delay: '0.9s', size: 'text-base' },
  { left: '62%', delay: '1.8s', size: 'text-xl' },
  { left: '26%', delay: '2.6s', size: 'text-sm' },
]

function FloatingEmojis({ personality }: { personality: MascotPersonality }) {
  const emojis = personalityEmojis[personality.id] ?? ['✨']
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
      {FLOAT_SPOTS.map((spot, index) => (
        <span
          key={index}
          className={cn('animate-mascot-float absolute bottom-6 opacity-0', spot.size)}
          style={{ left: spot.left, animationDelay: spot.delay }}
        >
          {emojis[index % emojis.length]}
        </span>
      ))}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Bocadillo                                                           */
/* ------------------------------------------------------------------ */

function MascotBubble({
  text,
  color,
  messageKey,
  className,
}: {
  text: string
  color: string
  messageKey: number
  className?: string
}) {
  return (
    <span
      key={messageKey}
      className={cn('animate-mascot-pop relative inline-block', className)}
    >
      <span
        className="relative block rounded-2xl border-[3px] border-ink px-3.5 py-2.5 font-display text-base leading-tight uppercase tracking-[0.03em] shadow-sticker sm:text-lg"
        style={{ background: color, color: isLightColor(color) ? '#0B0B0D' : '#F4F0E8' }}
      >
        {text}
        {/* Rabito del bocadillo */}
        <span
          aria-hidden
          className="absolute -bottom-2 left-6 size-3.5 rotate-45 border-b-[3px] border-r-[3px] border-ink"
          style={{ background: color }}
        />
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Escenario principal (HOME)                                          */
/* ------------------------------------------------------------------ */

export function MascotStage({ className }: { className?: string }) {
  const { personality, line, isReaction } = useMascotLine()
  const index = useMascot((s) => s.index)
  const burst = useMascot((s) => s.burst)
  const messageKey = useMascot((s) => s.messageKey)
  const next = useMascot((s) => s.next)
  const select = useMascot((s) => s.select)

  const surprise = () => {
    let random = Math.floor(Math.random() * mascotPersonalities.length)
    if (random === index) random = (random + 1) % mascotPersonalities.length
    select(random)
  }

  return (
    <section className={cn('px-4 sm:px-6', className)} aria-label="La Burger del Parche">
      <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-carbon p-5 sm:p-7">
        {/* Fondo de actitud */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full opacity-25 blur-3xl transition-colors duration-500"
          style={{ background: personality.color }}
        />
        <div className="texture-halftone pointer-events-none absolute inset-0 opacity-30" />

        <div className="relative grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-10">
          {/* ---------------- Mascota ---------------- */}
          <div className="mx-auto shrink-0">
            <button
              type="button"
              onClick={next}
              aria-label={`La Burger del Parche: ${personality.name}. Toca para cambiar de actitud`}
              className="group relative grid size-44 place-items-center rounded-full transition-transform duration-200 hover:scale-[1.03] active:scale-95 sm:size-56"
            >
              {/* Aura de actitud */}
              <span
                aria-hidden
                className="absolute inset-0 rounded-full opacity-25 transition-colors duration-500"
                style={{ background: personality.color }}
              />

              {/* Onda al tocar */}
              <span
                key={`ripple-${burst}`}
                aria-hidden
                className="animate-mascot-ripple pointer-events-none absolute inset-0 rounded-full border-[3px]"
                style={{ borderColor: personality.color }}
              />

              {/* Flotación continua + shake de reacción + pop de actitud + rebote al tocar */}
              <span className="animate-mascot-idle relative block size-full">
                <span
                  key={`shake-${messageKey}`}
                  className={cn('block size-full', isReaction && 'animate-mascot-shake')}
                >
                  <span key={personality.id} className="animate-mascot-pop block size-full">
                    <span key={burst} className="animate-mascot-bounce block size-full p-2">
                      <MascotFigure
                        personality={personality}
                        className="size-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                      />
                    </span>
                  </span>
                </span>
              </span>

              <FloatingEmojis personality={personality} />
              <MascotParticles burst={burst} color={personality.color} />
            </button>
          </div>

          {/* ---------------- Texto ---------------- */}
          <div className="min-w-0 text-center sm:text-left">
            <p className="font-display text-[11px] uppercase tracking-[0.24em] text-orange">
              La Burger del Parche
            </p>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <h2 className="font-display text-3xl leading-none text-bone sm:text-4xl">
                {personality.name}
              </h2>
              <span className="text-2xl" aria-hidden>
                {personality.emoji}
              </span>
            </div>

            <div className="mt-3 flex justify-center sm:justify-start">
              <MascotBubble text={line} color={personality.color} messageKey={messageKey} />
            </div>

            <p className="mt-4 text-sm text-ash">{personality.description}</p>

            {/* Selector de actitud con emoji */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {mascotPersonalities.map((item, i) => {
                const active = i === index
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => select(i)}
                    aria-label={`Actitud ${item.name}`}
                    aria-current={active}
                    title={item.name}
                    className={cn(
                      'flex items-center gap-1.5 rounded-2xl border px-2.5 py-1.5 text-lg leading-none transition-all duration-200 active:scale-95',
                      active
                        ? 'scale-105 border-transparent text-ink shadow-sticker'
                        : 'border-white/15 bg-white/[0.03] opacity-70 hover:-translate-y-0.5 hover:opacity-100',
                    )}
                    style={active ? { background: item.color } : undefined}
                  >
                    <span aria-hidden>{item.emoji}</span>
                  </button>
                )
              })}

              <button
                type="button"
                onClick={surprise}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/[0.04] px-3 py-2 font-display text-[10px] uppercase tracking-wide text-bone transition hover:-translate-y-0.5 hover:border-orange/60 hover:text-orange active:scale-95"
              >
                <Sparkles className="size-3.5" /> Sorpréndeme
              </button>
            </div>

            <p className="mt-3 font-display text-[10px] uppercase tracking-[0.18em] text-concrete">
              Toca la burger para cambiar de actitud
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Acompañante flotante (resto de la app)                              */
/* ------------------------------------------------------------------ */

export function MascotCompanion() {
  const { personality, line, isReaction } = useMascotLine()
  const index = useMascot((s) => s.index)
  const burst = useMascot((s) => s.burst)
  const messageKey = useMascot((s) => s.messageKey)
  const next = useMascot((s) => s.next)
  const clearMessage = useMascot((s) => s.clearMessage)
  const { pathname } = useLocation()

  // En Home manda el escenario grande, aquí no hace falta.
  const hidden = pathname === '/'

  // Los mensajes reactivos se van solos.
  useEffect(() => {
    if (!isReaction) return
    const timer = setTimeout(clearMessage, 7000)
    return () => clearTimeout(timer)
  }, [isReaction, messageKey, clearMessage])

  if (hidden || !isReaction) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[132px] z-40 px-3 lg:bottom-6 lg:left-auto lg:right-6 lg:inset-x-auto lg:w-[340px] lg:px-0">
      <div className="animate-mascot-pop pointer-events-auto mx-auto flex max-w-md items-end gap-2.5 rounded-3xl border border-white/10 bg-carbon/95 p-3 shadow-pop backdrop-blur-xl">
        <button
          type="button"
          onClick={next}
          aria-label={`La Burger del Parche: ${personality.name}. Toca para cambiar de actitud`}
          className="relative grid size-14 shrink-0 place-items-center rounded-2xl transition-transform duration-200 active:scale-90"
          style={{ background: `${personality.color}22` }}
        >
          <span
            key={`ripple-${burst}`}
            aria-hidden
            className="animate-mascot-ripple pointer-events-none absolute inset-0 rounded-2xl border-2"
            style={{ borderColor: personality.color }}
          />
          <span className="animate-mascot-idle block size-12">
            <span
              key={`shake-${messageKey}`}
              className={cn('block size-full', isReaction && 'animate-mascot-shake')}
            >
              <span key={burst} className="animate-mascot-bounce block size-full">
                <MascotFigure personality={personality} className="size-full" />
              </span>
            </span>
          </span>
          <MascotParticles burst={burst} color={personality.color} />
        </button>

        <MascotBubble
          text={line}
          color={personality.color}
          messageKey={messageKey}
          className="min-w-0 flex-1"
        />

        <button
          type="button"
          onClick={clearMessage}
          aria-label="Cerrar mensaje de la mascota"
          className="mb-1 shrink-0 text-concrete transition hover:text-bone"
        >
          <X className="size-4" />
        </button>
      </div>
      <span className="sr-only">
        Actitud {index + 1} de {mascotPersonalities.length}
      </span>
    </div>
  )
}
