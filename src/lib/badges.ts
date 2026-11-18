import type { ProductBadge } from '@/types'

export type BadgeTone =
  /* paleta de identidad */
  | 'red'
  | 'orange'
  | 'magenta'
  | 'acid'
  | 'violet'
  | 'yellow'
  | 'cream'
  /* neutrales */
  | 'neutral'
  | 'outline'
  /* alias legado */
  | 'volt'
  | 'flame'
  | 'lime'
  | 'grape'

/**
 * Etiquetas de sticker urbanas. Se usan en tarjetas, banners y promos.
 * Mezcla español/inglés a propósito: así habla la calle.
 */
export const badgeMeta: Record<ProductBadge, { label: string; tone: BadgeTone; emoji: string }> = {
  mas_vendido: { label: 'Best Seller', tone: 'yellow', emoji: '🍔' },
  nuevo: { label: 'New Drop', tone: 'acid', emoji: '💥' },
  picante: { label: 'Hot', tone: 'orange', emoji: '🔥' },
  premium: { label: 'Limited', tone: 'violet', emoji: '⚡' },
  veggie: { label: 'Veggie', tone: 'acid', emoji: '🥬' },
  drop: { label: 'New Drop', tone: 'orange', emoji: '💥' },
  secreto: { label: 'Must Try', tone: 'violet', emoji: '👀' },
  promo: { label: 'Oferta', tone: 'yellow', emoji: '⚡' },
}

/** Stickers sueltos para banners y secciones. */
export const streetStickers = {
  hot: { label: 'Hot', tone: 'orange' as BadgeTone, emoji: '🔥' },
  bestSeller: { label: 'Best Seller', tone: 'yellow' as BadgeTone, emoji: '🍔' },
  newDrop: { label: 'New Drop', tone: 'acid' as BadgeTone, emoji: '💥' },
  favorite: { label: 'Favorite', tone: 'magenta' as BadgeTone, emoji: '⭐' },
  delivery: { label: 'Delivery', tone: 'red' as BadgeTone, emoji: '🛵' },
  limited: { label: 'Limited', tone: 'violet' as BadgeTone, emoji: '⚡' },
  mustTry: { label: 'Must Try', tone: 'yellow' as BadgeTone, emoji: '👀' },
  top: { label: 'Top', tone: 'orange' as BadgeTone, emoji: '🔥' },
}
