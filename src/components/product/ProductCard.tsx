import type { MouseEvent } from 'react'
import { Heart, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductBadgeSticker, SpicyMeter } from '@/components/ui/Badge'
import { Rating } from '@/components/ui/Feedback'
import { SmartImage } from '@/components/ui/SmartImage'
import { money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useFavorites } from '@/hooks/useLoyalty'
import { useCart } from '@/store/cart'
import { toast } from '@/store/ui'
import type { Product } from '@/types'

export function ProductCard({
  product,
  layout = 'grid',
}: {
  product: Product
  layout?: 'grid' | 'row'
}) {
  const addLine = useCart((s) => s.addLine)
  const favorites = useFavorites()
  const isFavorite = favorites.has(product.id)
  const soldOut = !product.isAvailable || product.stock === 0

  const quickAdd = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (soldOut) return
    const defaults = product.optionGroups.flatMap((group) =>
      group.options
        .filter((option) => option.default)
        .map((option) => ({
          groupId: group.id,
          groupName: group.name,
          optionId: option.id,
          name: option.name,
          price: option.price,
        })),
    )
    const unitPrice = product.price + defaults.reduce((acc, item) => acc + item.price, 0)
    addLine({
      productId: product.id,
      name: product.name,
      image: product.image,
      basePrice: product.price,
      unitPrice,
      quantity: 1,
      selections: defaults,
      isCombo: product.categoryId === 'cat_combos',
      comboContents: product.comboContents,
    })
    toast({ title: 'Agregado al pedido', description: product.name, emoji: '🍔', tone: 'success' })
  }

  if (layout === 'row') {
    return (
      <Link
        to={`/product/${product.slug}`}
        className="group flex gap-3 rounded-3xl border border-white/[0.08] bg-carbon p-3 transition hover:border-red/50 active:scale-[0.99]"
      >
        <SmartImage
          src={product.image}
          alt={product.name}
          wrapperClassName="size-24 shrink-0 rounded-2xl"
          className="size-full"
          emoji="🍔"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-display text-base uppercase leading-tight text-bone">
              {product.name}
            </h3>
            <SpicyMeter level={product.spicy} />
          </div>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-ash">
            {product.description}
          </p>
          <div className="mt-auto flex items-center justify-between pt-2">
            <Rating value={product.rating} count={product.reviewsCount} />
            <span className="font-display text-base text-red">{money(product.price)}</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={`/product/${product.slug}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[22px] border border-white/[0.08] bg-carbon transition duration-300',
        'hover:-translate-y-0.5 hover:border-red/40 hover:shadow-pop active:scale-[0.99]',
      )}
    >
      {/* ---------------------------- FOTO ---------------------------- */}
      <div className="relative">
        <SmartImage
          src={product.image}
          alt={product.name}
          wrapperClassName="aspect-[4/3] w-full"
          className="size-full transition duration-500 group-hover:scale-[1.04]"
          emoji="🍔"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-carbon/85 via-transparent to-transparent" />

        {/* Un solo sello: la foto manda */}
        {product.badges[0] && (
          <div className="absolute left-2 right-12 top-2 flex items-start gap-1.5">
            <ProductBadgeSticker badge={product.badges[0]} rotate={-5} />
          </div>
        )}

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            favorites.toggle(product.id)
          }}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          className={cn(
            'absolute right-2 top-2 grid size-9 place-items-center rounded-full border border-ink/40 backdrop-blur-md transition active:scale-90',
            isFavorite ? 'bg-magenta text-white' : 'bg-ink/60 text-bone hover:bg-ink/80',
          )}
        >
          <Heart className={cn('size-4', isFavorite && 'fill-current')} />
        </button>

        {product.stock !== undefined && product.stock <= 20 && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full border border-ink/60 bg-orange px-2.5 py-1 font-display text-[10px] uppercase tracking-wide text-ink">
            Quedan {product.stock}
          </span>
        )}

        {soldOut && (
          <div className="absolute inset-0 grid place-items-center bg-ink/75 backdrop-blur-[2px]">
            <span className="tag-3d font-display text-2xl uppercase tracking-widest text-orange">
              Sold out
            </span>
          </div>
        )}
      </div>

      {/* --------------------------- CONTENIDO --------------------------- */}
      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base uppercase leading-tight text-bone">
            {product.name}
          </h3>
          <SpicyMeter level={product.spicy} />
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ash">{product.tagline}</p>

        <div className="mt-2 flex items-center gap-2">
          <Rating value={product.rating} count={product.reviewsCount} />
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="flex flex-col">
            {product.compareAtPrice && (
              <span className="text-xs font-medium text-concrete line-through">
                {money(product.compareAtPrice)}
              </span>
            )}
            <span className="font-display text-2xl leading-none text-bone">{money(product.price)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={quickAdd}
          disabled={soldOut}
          aria-label={`Agregar ${product.name}`}
          className={cn(
            'mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-red/50 bg-red',
            'font-display text-sm uppercase tracking-[0.06em] text-white shadow-primary transition-all duration-200',
            'hover:bg-red-deep active:scale-[0.97] disabled:opacity-40',
          )}
        >
          <Plus className="size-4" strokeWidth={3} />
          Agregar
        </button>
      </div>
    </Link>
  )
}

export function ProductCardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-[22px] border border-white/[0.06] bg-carbon"
        >
          <div className="skeleton aspect-[4/3] w-full" />
          <div className="space-y-2 p-3.5">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
            <div className="skeleton h-10 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}
