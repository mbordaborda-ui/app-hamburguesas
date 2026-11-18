/**
 * ============================================================================
 *  LA BURGER DEL PARCHE — mascota de la marca
 * ============================================================================
 *
 *  Misma esencia, diferentes actitudes.
 *
 *  ASSETS: cada personalidad tiene su propia imagen. Coloca tus 6 PNG en
 *  `public/mascota/` con estos nombres exactos:
 *
 *     public/mascota/1-tranqui.png
 *     public/mascota/2-bandida.png
 *     public/mascota/3-pesada.png
 *     public/mascota/4-en-llamas.png
 *     public/mascota/5-delivery.png
 *     public/mascota/6-hambrienta.png
 *
 *  Si el archivo no existe, se dibuja automáticamente el personaje SVG
 *  (`MascotGlyph`) con los colores y la actitud de cada personalidad, así la
 *  mascota nunca se ve rota. Recomendado: PNG con fondo transparente, 800x800.
 */

export type MascotId =
  | 'tranqui'
  | 'bandida'
  | 'pesada'
  | 'en_llamas'
  | 'delivery'
  | 'hambrienta'

export type MascotAccessory = 'cap' | 'bandana' | 'crown' | 'flames' | 'helmet' | 'fries'

export type MascotEyes = 'chill' | 'flirty' | 'serious' | 'fire' | 'focused' | 'crazy'

/** Pose de brazos y manos. Cada actitud tiene la suya. */
export type MascotPose = 'thumbsUp' | 'kiss' | 'fists' | 'raised' | 'pointing' | 'munching'

/** Ropa de cada actitud. */
export type MascotOutfit = 'jeans' | 'ripped' | 'cargo' | 'flame' | 'uniform' | 'messy'

/** Detalles extra que le dan carácter a cada actitud. */
export type MascotExtra =
  | 'chain'
  | 'earrings'
  | 'rings'
  | 'hearts'
  | 'sparkles'
  | 'blush'
  | 'lashes'
  | 'sweat'
  | 'smoke'
  | 'heatLines'
  | 'box'
  | 'headset'
  | 'drool'
  | 'bite'
  | 'ketchup'

export interface MascotPersonality {
  id: MascotId
  name: string
  /**
   * Frases de la actitud. Se elige una al azar y nunca se repite la anterior,
   * así la mascota no dice siempre lo mismo.
   */
  messages: string[]
  /** Bajada de una línea, como en la lámina de marca. */
  description: string
  emoji: string
  /**
   * Imagen opcional. Si el archivo no existe (o está vacío), se dibuja el
   * personaje SVG de `MascotGlyph`, que es el modo principal.
   */
  image: string
  /** Color de identidad de la personalidad (bocadillo, salpicaduras, tenis). */
  color: string
  accessory: MascotAccessory
  eyes: MascotEyes
  pose: MascotPose
  /** Ropa que lleva puesta. */
  outfit: MascotOutfit
  /** Capas de carne: la Pesada es triple. */
  patties: 1 | 2 | 3
  extras: MascotExtra[]
}

export const mascotPersonalities: MascotPersonality[] = [
  {
    id: 'en_llamas',
    name: 'En Llamas',
    messages: [
      'HOY VENIMOS CON FUEGO.',
      '¿TE ATREVES?',
      'ESTO NO ES PARA COBARDES.',
      'VIENE CON FUEGO.',
      'SUBIMOS LA TEMPERATURA.',
      'HOY SE QUEMA LA DIETA.',
      'ESTÁ QUE ARDE.',
      'FUEGO EN CADA MORDIDA.',
    ],
    description: 'Para los que se atreven con todo.',
    emoji: '🔥',
    image: '',
    color: '#ff3b2f',
    accessory: 'flames',
    eyes: 'fire',
    pose: 'raised',
    outfit: 'flame',
    patties: 2,
    extras: ['sweat', 'smoke', 'heatLines'],
  },
  {
    id: 'tranqui',
    name: 'Tranqui',
    messages: [
      '¿QUÉ MÁS, PARCE?',
      'TODO TRANQUI POR ACÁ.',
      'HOY SE COME BUENO.',
      '¿YA SABES QUÉ VAS A PEDIR?',
      'PASE, PASE.',
      '¿SE LE ANTOJÓ O QUÉ?',
      'RELÁJESE, QUE AQUÍ HAY SABOR.',
    ],
    description: 'La clásica, siempre lista para lo que sea.',
    emoji: '🧢',
    image: '',
    color: '#35c9ff',
    accessory: 'cap',
    eyes: 'chill',
    pose: 'thumbsUp',
    outfit: 'jeans',
    patties: 1,
    extras: ['chain', 'sparkles'],
  },
  {
    id: 'bandida',
    name: 'Bandida',
    messages: [
      'HOY SE PECA.',
      'NO DIGAS QUE NO TE AVISÉ.',
      '¿TE VAS A RESISTIR?',
      'CAÍSTE EN LA TENTACIÓN.',
      'HOY NO HAY REMORDIMIENTO.',
      'UNA MORDIDA Y YA.',
      'SABES QUE LA QUIERES.',
      'ESA BURGER TE ESTÁ LLAMANDO.',
    ],
    description: 'Pícara, atrevida y siempre tentadora.',
    emoji: '💋',
    image: '',
    color: '#ff2d7a',
    accessory: 'bandana',
    eyes: 'flirty',
    pose: 'kiss',
    outfit: 'ripped',
    patties: 1,
    extras: ['earrings', 'hearts', 'blush', 'lashes'],
  },
  {
    id: 'pesada',
    name: 'Pesada',
    messages: [
      '¿SEGURO QUE PUEDES?',
      'ESO NO ES UNA BURGER.',
      'ESTO ES PERSONAL.',
      '¿VIENES CON HAMBRE O QUÉ?',
      'ESTO NO ES PARA CUALQUIERA.',
      '¿QUIÉN DIJO MIEDO?',
      'DESPUÉS NO DIGAS QUE NO TE AVISÉ.',
    ],
    description: 'Triple carne, triple queso, doble actitud.',
    emoji: '👑',
    image: '',
    color: '#ffd21f',
    accessory: 'crown',
    eyes: 'serious',
    pose: 'fists',
    outfit: 'cargo',
    patties: 3,
    extras: ['chain', 'rings', 'sparkles'],
  },
  {
    id: 'delivery',
    name: 'Delivery',
    messages: [
      "VOY PA' TU CASA.",
      'YA CASI LLEGO.',
      'AGÁRRATE QUE YA CASI.',
      'TU BURGER VA RODANDO.',
      'NO TE MUEVAS.',
      'EL PARCHE ESTÁ EN CAMINO.',
      'PRÓXIMA PARADA: TU CASA.',
    ],
    description: 'Tu parche favorito, en camino.',
    emoji: '🛵',
    image: '',
    color: '#1769ff',
    accessory: 'helmet',
    eyes: 'focused',
    pose: 'pointing',
    outfit: 'uniform',
    patties: 1,
    extras: ['box', 'headset', 'sparkles'],
  },
  {
    id: 'hambrienta',
    name: 'Hambrienta',
    messages: [
      'NO COMPARTO.',
      '¿Y LAS PAPITAS?',
      'YO TAMBIÉN TENGO HAMBRE.',
      'ESA BURGER ES MÍA.',
      '¿YA VAMOS A COMER?',
      'NECESITO ESA BURGER.',
      'NO PUEDO MÁS... NECESITO UNA.',
      '¿ESO ES TODO?',
      '¿QUIÉN DIJO COMPARTIR?',
      'LAS PAPITAS SON MÍAS.',
    ],
    description: 'Las papas también son mías.',
    emoji: '🍟',
    image: '',
    color: '#a8e600',
    accessory: 'fries',
    eyes: 'crazy',
    pose: 'munching',
    outfit: 'messy',
    patties: 2,
    extras: ['drool', 'bite', 'ketchup'],
  },
]

export const mascotById = (id: MascotId) =>
  mascotPersonalities.find((p) => p.id === id) ?? mascotPersonalities[0]

/* ------------------------------------------------------------------ */
/* Mensajes reactivos a lo que hace el usuario                         */
/* ------------------------------------------------------------------ */

export type MascotMessageKey =
  | 'add'
  | 'addMany'
  | 'remove'
  | 'empty'
  | 'idle'
  | 'orderConfirmed'
  | 'orderPreparing'
  | 'orderOnTheWay'
  | 'orderDelivered'

export const mascotMessages: Record<MascotMessageKey, string[]> = {
  add: ["🔥 ¡SE FUE PA' TU PARCHE!", "🔥 ¡DALE PARCE, SE FUE!", "🔥 ¡ESA ES MI GENTE!"],
  addMany: ['YA ESTO ES PERSONAL. 💀', '💀 YA ES PERSONAL, PARCE.', '💀 UY, SE PASÓ DE BUENO.'],
  remove: ['¿SE ARREPINTIÓ O QUÉ? 😭', '😭 ¿SE ARREPINTIÓ, PARCE?', '😭 NO ME HAGA ESO.'],
  empty: ['PARCE... AQUÍ NO HAY NADA.', 'PARCE... ¿Y LA BURGER?', 'AQUÍ NO HAY NADA, PARCE. 😶'],
  idle: [
    'PARCE... ¿VAS A PEDIR O QUÉ?',
    'PARCE... ¿NOS QUEDAMOS MIRANDO?',
    'PARCE... EL HAMBRE NO ESPERA.',
  ],
  orderConfirmed: ['🔥 PARCHE CONFIRMADO.', '🔥 PEDIDO CONFIRMADO, PARCE.', '🔥 LISTO, ARRANCAMOS.'],
  orderPreparing: ['🍔 LA COCINA ESTÁ EN MARCHA.', '🍔 YA ESTÁ EN LA PARRILLA.', '🍔 LA COCINA NO DUERME.'],
  orderOnTheWay: ["🛵 EL PARCHE VA PA' TU CASA.", "🛵 YA VOY PA' ALLÁ.", '🛵 AGUANTA, YA CASI.'],
  orderDelivered: ['🍔 PARCHE COMPLETADO.', '🍔 ¡BUEN PROVECHO, PARCE!', '🍔 MISIÓN CUMPLIDA.'],
}

/** Color del bocadillo según el tipo de mensaje. */
export const mascotMessageTone: Record<MascotMessageKey, string> = {
  add: '#ff6a00',
  addMany: '#ff2d7a',
  remove: '#ffd21f',
  empty: '#a6a8b4',
  idle: '#ffd21f',
  orderConfirmed: '#e4002b',
  orderPreparing: '#ff6a00',
  orderOnTheWay: '#35c9ff',
  orderDelivered: '#a8e600',
}

/**
 * Elige un mensaje al azar sin repetir el inmediatamente anterior.
 * `recent[0]` es el último que dijo.
 */
export const pickMascotMessage = (pool: string[], recent: string[]): string => {
  if (pool.length === 1) return pool[0]
  const last = recent[0]
  const fresh = pool.filter((message) => message !== last)
  const candidates = fresh.length > 0 ? fresh : pool
  return candidates[Math.floor(Math.random() * candidates.length)]
}
