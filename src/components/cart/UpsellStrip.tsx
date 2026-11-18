import { Plus, Sparkles } from 'lucide-react'
import { money } from '@/lib/format'
import { pickUpsells } from '@/lib/upsell'
import { useCart } from '@/store/cart'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'
import type { Upsell } from '@/types'

export function UpsellStrip({ compact }: { compact?: boolean }) {
  const lines = useCart((s) => s.lines)
  const addLine = useCart((s) => s.addLine)
  const updateLine = useCart((s) => s.updateLine)
  const products = useDb((s) => s.products)

  const picks = pickUpsells(lines, products)
  if (!picks.length) return null

  const handleAdd = (upsell: Upsell) => {
    if (upsell.kind === 'topping') {
      const burgerLine = lines.find((l) => {
        const product = products.find((p) => p.id === l.productId)
        return product?.categoryId === 'cat_burgers' || product?.categoryId === 'cat_combos'
      })
      if (burgerLine) {
        const already = burgerLine.selections.some((s) => s.optionId === 'o_top_bacon')
        if (already) {
          toast({ title: 'Ya tiene tocineta', emoji: '🥓' })
          return
        }
        updateLine(burgerLine.id, {
          selections: [
            ...burgerLine.selections,
            {
              groupId: 'g_toppings',
              groupName: 'Toppings',
              optionId: 'o_top_bacon',
              name: 'Tocineta crocante',
              price: 4000,
            },
          ],
          unitPrice: burgerLine.unitPrice + 4000,
        })
        toast({ title: 'Tocineta agregada', description: burgerLine.name, emoji: '🥓', tone: 'success' })
        return
      }
    }

    const product = upsell.productId ? products.find((p) => p.id === upsell.productId) : undefined
    if (!product) return
    addLine({
      productId: product.id,
      name: product.name,
      image: product.image,
      basePrice: product.price,
      unitPrice: product.price,
      quantity: 1,
      selections: [],
      isCombo: product.categoryId === 'cat_combos',
      comboContents: product.comboContents,
    })
    toast({ title: 'Agregado al pedido', description: product.name, emoji: upsell.emoji, tone: 'success' })
  }

  return (
    <section className="space-y-2">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ash">
        <Sparkles className="size-3.5 text-red" /> Completa tu parche
      </p>
      <div className={compact ? 'space-y-2' : 'grid gap-2 sm:grid-cols-2'}>
        {picks.map((upsell) => (
          <button
            key={upsell.id}
            type="button"
            onClick={() => handleAdd(upsell)}
            className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-red/50 hover:bg-red/[0.06] active:scale-[0.98]"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-lg">
              {upsell.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-bone">{upsell.title}</span>
              <span className="block truncate text-[11px] text-ash">{upsell.description}</span>
            </span>
            <span className="flex shrink-0 flex-col items-end">
              <span className="text-xs font-extrabold text-red">+{money(upsell.addPrice)}</span>
              <span className="mt-0.5 grid size-6 place-items-center rounded-full bg-red text-white transition group-hover:scale-110">
                <Plus className="size-3.5" />
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
