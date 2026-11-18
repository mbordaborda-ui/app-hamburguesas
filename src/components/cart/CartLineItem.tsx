import { Minus, Plus, Trash2 } from 'lucide-react'
import { SmartImage } from '@/components/ui/SmartImage'
import { money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCart } from '@/store/cart'
import type { CartLine } from '@/types'

export function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
  size = 'md',
}: {
  quantity: number
  onIncrement: () => void
  onDecrement: () => void
  size?: 'sm' | 'md'
}) {
  const dim = size === 'sm' ? 'size-7' : 'size-8'
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-0.5">
      <button
        type="button"
        onClick={onDecrement}
        aria-label="Quitar una unidad"
        className={cn(
          'grid place-items-center rounded-full text-bone transition hover:bg-white/10 active:scale-90',
          dim,
        )}
      >
        <Minus className="size-3.5" />
      </button>
      <span className="min-w-5 text-center text-sm font-extrabold text-bone">{quantity}</span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label="Agregar una unidad"
        className={cn(
          'grid place-items-center rounded-full bg-red text-white transition hover:bg-red-deep active:scale-90',
          dim,
        )}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}

export function CartLineItem({ line, compact }: { line: CartLine; compact?: boolean }) {
  const increment = useCart((s) => s.increment)
  const decrement = useCart((s) => s.decrement)
  const removeLine = useCart((s) => s.removeLine)

  const extras = line.selections.filter((s) => s.price > 0 || s.groupName !== 'Salsas')

  return (
    <div className="flex gap-3 py-3.5">
      <SmartImage
        src={line.image}
        alt={line.name}
        wrapperClassName={cn('shrink-0 rounded-2xl', compact ? 'size-16' : 'size-20')}
        className="size-full"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold uppercase tracking-tight text-bone">
              {line.name}
            </p>
            {line.comboContents && (
              <p className="mt-0.5 truncate text-[11px] text-red">
                {line.comboContents.join(' + ')}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => removeLine(line.id)}
            aria-label={`Eliminar ${line.name}`}
            className="shrink-0 text-concrete transition hover:text-flame"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        {extras.length > 0 && (
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ash">
            {extras.map((s) => s.name).join(' · ')}
          </p>
        )}
        {line.notes && (
          <p className="mt-0.5 text-[11px] italic text-concrete">“{line.notes}”</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <QuantityStepper
            quantity={line.quantity}
            size={compact ? 'sm' : 'md'}
            onIncrement={() => increment(line.id)}
            onDecrement={() => decrement(line.id)}
          />
          <span className="font-display text-sm text-red">{money(line.unitPrice * line.quantity)}</span>
        </div>
      </div>
    </div>
  )
}
