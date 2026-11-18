import { RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { money } from '@/lib/format'
import { orderToLines } from '@/lib/habits'
import { cn } from '@/lib/utils'
import { useOrderHabits } from '@/hooks/useOrderHabits'
import { useCart } from '@/store/cart'
import { toast } from '@/store/ui'

/**
 * "Tu combo habitual": recuerda lo que el cliente pide siempre y lo repite con
 * un toque. Si no hay historial no se muestra nada.
 */
export function UsualOrderCard({ className }: { className?: string }) {
  const navigate = useNavigate()
  const loadLines = useCart((s) => s.loadLines)
  const { usual, topProduct, firstName } = useOrderHabits()

  if (!usual) return null

  const count = usual.items.reduce((acc, item) => acc + item.quantity, 0)
  const star = topProduct?.name ?? usual.items[0]?.name

  const reorder = () => {
    loadLines(orderToLines(usual.items))
    toast({
      title: 'Pedido repetido',
      description: `${usual.items.length} productos de tu combo habitual`,
      emoji: '🔁',
      tone: 'success',
    })
    navigate('/cart')
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[28px] border border-red/25 bg-gradient-to-br from-red/[0.1] via-carbon to-carbon p-5',
        className,
      )}
    >
      <p className="font-display text-[11px] uppercase tracking-[0.2em] text-red">
        Tu combo habitual
      </p>
      <h2 className="mt-1 font-display text-xl text-bone sm:text-2xl">
        {firstName ? `${firstName}, ` : ''}¿otra vez {star}? 👀
      </h2>
      <p className="mt-1 text-xs text-ash">
        Lo has pedido {usual.times} {usual.times === 1 ? 'vez' : 'veces'} · {count}{' '}
        {count === 1 ? 'producto' : 'productos'}
      </p>

      <ul className="mt-3 space-y-1.5">
        {usual.items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-xs text-ash">
            <span className="font-bold text-bone">{item.quantity}×</span>
            <span className="truncate">{item.name}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="font-display text-lg text-red">{money(usual.total)}</span>
        <Button size="md" onClick={reorder} icon={<RotateCcw className="size-4" />}>
          Pedir de nuevo
        </Button>
      </div>
    </section>
  )
}
