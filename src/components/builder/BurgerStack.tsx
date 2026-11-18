import { useId, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { money } from '@/lib/format'
import type { BuilderOption, BuilderSelection, BuilderStepId } from '@/data/builder'

/* ------------------------------------------------------------------ */
/* Visual por opción: la hamburguesa cambia según lo que eligen.       */
/* ------------------------------------------------------------------ */

const bunVisual: Record<
  string,
  { from: string; via: string; to: string; seed: string; seedShape: 'sesame' | 'salt' }
> = {
  bun_brioche: { from: '#f3c46e', via: '#e8ac52', to: '#c9832f', seed: '#fff6df', seedShape: 'sesame' },
  bun_pretzel: { from: '#bb7a3f', via: '#96592a', to: '#6f3f1c', seed: '#f4f0e8', seedShape: 'salt' },
  bun_integral: { from: '#c99e63', via: '#a4783f', to: '#7d582a', seed: '#f2e4c4', seedShape: 'sesame' },
}

const pattyVisual: Record<string, { from: string; via: string; to: string; height: string }> = {
  patty_150: { from: '#8a5430', via: '#5a3320', to: '#2f1a0e', height: 'h-9' },
  patty_200: { from: '#8a5430', via: '#5a3320', to: '#2f1a0e', height: 'h-11' },
  patty_double: { from: '#8a5430', via: '#5a3320', to: '#2f1a0e', height: 'h-9' },
  patty_veggie: { from: '#8fa04a', via: '#63742e', to: '#3c471c', height: 'h-9' },
}

const cheeseVisual: Record<string, { from: string; mid: string; to: string }> = {
  cheese_cheddar: { from: '#ffdd63', mid: '#f5b730', to: '#e08a12' },
  cheese_mozza: { from: '#fffef8', mid: '#f4edd6', to: '#ded1ab' },
  cheese_house: { from: '#ffe694', mid: '#f0c94f', to: '#d19a22' },
}

const sauceVisual: Record<string, { shine: string; base: string; dark: string }> = {
  sauce_house: { shine: '#ff8a5c', base: '#e0442a', dark: '#b52f1c' },
  sauce_bbq: { shine: '#8a5a30', base: '#4d2a12', dark: '#2f180a' },
  sauce_hot: { shine: '#ff6b5a', base: '#d61f1f', dark: '#a31212' },
  sauce_garlic: { shine: '#fffbe8', base: '#f3e4b8', dark: '#dcc48c' },
}

/* Bordes derretidos: un solo trazo con goteos de distinta longitud.
   La loseta vive dentro del viewBox y los goteos se desbordan hacia abajo. */
const CHEESE_PATH =
  'M 14 5 Q 14 0 23 0 L 217 0 Q 226 0 226 5 L 226 22 ' +
  'C 226 33 216 34 214 42 C 212 50 204 47 203 30 L 202 22 ' +
  'C 200 34 190 38 188 47 C 186 56 176 52 174 30 L 173 22 ' +
  'C 170 34 160 36 158 44 C 156 52 148 48 147 30 L 146 22 ' +
  'C 143 32 133 34 131 42 C 129 50 121 46 120 30 L 119 22 ' +
  'L 14 22 Z'

const SAUCE_PATH =
  'M 12 5 Q 12 1 20 1 L 200 1 Q 208 1 208 5 L 208 20 ' +
  'C 208 29 200 29 198 36 C 196 42 188 40 187 27 L 186 20 ' +
  'C 183 28 175 29 173 36 C 171 42 163 40 162 27 L 161 20 ' +
  'C 158 27 150 28 148 34 C 146 40 138 38 137 27 L 136 20 ' +
  'L 12 20 Z'

const HOT_SPECKS = [
  { x: 42, y: 12, r: 2 },
  { x: 78, y: 9, r: 1.6 },
  { x: 116, y: 13, r: 2 },
  { x: 154, y: 10, r: 1.8 },
  { x: 184, y: 14, r: 1.5 },
]

const HERB_SPECKS = [
  { x: 40, y: 11, r: 1.8 },
  { x: 74, y: 9, r: 1.5 },
  { x: 112, y: 12, r: 1.9 },
  { x: 150, y: 9, r: 1.6 },
  { x: 182, y: 13, r: 1.7 },
]

const SEEDS = [
  { left: '22%', top: '26%' },
  { left: '38%', top: '15%' },
  { left: '54%', top: '23%' },
  { left: '68%', top: '37%' },
  { left: '30%', top: '46%' },
  { left: '60%', top: '48%' },
]

/* ------------------------------------------------------------------ */
/* Capas                                                               */
/* ------------------------------------------------------------------ */

function Patty({ visual }: { visual: (typeof pattyVisual)[string] }) {
  return (
    <div
      className={`relative ${visual.height} w-60 rounded-full border-2 border-ink/90`}
      style={{
        backgroundImage: `radial-gradient(ellipse at 50% 22%, ${visual.from}, ${visual.via} 55%, ${visual.to})`,
        boxShadow:
          'inset 0 -8px 12px rgba(0,0,0,0.55), inset 0 5px 8px rgba(255,190,130,0.3), 0 8px 12px rgba(0,0,0,0.45)',
      }}
    >
      <span
        className="absolute inset-0 rounded-full opacity-25"
        style={{
          backgroundImage:
            'repeating-linear-gradient(115deg, rgba(0,0,0,0.55) 0 2px, transparent 2px 15px)',
        }}
      />
      <span className="absolute inset-x-9 top-1.5 h-1.5 rounded-full bg-white/25 blur-[1px]" />
    </div>
  )
}

function Cheese({ visual }: { visual: (typeof cheeseVisual)[string] }) {
  const uid = useId()
  const gradId = `cheese-${uid}`
  return (
    <svg viewBox="0 0 240 24" className="w-60 overflow-visible" aria-hidden focusable="false">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={visual.from} />
          <stop offset="55%" stopColor={visual.mid} />
          <stop offset="100%" stopColor={visual.to} />
        </linearGradient>
      </defs>
      <path
        d={CHEESE_PATH}
        fill={`url(#${gradId})`}
        stroke="#0B0B0D"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Brillos especulares del queso derretido */}
      <ellipse cx="66" cy="9" rx="34" ry="3.4" fill="rgba(255,255,255,0.5)" />
      <ellipse cx="170" cy="10" rx="20" ry="2.4" fill="rgba(255,255,255,0.32)" />
      <ellipse cx="188" cy="33" rx="4.5" ry="7" fill="rgba(255,255,255,0.22)" />
    </svg>
  )
}

function Sauce({ visual, id }: { visual: (typeof sauceVisual)[string]; id: string }) {
  const uid = useId()
  const gradId = `sauce-${uid}`
  return (
    <svg viewBox="0 0 220 22" className="w-52 overflow-visible" aria-hidden focusable="false">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={visual.shine} />
          <stop offset="45%" stopColor={visual.base} />
          <stop offset="100%" stopColor={visual.dark} />
        </linearGradient>
      </defs>
      <path
        d={SAUCE_PATH}
        fill={`url(#${gradId})`}
        stroke="#0B0B0D"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Brillo húmedo */}
      <ellipse cx="58" cy="7" rx="30" ry="2.6" fill="rgba(255,255,255,0.4)" />
      <ellipse cx="150" cy="7" rx="14" ry="1.8" fill="rgba(255,255,255,0.25)" />
      {/* Motas: picante y hierbas */}
      {id === 'sauce_hot' &&
        HOT_SPECKS.map((speck, index) => (
          <circle key={index} cx={speck.x} cy={speck.y} r={speck.r} fill="#7a0f0f" opacity="0.85" />
        ))}
      {id === 'sauce_garlic' &&
        HERB_SPECKS.map((speck, index) => (
          <ellipse key={index} cx={speck.x} cy={speck.y} rx={speck.r} ry={speck.r * 0.6} fill="#7fae4f" opacity="0.9" />
        ))}
    </svg>
  )
}

/** Cada topping con su forma, textura y brillo propios (SVG). */
function Topping({ id }: { id: string }) {
  const uid = useId()
  const shadowId = `tsh-${uid}`
  const shadow = (
    <filter id={shadowId} x="-30%" y="-45%" width="160%" height="200%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.1" floodColor="#000000" floodOpacity="0.45" />
    </filter>
  )

  switch (id) {
    case 'top_bacon': {
      const grad = `bacon-${uid}`
      return (
        <svg viewBox="0 0 224 32" className="w-56 overflow-visible" aria-hidden focusable="false">
          <defs>
            <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e6a079" />
              <stop offset="42%" stopColor="#b8472c" />
              <stop offset="100%" stopColor="#762617" />
            </linearGradient>
            {shadow}
          </defs>
          <g filter={`url(#${shadowId})`}>
            {[7, 16, 25].map((y, index) => {
              const d = `M8 ${y} Q 38 ${y - 7} 70 ${y} T 128 ${y} T 182 ${y} T 216 ${y}`
              return (
                <g
                  key={index}
                  transform={`translate(${index % 2 ? 5 : -5} 0) rotate(${index % 2 ? 1.6 : -1.6} 112 ${y})`}
                >
                  <path d={d} stroke={`url(#${grad})`} strokeWidth="9" fill="none" strokeLinecap="round" />
                  <path
                    d={d}
                    transform="translate(0 -1.8)"
                    stroke="#f4d8be"
                    strokeWidth="2.6"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="14 22"
                    opacity="0.9"
                  />
                  <path
                    d={d}
                    transform="translate(0 2.2)"
                    stroke="#f7e6d2"
                    strokeWidth="1.4"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="9 28"
                    opacity="0.7"
                  />
                  <path
                    d={d}
                    transform="translate(0 -3.2)"
                    stroke="rgba(255,255,255,0.42)"
                    strokeWidth="1"
                    fill="none"
                    strokeLinecap="round"
                  />
                </g>
              )
            })}
          </g>
        </svg>
      )
    }

    case 'top_onion': {
      const grad = `onion-${uid}`
      const ribbons = [
        'M10 20 Q 44 6 78 17 T 146 14 T 212 16',
        'M8 11 Q 46 24 84 12 T 152 19 T 214 12',
        'M14 7 Q 54 18 94 9 T 160 14 T 210 8',
        'M6 24 Q 48 13 96 22 T 170 16 T 216 20',
        'M12 15 Q 52 5 100 15 T 172 11 T 214 15',
      ]
      return (
        <svg viewBox="0 0 224 30" className="w-56 overflow-visible" aria-hidden focusable="false">
          <defs>
            <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#eab86b" />
              <stop offset="50%" stopColor="#b0762f" />
              <stop offset="100%" stopColor="#6f4318" />
            </linearGradient>
            {shadow}
          </defs>
          <g filter={`url(#${shadowId})`}>
            {ribbons.map((d, index) => (
              <g key={index}>
                <path d={d} stroke={`url(#${grad})`} strokeWidth="5.4" fill="none" strokeLinecap="round" />
                <path d={d} stroke="rgba(255,242,214,0.55)" strokeWidth="1.3" fill="none" strokeLinecap="round" />
              </g>
            ))}
          </g>
        </svg>
      )
    }

    case 'top_pickles': {
      const grad = `pickle-${uid}`
      const shade = `pickleShade-${uid}`
      return (
        <svg viewBox="0 0 224 26" className="w-56 overflow-visible" aria-hidden focusable="false">
          <defs>
            <radialGradient id={grad} cx="40%" cy="28%" r="82%">
              <stop offset="0%" stopColor="#cdf08c" />
              <stop offset="45%" stopColor="#7cb63c" />
              <stop offset="85%" stopColor="#4f8a24" />
              <stop offset="100%" stopColor="#336616" />
            </radialGradient>
            <radialGradient id={shade} cx="50%" cy="50%" r="58%">
              <stop offset="62%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.38)" />
            </radialGradient>
            {shadow}
          </defs>
          <g filter={`url(#${shadowId})`}>
            {[26, 72, 118, 164, 210].map((cx, index) => (
              <g key={index} transform={`rotate(${index % 2 ? -7 : 6} ${cx} 13)`}>
                <ellipse cx={cx} cy="13" rx="15" ry="6.2" fill={`url(#${grad})`} stroke="#0B0B0D" strokeWidth="1.4" strokeOpacity="0.55" />
                <ellipse cx={cx} cy="13" rx="15" ry="6.2" fill={`url(#${shade})`} />
                <ellipse cx={cx} cy="13" rx="10.4" ry="3.4" fill="none" stroke="#eefad6" strokeWidth="0.9" opacity="0.45" />
                {[-4.5, 0.5, 5].map((off) => (
                  <path
                    key={off}
                    d={`M${cx + off - 2} 13.6 q 2 -2 4 0`}
                    fill="none"
                    stroke="#2f5c12"
                    strokeWidth="0.8"
                    opacity="0.5"
                  />
                ))}
                <ellipse cx={cx - 5} cy="10.6" rx="4.4" ry="1.5" fill="rgba(255,255,255,0.5)" />
              </g>
            ))}
          </g>
        </svg>
      )
    }

    case 'top_jalapeno': {
      const grad = `jal-${uid}`
      return (
        <svg viewBox="0 0 224 24" className="w-56 overflow-visible" aria-hidden focusable="false">
          <defs>
            <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9fe063" />
              <stop offset="55%" stopColor="#3f8f24" />
              <stop offset="100%" stopColor="#255c14" />
            </linearGradient>
            {shadow}
          </defs>
          <g filter={`url(#${shadowId})`}>
            {[26, 72, 118, 164, 210].map((cx, index) => {
              const up = index % 2 === 0
              const arc = up
                ? `M${cx - 11} 16 Q ${cx} 3 ${cx + 11} 16`
                : `M${cx - 11} 8 Q ${cx} 21 ${cx + 11} 8`
              const inner = up
                ? `M${cx - 6} 15 Q ${cx} 7 ${cx + 6} 15`
                : `M${cx - 6} 9 Q ${cx} 17 ${cx + 6} 9`
              const rim = up
                ? `M${cx - 8} 11 Q ${cx} 4 ${cx + 8} 11`
                : `M${cx - 8} 13 Q ${cx} 20 ${cx + 8} 13`
              return (
                <g key={index}>
                  <path d={arc} fill="none" stroke={`url(#${grad})`} strokeWidth="6.5" strokeLinecap="round" />
                  <path d={inner} fill="none" stroke="#eaf7d2" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
                  <path d={rim} fill="none" stroke="#b02020" strokeWidth="1.6" strokeLinecap="round" opacity="0.65" />
                  <ellipse cx={cx - 4} cy={up ? 9.5 : 14.5} rx="3.2" ry="1.2" fill="rgba(255,255,255,0.5)" />
                </g>
              )
            })}
          </g>
        </svg>
      )
    }

    case 'top_egg': {
      const white = `eggwhite-${uid}`
      const yolk = `yolk-${uid}`
      return (
        <svg viewBox="0 0 224 30" className="w-56 overflow-visible" aria-hidden focusable="false">
          <defs>
            <radialGradient id={white} cx="38%" cy="32%" r="78%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#f4eddc" />
              <stop offset="100%" stopColor="#d9cdb2" />
            </radialGradient>
            <radialGradient id={yolk} cx="36%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#ffe98a" />
              <stop offset="55%" stopColor="#f8b800" />
              <stop offset="100%" stopColor="#dd9200" />
            </radialGradient>
            {shadow}
          </defs>
          <g filter={`url(#${shadowId})`}>
            <path
              d="M42 15 C 42 6, 72 3, 102 5 C 132 3, 162 5, 184 11 C 200 15, 197 23, 176 26 C 148 30, 118 27, 88 26 C 58 25, 42 23, 42 15 Z"
              fill={`url(#${white})`}
              stroke="#0B0B0D"
              strokeWidth="1.8"
              strokeOpacity="0.65"
            />
            <ellipse cx="113" cy="16" rx="15" ry="11" fill="rgba(0,0,0,0.18)" />
            <ellipse cx="112" cy="14.5" rx="15" ry="11.5" fill={`url(#${yolk})`} stroke="#0B0B0D" strokeWidth="1.4" strokeOpacity="0.5" />
            <ellipse cx="106" cy="10" rx="4.6" ry="2.8" fill="rgba(255,255,255,0.7)" />
          </g>
        </svg>
      )
    }

    case 'top_crispy': {
      const grad = `crispy-${uid}`
      const shards = Array.from({ length: 16 }, (_, index) => ({
        x: 6 + ((index * 29) % 200),
        y: 8 + ((index * 13) % 11),
        rot: ((index * 47) % 100) - 50,
      }))
      return (
        <svg viewBox="0 0 224 26" className="w-56 overflow-visible" aria-hidden focusable="false">
          <defs>
            <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f0ca82" />
              <stop offset="55%" stopColor="#d3a353" />
              <stop offset="100%" stopColor="#a97a35" />
            </linearGradient>
            {shadow}
          </defs>
          <g filter={`url(#${shadowId})`}>
            {shards.map((shard, index) => (
              <g key={index} transform={`rotate(${shard.rot} ${shard.x + 5} ${shard.y})`}>
                <path
                  d={`M${shard.x} ${shard.y} q 5 -3.2 10 0`}
                  fill="none"
                  stroke={`url(#${grad})`}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
                <path
                  d={`M${shard.x} ${shard.y - 0.8} q 5 -3.2 10 0`}
                  fill="none"
                  stroke="rgba(255,248,224,0.6)"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                />
              </g>
            ))}
          </g>
        </svg>
      )
    }

    case 'top_mushroom': {
      const grad = `mush-${uid}`
      return (
        <svg viewBox="0 0 224 26" className="w-56 overflow-visible" aria-hidden focusable="false">
          <defs>
            <radialGradient id={grad} cx="38%" cy="28%" r="80%">
              <stop offset="0%" stopColor="#d8b48c" />
              <stop offset="55%" stopColor="#9c7854" />
              <stop offset="100%" stopColor="#5c4029" />
            </radialGradient>
            {shadow}
          </defs>
          <g filter={`url(#${shadowId})`}>
            {[30, 82, 134, 186].map((cx, index) => (
              <g key={index} transform={`rotate(${index % 2 ? 7 : -7} ${cx} 13)`}>
                <ellipse cx={cx} cy="13" rx="16" ry="9" fill={`url(#${grad})`} stroke="#0B0B0D" strokeWidth="1.6" strokeOpacity="0.6" />
                <ellipse cx={cx} cy="13.5" rx="8.6" ry="4.4" fill="#4a3320" opacity="0.85" />
                {[-2.6, 0, 2.6].map((offset) => (
                  <line
                    key={offset}
                    x1={cx + offset}
                    y1="13.5"
                    x2={cx + offset * 1.9}
                    y2="10"
                    stroke="#2f2013"
                    strokeWidth="0.9"
                    opacity="0.7"
                  />
                ))}
                <ellipse cx={cx - 5} cy="8.6" rx="5.4" ry="2.3" fill="rgba(255,255,255,0.4)" />
              </g>
            ))}
          </g>
        </svg>
      )
    }

    case 'top_guacamole': {
      const grad = `guac-${uid}`
      return (
        <svg viewBox="0 0 224 24" className="w-56 overflow-visible" aria-hidden focusable="false">
          <defs>
            <radialGradient id={grad} cx="38%" cy="22%" r="88%">
              <stop offset="0%" stopColor="#c4ee82" />
              <stop offset="55%" stopColor="#7fb03f" />
              <stop offset="100%" stopColor="#436b1d" />
            </radialGradient>
            {shadow}
          </defs>
          <g filter={`url(#${shadowId})`}>
            {[30, 86, 142, 196].map((cx, index) => (
              <g key={index}>
                <path
                  d={`M${cx - 17} 19 C ${cx - 20} 11, ${cx - 11} 5, ${cx - 3} 8 C ${cx + 3} 4, ${cx + 12} 6, ${cx + 15} 12 C ${cx + 20} 14, ${cx + 18} 19, ${cx + 12} 20 L ${cx - 12} 20 Z`}
                  fill={`url(#${grad})`}
                  stroke="#0B0B0D"
                  strokeWidth="1.6"
                  strokeOpacity="0.6"
                />
                <ellipse cx={cx - 5} cy="10" rx="6" ry="2.4" fill="rgba(255,255,255,0.45)" />
                <circle cx={cx + 6} cy="15" r="1.7" fill="#e85d3a" />
                <circle cx={cx + 6} cy="15" r="0.7" fill="#ffb199" opacity="0.8" />
                <circle cx={cx - 8} cy="15.5" r="1.3" fill="#f4f0e8" opacity="0.65" />
                <circle cx={cx + 1} cy="17.5" r="1.1" fill="#3f6b1c" opacity="0.75" />
              </g>
            ))}
          </g>
        </svg>
      )
    }

    default:
      return <div className="h-4 w-56 rounded-full border-2 border-ink/80 bg-[#b98a5a]" />
  }
}

/* ------------------------------------------------------------------ */
/* Vaho (una sola vez por cambio, sin bucles)                          */
/* ------------------------------------------------------------------ */

function Steam() {
  return (
    <div aria-hidden className="pointer-events-none absolute -top-7 left-1/2 flex -translate-x-1/2 gap-6">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="h-10 w-3 rounded-full bg-white/30 blur-[3px]"
          initial={{ opacity: 0, y: 14, scaleY: 0.5 }}
          animate={{ opacity: [0, 0.5, 0], y: -38, scaleY: 1.3 }}
          transition={{ duration: 1.6, delay: index * 0.14, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

/** Chispas que estallan una sola vez al ensamblar. */
function SparkBurst() {
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
      {Array.from({ length: 12 }).map((_, index) => {
        const angle = (index / 12) * Math.PI * 2
        return (
          <motion.span
            key={index}
            className="absolute size-1.5 rounded-full bg-yellow shadow-volt"
            initial={{ opacity: 0.95, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              x: Math.cos(angle) * 96,
              y: Math.sin(angle) * 96,
              scale: 0.3,
            }}
            transition={{ duration: 0.72, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Capa interactiva                                                    */
/* ------------------------------------------------------------------ */

interface StackItem {
  key: string
  step: BuilderStepId
  option: BuilderOption
  node: ReactNode
}

function StackLayer({
  item,
  active,
  dimmed,
  delay,
  onEnter,
  onLeave,
  onActivate,
}: {
  item: StackItem
  active: boolean
  dimmed: boolean
  delay: number
  onEnter: () => void
  onLeave: () => void
  onActivate: () => void
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -34, scale: 0.9 }}
      animate={{
        opacity: dimmed ? 0.78 : 1,
        y: 0,
        scale: active ? 1.06 : 1,
        x: active ? 12 : 0,
      }}
      exit={{ opacity: 0, y: -34, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28, delay }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onClick={onActivate}
      aria-label={item.option.name}
      className="relative -mt-1 cursor-pointer appearance-none border-0 bg-transparent p-0 outline-none"
    >
      {item.node}
    </motion.button>
  )
}

/* ------------------------------------------------------------------ */
/* Componente principal                                                */
/* ------------------------------------------------------------------ */

export function BurgerStack({
  selection,
  onSelectStep,
  assembleGen = 0,
  hideLabelOnMobile = false,
}: {
  selection: BuilderSelection
  onSelectStep?: (stepId: BuilderStepId) => void
  /** Al cambiar, la burger se vuelve a ensamblar capa por capa. */
  assembleGen?: number
  /** Oculta la etiqueta en móvil para ahorrar alto (útil en el layout compacto). */
  hideLabelOnMobile?: boolean
}) {
  const reduced = useReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  const bun = bunVisual[selection.bun.id] ?? bunVisual.bun_brioche
  const patty = pattyVisual[selection.patty.id] ?? pattyVisual.patty_150
  const cheese = cheeseVisual[selection.cheese.id]
  const sauce = sauceVisual[selection.sauce.id] ?? sauceVisual.sauce_house
  const showCheese = selection.cheese.id !== 'cheese_none' && Boolean(cheese)
  const pattyCount = selection.patty.patties ?? 1

  const items: StackItem[] = []

  items.push({
    key: 'bottom-bun',
    step: 'bun',
    option: selection.bun,
    node: (
      <div
        className="h-10 w-56 rounded-b-[46px] rounded-t-md border-2 border-ink/90"
        style={{
          backgroundImage: `radial-gradient(ellipse at 50% 0%, ${bun.from}, ${bun.via} 55%, ${bun.to})`,
          boxShadow:
            'inset 0 -10px 14px rgba(0,0,0,0.3), inset 0 6px 8px rgba(255,255,255,0.18), 0 6px 10px rgba(0,0,0,0.4)',
        }}
      />
    ),
  })

  for (let index = 0; index < pattyCount; index++) {
    items.push({
      key: `patty-${selection.patty.id}-${index}`,
      step: 'patty',
      option: selection.patty,
      node: <Patty visual={patty} />,
    })
    if (showCheese && cheese) {
      items.push({
        key: `cheese-${selection.cheese.id}-${index}`,
        step: 'cheese',
        option: selection.cheese,
        node: <Cheese visual={cheese} />,
      })
    }
  }

  selection.toppings.forEach((topping) => {
    items.push({
      key: topping.id,
      step: 'toppings',
      option: topping,
      node: <Topping id={topping.id} />,
    })
  })

  items.push({
    key: `sauce-${selection.sauce.id}`,
    step: 'sauce',
    option: selection.sauce,
    node: <Sauce visual={sauce} id={selection.sauce.id} />,
  })

  items.push({
    key: `bun-${selection.bun.id}`,
    step: 'bun',
    option: selection.bun,
    node: (
      <div
        className="relative h-20 w-56 rounded-t-[110px] rounded-b-lg border-2 border-ink/90"
        style={{
          backgroundImage: `radial-gradient(ellipse at 38% 22%, #f9db96, ${bun.from} 30%, ${bun.via} 62%, ${bun.to})`,
          boxShadow:
            'inset 0 -12px 18px rgba(0,0,0,0.28), inset 0 10px 16px rgba(255,255,255,0.4), 0 8px 14px rgba(0,0,0,0.4)',
        }}
      >
        {SEEDS.map((seed, index) => (
          <span
            key={index}
            className={
              bun.seedShape === 'salt'
                ? 'absolute size-1.5 rotate-45 rounded-[2px]'
                : 'absolute size-1.5 rounded-full'
            }
            style={{
              left: seed.left,
              top: seed.top,
              backgroundColor: bun.seed,
              boxShadow: '0 1px 1px rgba(0,0,0,0.35)',
            }}
          />
        ))}
        <span className="absolute left-8 top-3 h-3 w-14 -rotate-12 rounded-full bg-white/50 blur-[3px]" />
      </div>
    ),
  })

  const signature = [
    selection.bun.id,
    selection.patty.id,
    selection.cheese.id,
    selection.sauce.id,
    ...selection.toppings.map((topping) => topping.id),
  ].join('|')

  const hoveredItem = items.find((item) => item.key === hovered) ?? null

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reduced) return
    const element = stageRef.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    element.style.transform = `perspective(900px) rotateX(${(-py * 12).toFixed(2)}deg) rotateY(${(px * 15).toFixed(2)}deg)`
  }

  const resetTilt = () => {
    if (stageRef.current) stageRef.current.style.transform = 'perspective(900px)'
  }

  const activate = (item: StackItem) => {
    onSelectStep?.(item.step)
  }

  return (
    <div className="flex flex-col items-center">
      {/* Etiqueta de la capa enfocada */}
      <div
        className={`mb-1 h-7 items-center justify-center px-2 text-center ${
          hideLabelOnMobile ? 'hidden sm:flex' : 'flex'
        }`}
      >
        <AnimatePresence mode="wait">
          {hoveredItem ? (
            <motion.span
              key={hoveredItem.key}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.16 }}
              className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-bold text-bone"
            >
              <span className="mr-1">{hoveredItem.option.emoji}</span>
              {hoveredItem.option.name}
              <span className="ml-1.5 text-red">
                {hoveredItem.option.price > 0 ? `+${money(hoveredItem.option.price)}` : 'Incluido'}
              </span>
            </motion.span>
          ) : (
            <motion.span
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-concrete"
            >
              Toca las capas para editarlas
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Escenario 3D */}
      <div
        ref={stageRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        className="relative grid w-full place-items-center py-4 transition-transform duration-200 ease-out will-change-transform"
        style={{ transform: 'perspective(900px)' }}
      >
        {/* Foco cálido */}
        <div
          aria-hidden
          className="pointer-events-none absolute size-64 rounded-full bg-orange/25 blur-3xl"
        />

        <div className="relative flex flex-col-reverse items-center drop-shadow-[0_24px_30px_rgba(0,0,0,0.5)]">
          <Steam key={signature} />
          {assembleGen > 0 && <SparkBurst key={`burst-${assembleGen}`} />}

          {/* Plato */}
          <span
            aria-hidden
            className="absolute -bottom-1 left-1/2 h-10 w-64 -translate-x-1/2 rounded-[50%] border border-white/10"
            style={{
              backgroundImage: 'radial-gradient(ellipse at 50% 30%, #2c2d33, #14151a 72%)',
              boxShadow: '0 22px 34px rgba(0,0,0,0.6), inset 0 2px 6px rgba(255,255,255,0.08)',
            }}
          />

          <AnimatePresence key={assembleGen}>
            {items.map((item, index) => (
              <StackLayer
                key={item.key}
                item={item}
                active={hovered === item.key}
                dimmed={Boolean(hovered) && hovered !== item.key}
                delay={index * 0.05}
                onEnter={() => setHovered(item.key)}
                onLeave={() => setHovered((current) => (current === item.key ? null : current))}
                onActivate={() => activate(item)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
