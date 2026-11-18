import { ShoppingBag } from 'lucide-react'
import { CartPanel } from './CartPanel'
import { Sheet } from '@/components/ui/Sheet'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { useCart } from '@/store/cart'
import { cartCount } from '@/lib/pricing'
import { useUi } from '@/store/ui'

export function CartDrawer() {
  const open = useUi((s) => s.cartOpen)
  const closeCart = useUi((s) => s.closeCart)
  const isDesktop = useIsDesktop()
  const count = cartCount(useCart((s) => s.lines))

  return (
    <Sheet
      open={open}
      onClose={closeCart}
      side={isDesktop ? 'right' : 'bottom'}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <ShoppingBag className="size-4 text-red" /> Tu pedido
          {count > 0 && <span className="text-ash">({count})</span>}
        </span>
      }
      subtitle="Revisa y personaliza antes de pedir"
    >
      <CartPanel />
    </Sheet>
  )
}
