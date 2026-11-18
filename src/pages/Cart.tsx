import { ShoppingBag } from 'lucide-react'
import { CartPanel } from '@/components/cart/CartPanel'
import { UpsellStrip } from '@/components/cart/UpsellStrip'
import { useCart } from '@/store/cart'
import { cartCount } from '@/lib/pricing'

export default function Cart() {
  const count = cartCount(useCart((s) => s.lines))

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <header className="mb-5 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-red/15 text-red">
          <ShoppingBag className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl text-bone">Tu pedido</h1>
          <p className="text-xs text-ash">
            {count === 0 ? 'Todavía está vacío' : `${count} productos listos para la parrilla`}
          </p>
        </div>
      </header>

      <CartPanel />

      {count > 0 && (
        <div className="mt-8">
          <UpsellStrip />
        </div>
      )}
    </div>
  )
}
