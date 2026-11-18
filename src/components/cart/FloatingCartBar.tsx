import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { money } from '@/lib/format'
import { cartCount } from '@/lib/pricing'
import { useCart } from '@/store/cart'
import { useCartPricing } from '@/hooks/useCartPricing'
import { useUi } from '@/store/ui'

export function FloatingCartBar() {
  const lines = useCart((s) => s.lines)
  const openCart = useUi((s) => s.openCart)
  const { total } = useCartPricing()
  const count = cartCount(lines)
  const lastAddedId = useCart((s) => s.lastAddedId)

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="safe-bottom fixed inset-x-0 bottom-[68px] z-40 px-3 lg:hidden"
        >
          <button
            type="button"
            onClick={openCart}
            className="mx-auto flex h-14 w-full max-w-lg items-center gap-3 rounded-2xl border border-white/15 bg-red px-4 text-white shadow-[0_14px_44px_-10px_rgba(23,105,255,0.85)] transition active:scale-[0.98]"
          >
            <span
              key={lastAddedId}
              className="animate-bump grid size-9 shrink-0 place-items-center rounded-xl bg-ink text-red"
            >
              <ShoppingBag className="size-4" />
            </span>
            <span className="flex-1 text-left">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider opacity-75">
                {count} {count === 1 ? 'producto' : 'productos'}
              </span>
              <span className="block font-display text-lg leading-tight">{money(total)}</span>
            </span>
            <span className="rounded-xl bg-ink/90 px-3.5 py-2 font-display text-[13px] uppercase tracking-wide text-red">
              Ver pedido
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
