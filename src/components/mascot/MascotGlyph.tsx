import type { MascotEyes, MascotOutfit, MascotPersonality, MascotPose } from '@/data/mascot'

/* ------------------------------------------------------------------ */
/* Paleta del personaje                                                */
/* ------------------------------------------------------------------ */

const OUT = '#0B0B0D'
const BUN = '#E9A63C'
const BUN_LIGHT = '#F5C46B'
const CHEESE = '#FFD21F'
const LETTUCE = '#A8E600'
const PATTY = '#5A3220'
const PATTY_DARK = '#3A1E12'
const GLOVE = '#F4F0E8'
const GOLD = '#FFC531'

/* ------------------------------------------------------------------ */
/* Ropa: cada actitud viste según su personalidad                      */
/* ------------------------------------------------------------------ */

const OUTFITS: Record<MascotOutfit, { main: string; accent: string; detail: string }> = {
  jeans: { main: '#2F5FA8', accent: '#5A8FE0', detail: '#E4E9F2' }, // jean clásico
  ripped: { main: '#1B1B1F', accent: '#3A3B42', detail: '#FF2D7A' }, // jean roto + detalles
  cargo: { main: '#4E5A32', accent: '#6C7C46', detail: '#2E3620' }, // cargo militar
  flame: { main: '#E4002B', accent: '#FF6A00', detail: '#FFD21F' }, // shorts de fuego
  uniform: { main: '#1F2A44', accent: '#D8DEE9', detail: '#FFD21F' }, // uniforme reflectivo
  messy: { main: '#8A7B4A', accent: '#A99A66', detail: '#E4002B' }, // short con mancha
}

function Outfit({
  outfit,
  legTop,
  legBottom,
  sneakerY,
  color,
}: {
  outfit: MascotOutfit
  legTop: number
  legBottom: number
  sneakerY: number
  color: string
}) {
  const { main, accent, detail } = OUTFITS[outfit]
  const legs = [84, 116]
  const legW = 28
  const legY = legTop - 8
  const legH = legBottom - legY + 10

  return (
    <g>
      {/* Piernas vestidas */}
      {legs.map((x) => (
        <rect
          key={x}
          x={x - legW / 2}
          y={legY}
          width={legW}
          height={legH}
          rx="10"
          fill={main}
          stroke={OUT}
          strokeWidth="5.5"
        />
      ))}

      {/* Basta / ruedo inferior */}
      {outfit === 'jeans' &&
        legs.map((x) => (
          <rect
            key={x}
            x={x - legW / 2}
            y={legBottom - 6}
            width={legW}
            height="11"
            rx="5"
            fill={accent}
            stroke={OUT}
            strokeWidth="4"
          />
        ))}

      {/* Rotos del jean + cadena colgando */}
      {outfit === 'ripped' && (
        <g>
          <ellipse cx="78" cy={legTop + 14} rx="7" ry="5" fill={BUN} stroke={OUT} strokeWidth="3.5" />
          <ellipse cx="122" cy={legTop + 24} rx="6" ry="4.5" fill={BUN} stroke={OUT} strokeWidth="3.5" />
          <path
            d={`M118 ${legTop + 2}c8 10 10 18 6 26`}
            stroke={GOLD}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M118 ${legTop + 2}c8 10 10 18 6 26`}
            stroke={OUT}
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="3 3"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Bolsillos cargo */}
      {outfit === 'cargo' &&
        legs.map((x) => (
          <rect
            key={x}
            x={x - 9}
            y={legTop + 10}
            width="18"
            height="16"
            rx="4"
            fill={accent}
            stroke={OUT}
            strokeWidth="4"
          />
        ))}

      {/* Llamas en el ruedo */}
      {outfit === 'flame' &&
        legs.map((x) => (
          <path
            key={x}
            d={`M${x - legW / 2} ${legBottom + 4} l5 12 5-8 5 11 5-11 5 8 5-12z`}
            fill={accent}
            stroke={OUT}
            strokeWidth="4"
            strokeLinejoin="round"
          />
        ))}

      {/* Franjas reflectivas del uniforme */}
      {outfit === 'uniform' &&
        legs.map((x) => (
          <g key={x}>
            <rect x={x - legW / 2} y={legTop + 12} width={legW} height="6" fill={accent} />
            <rect x={x - legW / 2} y={legTop + 24} width={legW} height="6" fill={accent} />
            <rect x={x - legW / 2} y={legTop + 12} width={legW} height="6" fill="none" stroke={OUT} strokeWidth="2.5" />
            <rect x={x - legW / 2} y={legTop + 24} width={legW} height="6" fill="none" stroke={OUT} strokeWidth="2.5" />
          </g>
        ))}

      {/* Mancha de comida en el short */}
      {outfit === 'messy' && (
        <g fill={detail} stroke={OUT} strokeWidth="3">
          <ellipse cx="78" cy={legTop + 20} rx="7" ry="5" />
          <circle cx="86" cy={legTop + 26} r="2.2" />
          <ellipse cx="124" cy={legTop + 34} rx="5" ry="3.5" />
        </g>
      )}

      {/* Cinturón con hebilla */}
      <rect
        x="62"
        y={legY + 2}
        width="76"
        height="12"
        rx="5"
        fill="#1B1B1F"
        stroke={OUT}
        strokeWidth="4.5"
      />
      <rect x="92" y={legY} width="16" height="16" rx="4" fill={GOLD} stroke={OUT} strokeWidth="4" />

      {/* Tenis */}
      <g>
        <rect x="52" y={sneakerY} width="46" height="28" rx="13" fill={GLOVE} stroke={OUT} strokeWidth="5.5" />
        <rect x="102" y={sneakerY} width="46" height="28" rx="13" fill={GLOVE} stroke={OUT} strokeWidth="5.5" />
        <path d={`M60 ${sneakerY + 16}h32M110 ${sneakerY + 16}h32`} stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d={`M62 ${sneakerY + 5}h26M112 ${sneakerY + 5}h26`} stroke={OUT} strokeWidth="3" strokeLinecap="round" opacity="0.35" />
      </g>
    </g>
  )
}

/* ------------------------------------------------------------------ */
/* Poses: brazos + manos                                               */
/* ------------------------------------------------------------------ */

type HandType = 'fist' | 'thumb' | 'open' | 'point' | 'grip'

interface Pose {
  leftArm: string
  rightArm: string
  leftHand: { x: number; y: number; type: HandType }
  rightHand: { x: number; y: number; type: HandType }
}

const POSES: Record<MascotPose, Pose> = {
  // Tranqui: pulgar arriba y la otra mano relajada.
  thumbsUp: {
    leftArm: 'M50 152C32 162 22 178 22 194',
    rightArm: 'M150 150c26 4 44-10 42-36',
    leftHand: { x: 22, y: 198, type: 'fist' },
    rightHand: { x: 192, y: 112, type: 'thumb' },
  },
  // Bandida: sopla un beso con una mano en la cadera.
  kiss: {
    leftArm: 'M50 152C34 158 26 170 30 184',
    rightArm: 'M152 148c24-4 32-22 22-40',
    leftHand: { x: 32, y: 188, type: 'fist' },
    rightHand: { x: 174, y: 106, type: 'open' },
  },
  // Pesada: los dos puños arriba.
  fists: {
    leftArm: 'M50 150C28 146 14 130 16 108',
    rightArm: 'M150 150c22-4 36-20 34-42',
    leftHand: { x: 16, y: 104, type: 'fist' },
    rightHand: { x: 184, y: 104, type: 'fist' },
  },
  // En Llamas: las dos manos abiertas, como soltando calor.
  raised: {
    leftArm: 'M50 148C26 138 12 116 18 90',
    rightArm: 'M150 148c24-10 38-32 32-58',
    leftHand: { x: 18, y: 86, type: 'open' },
    rightHand: { x: 182, y: 86, type: 'open' },
  },
  // Delivery: señala pa' adelante mientras sostiene la caja.
  pointing: {
    leftArm: 'M50 154C34 160 26 172 28 186',
    rightArm: 'M148 146c26 4 40-6 44-22',
    leftHand: { x: 30, y: 190, type: 'grip' },
    rightHand: { x: 190, y: 122, type: 'point' },
  },
  // Hambrienta: una mano en la panza, la otra en las papas.
  munching: {
    leftArm: 'M50 154C36 162 34 174 40 186',
    rightArm: 'M150 150c16 6 22 16 22 28',
    leftHand: { x: 42, y: 190, type: 'fist' },
    rightHand: { x: 172, y: 180, type: 'grip' },
  },
}

/** Brazo o pierna con contorno: trazo grueso oscuro + trazo fino de color. */
function Limb({ d, color, width = 15 }: { d: string; color: string; width?: number }) {
  return (
    <g>
      <path d={d} stroke={OUT} strokeWidth={width + 7} strokeLinecap="round" fill="none" />
      <path d={d} stroke={color} strokeWidth={width} strokeLinecap="round" fill="none" />
    </g>
  )
}

function Hand({
  x,
  y,
  type,
  color,
  ring,
}: {
  x: number
  y: number
  type: HandType
  color: string
  ring?: boolean
}) {
  const r = 15
  return (
    <g>
      {type === 'thumb' && (
        <rect x={x - 7} y={y - 34} width="14" height="26" rx="7" fill={GLOVE} stroke={OUT} strokeWidth="5" />
      )}
      {type === 'point' && (
        <g>
          <path d={`M${x} ${y - 10} L${x + 6} ${y - 30}`} stroke={GLOVE} strokeWidth="12" strokeLinecap="round" />
          <path d={`M${x} ${y - 10} L${x + 6} ${y - 30}`} stroke={OUT} strokeWidth="4.5" strokeLinecap="round" opacity="0.35" />
        </g>
      )}
      <circle cx={x} cy={y} r={r} fill={GLOVE} stroke={OUT} strokeWidth="5.5" />
      {type === 'open' ? (
        <g stroke={OUT} strokeWidth="3" strokeLinecap="round" opacity="0.45">
          <path d={`M${x - 7} ${y - 10}v9`} />
          <path d={`M${x} ${y - 12}v11`} />
          <path d={`M${x + 7} ${y - 10}v9`} />
        </g>
      ) : (
        <path d={`M${x - 7} ${y + 2}h14`} stroke={OUT} strokeWidth="3" strokeLinecap="round" opacity="0.35" />
      )}
      {ring && (
        <circle cx={x} cy={y + 5} r="9" fill="none" stroke={GOLD} strokeWidth="4" />
      )}
      <circle cx={x - 4} cy={y - 5} r="2.6" fill={color} opacity="0.5" />
    </g>
  )
}

/* ------------------------------------------------------------------ */
/* Expresiones                                                         */
/* ------------------------------------------------------------------ */

function Eyes({ type, color, lashes }: { type: MascotEyes; color: string; lashes?: boolean }) {
  if (type === 'fire') {
    return (
      <g>
        <path
          d="M64 90c-4-12 2-21 8-26-1 7 4 10 6 5 3-5 1-12 5-18 2 11 11 15 11 26 0 9-7 15-15 15s-15-6-15-15z"
          fill="#FF6A00"
          stroke={OUT}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M108 90c-4-12 2-21 8-26-1 7 4 10 6 5 3-5 1-12 5-18 2 11 11 15 11 26 0 9-7 15-15 15s-15-6-15-15z"
          fill="#FF6A00"
          stroke={OUT}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="M74 90c-1-6 1-10 4-12-1 4 3 5 4 2 1-3 0-6 3-9 1 6 5 8 5 14 0 5-3 8-8 8s-8-3-8-3z" fill={CHEESE} />
        <path d="M118 90c-1-6 1-10 4-12-1 4 3 5 4 2 1-3 0-6 3-9 1 6 5 8 5 14 0 5-3 8-8 8s-8-3-8-3z" fill={CHEESE} />
        <path d="M56 58l20 9M144 58l-20 9" stroke={OUT} strokeWidth="6.5" strokeLinecap="round" />
      </g>
    )
  }

  const lidsClosed = type === 'chill' || type === 'focused'
  const winking = type === 'flirty'
  const pupilY = type === 'crazy' ? 84 : 82
  const pupilR = type === 'crazy' ? 9.5 : 7

  return (
    <g>
      {/* cejas */}
      {type === 'serious' ? (
        <path d="M60 56l22 12M140 56l-22 12" stroke={OUT} strokeWidth="7" strokeLinecap="round" />
      ) : type === 'crazy' ? (
        <path d="M62 52c8-8 18-8 26 0M112 52c8-8 18-8 26 0" stroke={OUT} strokeWidth="5.5" strokeLinecap="round" fill="none" />
      ) : winking ? (
        <path d="M64 58c8-6 18-6 26-1" stroke={OUT} strokeWidth="5.5" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M64 58c8-5 18-5 26 0M110 58c8-5 18-5 26 0" stroke={OUT} strokeWidth="5.5" strokeLinecap="round" fill="none" />
      )}

      {/* Ojo izquierdo (siempre abierto) */}
      <ellipse cx="78" cy="82" rx="17" ry="18" fill="#fff" stroke={OUT} strokeWidth="5.5" />
      {lidsClosed && (
        <path d="M61 74c8 7 26 7 34 0" stroke={OUT} strokeWidth="5.5" strokeLinecap="round" fill="none" />
      )}
      <circle cx="78" cy={pupilY} r={pupilR} fill={OUT} />
      <circle cx="81" cy={pupilY - 3} r="2.6" fill="#fff" />

      {/* Ojo derecho: la Bandida lo tiene cerrado en un guiño */}
      {winking ? (
        <g>
          <path d="M106 84c9-10 21-10 30 0" stroke={OUT} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <path d="M108 74c6-4 14-4 20 0" stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.9" />
        </g>
      ) : (
        <g>
          <ellipse cx="122" cy="82" rx="17" ry="18" fill="#fff" stroke={OUT} strokeWidth="5.5" />
          {lidsClosed && (
            <path d="M105 74c8 7 26 7 34 0" stroke={OUT} strokeWidth="5.5" strokeLinecap="round" fill="none" />
          )}
          <circle cx="122" cy={pupilY} r={pupilR} fill={OUT} />
          <circle cx="125" cy={pupilY - 3} r="2.6" fill="#fff" />
        </g>
      )}

      {/* pestañas */}
      {lashes && (
        <g stroke={OUT} strokeWidth="3.5" strokeLinecap="round">
          <path d="M62 68l-7-5M66 62l-5-7M72 58l-2-8" />
          {!winking && <path d="M138 68l7-5M134 62l5-7M128 58l2-8" />}
          {winking && <path d="M136 80l8-4M134 74l6-7" />}
        </g>
      )}

      {type === 'serious' && (
        <path d="M100 64l4 6-4 6-4-6z" fill={color} stroke={OUT} strokeWidth="2.5" strokeLinejoin="round" />
      )}
    </g>
  )
}

function Mouth({ type }: { type: MascotEyes }) {
  if (type === 'crazy' || type === 'flirty') {
    return (
      <g>
        <path d="M82 98c7-5 29-5 36 0 3 10-7 17-18 17s-21-7-18-17z" fill={OUT} />
        <path d="M91 110c4 7 13 9 20 4-2 7-9 10-15 8s-8-8-5-12z" fill="#FF4D6D" />
      </g>
    )
  }
  if (type === 'fire') {
    return (
      <g>
        <path d="M80 97h40c0 13-9 20-20 20s-20-7-20-20z" fill={OUT} />
        <path d="M82 97h36v5H82z" fill={GLOVE} />
      </g>
    )
  }
  if (type === 'serious') {
    return <path d="M86 106h28" stroke={OUT} strokeWidth="7" strokeLinecap="round" />
  }
  if (type === 'focused') {
    return <path d="M88 101c6 6 18 6 24 0" stroke={OUT} strokeWidth="6.5" strokeLinecap="round" fill="none" />
  }
  return <path d="M86 98c5 9 23 9 28 0" stroke={OUT} strokeWidth="6.5" strokeLinecap="round" fill="none" />
}

/* ------------------------------------------------------------------ */
/* Extras: detalles de personalidad                                    */
/* ------------------------------------------------------------------ */

function Heart({ x, y, size = 1, color }: { x: number; y: number; size?: number; color: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${size})`}
      d="M0 4C-2 0-8 1-8 6c0 5 8 10 8 10s8-5 8-10c0-5-6-6-8-2z"
      fill={color}
      stroke={OUT}
      strokeWidth="2.5"
    />
  )
}

function Sparkle({ x, y, size = 1, color }: { x: number; y: number; size?: number; color: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${size})`}
      d="M0-9l2.6 6.4L9 0l-6.4 2.6L0 9l-2.6-6.4L-9 0l6.4-2.6z"
      fill={color}
      stroke={OUT}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  )
}

function Extras({
  personality,
  pattyTop,
}: {
  personality: MascotPersonality
  pattyTop: number
}) {
  const { extras, color } = personality
  const has = (extra: string) => extras.includes(extra as never)

  return (
    <g>
      {/* Cadena de oro */}
      {has('chain') && (
        <g>
          <path d="M56 124C70 146 130 146 144 124" stroke={OUT} strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M56 124C70 146 130 146 144 124" stroke={GOLD} strokeWidth="4" fill="none" strokeLinecap="round" />
          <g fill={OUT} opacity="0.5">
            <circle cx="70" cy="138" r="2.2" />
            <circle cx="86" cy="144" r="2.2" />
            <circle cx="114" cy="144" r="2.2" />
            <circle cx="130" cy="138" r="2.2" />
          </g>
          <circle cx="100" cy="150" r="7" fill={GOLD} stroke={OUT} strokeWidth="4" />
        </g>
      )}

      {/* Aretes */}
      {has('earrings') && (
        <g fill="none" stroke={GOLD} strokeWidth="4.5">
          <circle cx="34" cy="104" r="8" />
          <circle cx="166" cy="104" r="8" />
        </g>
      )}

      {/* Cachetes sonrojados */}
      {has('blush') && (
        <g fill={color} opacity="0.35">
          <ellipse cx="56" cy="102" rx="10" ry="6" />
          <ellipse cx="144" cy="102" rx="10" ry="6" />
        </g>
      )}

      {/* Corazones flotando */}
      {has('hearts') && (
        <g opacity="0.95">
          <Heart x={186} y={66} size={1.1} color={color} />
          <Heart x={166} y={44} size={0.8} color={color} />
          <Heart x={30} y={54} size={0.9} color={color} />
        </g>
      )}

      {/* Destellos */}
      {has('sparkles') && (
        <g opacity="0.95">
          <Sparkle x={176} y={54} size={0.9} color={CHEESE} />
          <Sparkle x={26} y={92} size={0.7} color={color} />
          <Sparkle x={150} y={30} size={0.6} color={CHEESE} />
        </g>
      )}

      {/* Gotas de sudor */}
      {has('sweat') && (
        <g>
          <path d="M158 56c4 6 6 9 6 12a6 6 0 0 1-12 0c0-3 2-6 6-12z" fill="#7FD8FF" stroke={OUT} strokeWidth="3" />
          <path d="M42 44c3 5 5 7 5 10a5 5 0 0 1-10 0c0-3 2-5 5-10z" fill="#7FD8FF" stroke={OUT} strokeWidth="3" />
        </g>
      )}

      {/* Humo */}
      {has('smoke') && (
        <g fill="#6E707A" stroke={OUT} strokeWidth="3.5" opacity="0.9">
          <circle cx="40" cy="20" r="10" />
          <circle cx="58" cy="8" r="7" />
          <circle cx="164" cy="18" r="9" />
        </g>
      )}

      {/* Ondas de calor */}
      {has('heatLines') && (
        <g stroke="#FF9E3D" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.95">
          <path d="M22 150c6-6-6-12 0-18s-6-12 0-18" />
          <path d="M178 150c-6-6 6-12 0-18s6-12 0-18" />
        </g>
      )}

      {/* Caja de domicilio */}
      {has('box') && (
        <g transform="translate(4 118)">
          <rect x="0" y="0" width="46" height="52" rx="8" fill="#1F2024" stroke={OUT} strokeWidth="5.5" />
          <path d="M0 18h46" stroke={OUT} strokeWidth="4" opacity="0.6" />
          <path d="M16 6l7-8 7 8-7 6z" fill={CHEESE} stroke={OUT} strokeWidth="3" strokeLinejoin="round" />
          <path d="M8 30h30M8 40h20" stroke={GLOVE} strokeWidth="4" strokeLinecap="round" opacity="0.75" />
        </g>
      )}

      {/* Diadema con micrófono */}
      {has('headset') && (
        <g>
          <path d="M148 34c8 4 12 12 12 20" stroke={OUT} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M160 54c-2 8-8 14-16 16" stroke={OUT} strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="142" cy="72" r="5" fill={CHEESE} stroke={OUT} strokeWidth="3" />
        </g>
      )}

      {/* Baba de la Hambrienta */}
      {has('drool') && (
        <path
          d="M116 112c2 8 1 14-2 18-3-4-4-10-2-18z"
          fill="#7FD8FF"
          stroke={OUT}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      )}

      {/* Mordida en el pan */}
      {has('bite') && (
        <g>
          <path
            d="M126 44c8-2 16 2 18 10-8 2-14 0-18-4-3-3-3-5 0-6z"
            fill={OUT}
            opacity="0.85"
          />
          <path d="M128 46c6-1 11 1 13 6" stroke={CHEESE} strokeWidth="2.5" fill="none" opacity="0.6" />
        </g>
      )}

      {/* Mancha de ketchup (en la esquina del pan, lejos de los ojos) */}
      {has('ketchup') && (
        <g fill="#E4002B" stroke={OUT} strokeWidth="3">
          <ellipse cx="50" cy="50" rx="7.5" ry="5" transform="rotate(-24 50 50)" />
          <circle cx="58" cy="55" r="2.2" />
          <circle cx="44" cy="57" r="1.8" />
        </g>
      )}

      {/* Papas fritas */}
      {personality.accessory === 'fries' && (
        <g transform="translate(152 120)">
          <g stroke={OUT} strokeWidth="4.5" strokeLinejoin="round" fill={CHEESE}>
            <rect x="4" y="-18" width="8" height="50" rx="3" />
            <rect x="16" y="-30" width="8" height="62" rx="3" />
            <rect x="28" y="-12" width="8" height="44" rx="3" />
          </g>
          <path d="M-2 26h46l-8 58H6z" fill="#E4002B" stroke={OUT} strokeWidth="5" strokeLinejoin="round" />
          <path d="M4 44h34" stroke={CHEESE} strokeWidth="4.5" />
        </g>
      )}

      {/* Anillo de la Pesada (en los puños) */}
      {has('rings') && <circle cx="100" cy={pattyTop + 34} r="0" />}
    </g>
  )
}

/* ------------------------------------------------------------------ */
/* Accesorios de cabeza                                                */
/* ------------------------------------------------------------------ */

function Accessory({ type, color }: { type: MascotPersonality['accessory']; color: string }) {
  switch (type) {
    case 'cap':
      return (
        <g>
          <path d="M64 40c0-16 16-27 36-27s36 11 36 27z" fill={color} stroke={OUT} strokeWidth="6" strokeLinejoin="round" />
          <path d="M46 40h58" stroke={OUT} strokeWidth="13" strokeLinecap="round" />
          <path d="M46 40h58" stroke={color} strokeWidth="7" strokeLinecap="round" />
          <path d="M74 24h34" stroke={GLOVE} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
          <circle cx="100" cy="17" r="5.5" fill={CHEESE} stroke={OUT} strokeWidth="3" />
        </g>
      )
    case 'bandana':
      return (
        <g>
          <path d="M50 56c14-12 86-12 100 0v13c-14 11-86 11-100 0z" fill={color} stroke={OUT} strokeWidth="6" strokeLinejoin="round" />
          <path d="M56 62c12-8 76-8 88 0" stroke="#fff" strokeWidth="2.5" opacity="0.5" fill="none" />
          <path d="M138 60l22-16 5 18-17 5z" fill={color} stroke={OUT} strokeWidth="5" strokeLinejoin="round" />
          <path d="M152 68l12 18" stroke={color} strokeWidth="9" strokeLinecap="round" />
          <path d="M152 68l12 18" stroke={OUT} strokeWidth="3" strokeLinecap="round" opacity="0.35" />
        </g>
      )
    case 'crown':
      return (
        <g>
          <path d="M68 44 58 6l19 14L100-8l23 28 19-14-10 38z" fill={CHEESE} stroke={OUT} strokeWidth="5" strokeLinejoin="round" />
          <rect x="68" y="42" width="64" height="11" rx="4" fill={CHEESE} stroke={OUT} strokeWidth="5" />
          <circle cx="100" cy="20" r="3.5" fill="#E4002B" stroke={OUT} strokeWidth="2" />
        </g>
      )
    case 'helmet':
      return (
        <g>
          <path d="M60 42c0-17 18-29 40-29s40 12 40 29z" fill="#3A3B42" stroke={OUT} strokeWidth="6" strokeLinejoin="round" />
          <path d="M52 42h96" stroke={OUT} strokeWidth="12" strokeLinecap="round" />
          <path d="M52 42h96" stroke={GLOVE} strokeWidth="5" strokeLinecap="round" />
          <path d="M100 14l12 10-12 9-12-9z" fill={CHEESE} stroke={OUT} strokeWidth="3" strokeLinejoin="round" />
        </g>
      )
    case 'flames':
    case 'fries':
    default:
      return null
  }
}

/* ------------------------------------------------------------------ */
/* Personaje completo                                                  */
/* ------------------------------------------------------------------ */

/**
 * Personaje SVG de la mascota. Es el modo principal: se dibuja siempre.
 */
export function MascotGlyph({
  personality,
  className,
}: {
  personality: MascotPersonality
  className?: string
}) {
  const { color, accessory, eyes, pose, patties, extras } = personality
  const hands = POSES[pose]
  const has = (extra: string) => extras.includes(extra as never)

  /* Zona de carnes: se reparte entre 1, 2 o 3 capas */
  const pattyTop = 146
  const pattyZone = 38
  const gap = 3
  const layerH = (pattyZone - gap * (patties - 1)) / patties

  const bottomBunY = pattyTop + pattyZone + 4
  const legTop = bottomBunY + 14
  const legBottom = legTop + 30
  const sneakerY = legTop + 26

  return (
    <svg viewBox="0 0 200 264" className={className} aria-hidden focusable="false">
      {/* Salpicaduras de aerosol detrás */}
      <g fill={color} opacity="0.15">
        <circle cx="100" cy="142" r="88" />
        <circle cx="100" cy="142" r="62" opacity="0.75" />
      </g>
      <g fill={color} opacity="0.9">
        <circle cx="14" cy="70" r="5" />
        <circle cx="188" cy="54" r="4" />
        <circle cx="24" cy="210" r="6" />
        <circle cx="178" cy="202" r="5" />
        <circle cx="100" cy="256" r="4" />
      </g>

      {/* Llamas por detrás (En Llamas) */}
      {accessory === 'flames' && (
        <g stroke={OUT} strokeWidth="4.5" strokeLinejoin="round">
          <path d="M30 176c-12-24-3-42 12-54-3 14 7 19 12 9 5-9 0-24 10-35 5 21 21 28 21 49 0 17-15 29-32 29z" fill="#FF6A00" />
          <path d="M170 176c12-24 3-42-12-54 3 14-7 19-12 9-5-9 0-24-10-35-5 21-21 28-21 49 0 17 15 29 32 29z" fill="#FF6A00" />
          <path d="M46 198c-7-14-2-25 7-32-2 8 4 11 7 5 3-6 0-14 6-20 3 12 12 17 12 29 0 10-8 17-18 17z" fill={CHEESE} />
          <path d="M154 198c7-14 2-25-7-32 2 8-4 11-7 5-3-6 0-14-6-20-3 12-12 17-12 29 0 10 8 17 18 17z" fill={CHEESE} />
        </g>
      )}

      {/* Piernas vestidas + tenis */}
      <Outfit
        outfit={personality.outfit}
        legTop={legTop}
        legBottom={legBottom}
        sneakerY={sneakerY}
        color={color}
      />

      {/* Brazos */}
      <Limb d={hands.leftArm} color={color} width={15} />
      <Limb d={hands.rightArm} color={color} width={15} />

      {/* ---------------------- Cuerpo: la burger ---------------------- */}
      <path d="M38 118C38 64 65 36 100 36s62 28 62 82z" fill={BUN} stroke={OUT} strokeWidth="6.5" strokeLinejoin="round" />
      <path d="M56 74c5-19 21-31 45-31" stroke={BUN_LIGHT} strokeWidth="9" strokeLinecap="round" fill="none" />

      {/* Ajonjolí */}
      <g fill="#FFF3D6">
        <ellipse cx="68" cy="56" rx="5.5" ry="3.6" transform="rotate(-22 68 56)" />
        <ellipse cx="96" cy="46" rx="5.5" ry="3.6" transform="rotate(6 96 46)" />
        <ellipse cx="126" cy="54" rx="5.5" ry="3.6" transform="rotate(24 126 54)" />
      </g>

      {/* Cara */}
      <Eyes type={eyes} color={color} lashes={has('lashes')} />
      <Mouth type={eyes} />

      {/* Lechuga */}
      <path
        d="M30 122c9-9 17 6 25-1s17 8 25 1 17 8 25 1 17-8 25 1 17 6 25-1v14c-9 9-17-6-25 1s-17-8-25-1-17-8-25-1-17 8-25-1-17-6-25 1z"
        fill={LETTUCE}
        stroke={OUT}
        strokeWidth="5.5"
        strokeLinejoin="round"
      />

      {/* Queso derretido */}
      <path
        d="M34 142h132v9c-9 14-13-7-22 5s-13-11-22 4-13-11-22 3-13-11-22 4-13-11-22 3-13-9-22 4z"
        fill={CHEESE}
        stroke={OUT}
        strokeWidth="5.5"
        strokeLinejoin="round"
      />

      {/* Carnes (1, 2 o 3 capas) */}
      {Array.from({ length: patties }).map((_, i) => {
        const y = pattyTop + i * (layerH + gap)
        return (
          <g key={i}>
            <rect
              x="40"
              y={y}
              width="120"
              height={layerH}
              rx={Math.min(12, layerH / 2)}
              fill={PATTY}
              stroke={OUT}
              strokeWidth="5"
            />
            <path
              d={`M56 ${y + layerH / 2}h46`}
              stroke={PATTY_DARK}
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          </g>
        )
      })}

      {/* Pan de abajo */}
      <path
        d={`M42 ${bottomBunY}h116c0 14-12 22-27 22H69c-15 0-27-8-27-22z`}
        fill={BUN}
        stroke={OUT}
        strokeWidth="6.5"
        strokeLinejoin="round"
      />

      {/* Detalles de personalidad */}
      <Extras personality={personality} pattyTop={pattyTop} />

      {/* Manos */}
      <Hand
        x={hands.leftHand.x}
        y={hands.leftHand.y}
        type={hands.leftHand.type}
        color={color}
      />
      <Hand
        x={hands.rightHand.x}
        y={hands.rightHand.y}
        type={hands.rightHand.type}
        color={color}
        ring={has('rings')}
      />

      {/* Accesorio de cabeza */}
      <Accessory type={accessory} color={color} />
    </svg>
  )
}
