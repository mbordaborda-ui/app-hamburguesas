import { useMemo, useState } from 'react'
import { Check, Minus, Plus, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { money } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Product, SelectedOption } from '@/types'

export function ProductCustomizer({
  product,
  onSubmit,
  submitLabel = 'Añadir al pedido',
}: {
  product: Product
  onSubmit: (input: { selections: SelectedOption[]; quantity: number; notes?: string; unitPrice: number }) => void
  submitLabel?: string
}) {
  const [selections, setSelections] = useState<SelectedOption[]>(() =>
    product.optionGroups.flatMap((group) =>
      group.options
        .filter((option) => option.default)
        .map((option) => ({
          groupId: group.id,
          groupName: group.name,
          optionId: option.id,
          name: option.name,
          price: option.price,
        })),
    ),
  )
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  const optionsTotal = useMemo(
    () => selections.reduce((acc, s) => acc + s.price, 0),
    [selections],
  )
  const unitPrice = product.price + optionsTotal
  const total = unitPrice * quantity

  const toggle = (groupId: string, optionId: string, name: string, price: number, groupName: string, type: 'single' | 'multi', max?: number) => {
    setSelections((current) => {
      const exists = current.some((s) => s.optionId === optionId)
      if (type === 'single') {
        return [
          ...current.filter((s) => s.groupId !== groupId),
          { groupId, groupName, optionId, name, price },
        ]
      }
      if (exists) return current.filter((s) => s.optionId !== optionId)
      const inGroup = current.filter((s) => s.groupId === groupId).length
      if (max && inGroup >= max) return current
      return [...current, { groupId, groupName, optionId, name, price }]
    })
  }

  const missingRequired = product.optionGroups.some(
    (group) =>
      group.required && !selections.some((s) => s.groupId === group.id),
  )

  return (
    <div className="space-y-6">
      {product.optionGroups.map((group) => {
        const selectedInGroup = selections.filter((s) => s.groupId === group.id)
        return (
          <section key={group.id} className="space-y-2.5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="font-display text-sm uppercase tracking-wide text-bone">
                  {group.name}
                  {group.required && <span className="ml-1.5 text-flame">*</span>}
                </h3>
                {group.description && (
                  <p className="text-[11px] text-ash">{group.description}</p>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ash">
                {group.type === 'single'
                  ? 'Elige 1'
                  : `Hasta ${group.max ?? group.options.length}`}
              </span>
            </div>

            <div className="space-y-1.5">
              {group.options.map((option) => {
                const selected = selections.some((s) => s.optionId === option.id)
                const disabledByMax =
                  group.type === 'multi' &&
                  !selected &&
                  group.max !== undefined &&
                  selectedInGroup.length >= group.max
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={option.soldOut || disabledByMax}
                    onClick={() =>
                      toggle(group.id, option.id, option.name, option.price, group.name, group.type, group.max)
                    }
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition',
                      selected
                        ? 'border-red/60 bg-red/[0.08]'
                        : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20',
                      (option.soldOut || disabledByMax) && 'cursor-not-allowed opacity-40',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-5 shrink-0 place-items-center border transition',
                        group.type === 'single' ? 'rounded-full' : 'rounded-md',
                        selected ? 'border-red bg-red text-white' : 'border-white/25',
                      )}
                    >
                      {selected && <Check className="size-3" strokeWidth={3.5} />}
                    </span>
                    <span className="flex-1 text-sm font-medium text-bone">
                      {option.name}
                      {option.soldOut && (
                        <span className="ml-2 text-[10px] uppercase text-flame">Agotado</span>
                      )}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 text-xs font-bold',
                        option.price > 0 ? 'text-red' : 'text-concrete',
                      )}
                    >
                      {option.price > 0 ? `+${money(option.price)}` : 'Incluido'}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}

      <Textarea
        label="Notas para la cocina"
        placeholder="Sin cebolla, término medio, salsa aparte..."
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        hint="Opcional. La cocina hará lo posible por cumplirlo."
      />

      <div className="sticky bottom-0 -mx-5 border-t border-white/10 bg-carbon/95 px-5 pb-4 pt-3 backdrop-blur-xl safe-bottom">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Menos cantidad"
              className="grid size-8 place-items-center rounded-full text-bone transition hover:bg-white/10 active:scale-90"
            >
              <Minus className="size-4" />
            </button>
            <span className="min-w-6 text-center text-sm font-extrabold text-bone">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              aria-label="Más cantidad"
              className="grid size-8 place-items-center rounded-full bg-red text-white transition hover:bg-red-deep active:scale-90"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-concrete">Total</p>
            <p className="font-display text-xl text-red">{money(total)}</p>
          </div>
        </div>

        <Button
          size="lg"
          fullWidth
          disabled={missingRequired}
          icon={<ShoppingBag className="size-4" />}
          onClick={() =>
            onSubmit({ selections, quantity, notes: notes.trim() || undefined, unitPrice })
          }
        >
          {missingRequired ? 'Completa las opciones' : `${submitLabel} · ${money(total)}`}
        </Button>
      </div>
    </div>
  )
}
