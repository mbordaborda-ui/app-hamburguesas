import { upsells } from '@/data/marketing'
import type { CartLine, Product, Upsell } from '@/types'

const byId = (id: string) => upsells.find((u) => u.id === id)

/**
 * Reglas de upsell: máximo 2 recomendaciones, contextuales y sin saturar.
 */
export const pickUpsells = (
  lines: CartLine[],
  products: Product[],
  max = 2,
): Upsell[] => {
  if (lines.length === 0) return []
  const productOf = (id: string) => products.find((p) => p.id === id)
  const hasCategory = (categoryId: string) =>
    lines.some((l) => productOf(l.productId)?.categoryId === categoryId)
  const hasProduct = (id: string) => lines.some((l) => l.productId === id)

  const picks: (Upsell | undefined)[] = []

  if (hasCategory('cat_burgers') && !hasCategory('cat_drinks')) picks.push(byId('u_drink'))
  if (hasCategory('cat_burgers') && !hasCategory('cat_fries')) picks.push(byId('u_fries_upgrade'))
  if (hasProduct('p_papas_clasicas')) picks.push(byId('u_fries_upgrade'))
  if (!picks.length && hasCategory('cat_burgers')) picks.push(byId('u_bacon'))
  if (lines.length >= 2) picks.push(byId('u_malteada'))
  if (!picks.length) picks.push(byId('u_alitas'))

  const seen = new Set<string>()
  return picks
    .filter((u): u is Upsell => Boolean(u))
    .filter((u) => (seen.has(u.id) ? false : (seen.add(u.id), true)))
    .slice(0, max)
}
