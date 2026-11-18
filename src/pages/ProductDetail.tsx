import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Flame, Heart, Share2, ShoppingBag, Sparkles } from 'lucide-react'
import { ProductCustomizer } from '@/components/product/ProductCustomizer'
import { ProductRail } from '@/components/product/ProductRail'
import { Pill, ProductBadgePill, SpicyMeter } from '@/components/ui/Badge'
import { Button, IconButton } from '@/components/ui/Button'
import { EmptyState, Rating } from '@/components/ui/Feedback'
import { SmartImage } from '@/components/ui/SmartImage'
import { money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useFavorites } from '@/hooks/useLoyalty'
import { useCart } from '@/store/cart'
import { useDb } from '@/store/db'
import { toast, useUi } from '@/store/ui'

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const product = useDb((s) => s.products.find((p) => p.slug === slug))
  const products = useDb((s) => s.products)
  const drops = useDb((s) => s.drops)
  const addLine = useCart((s) => s.addLine)
  const openCart = useUi((s) => s.openCart)
  const favorites = useFavorites()

  if (!product) {
    return (
      <div className="px-4 py-16 sm:px-6">
        <EmptyState
          emoji="🤔"
          title="No encontramos ese producto"
          description="Puede que ya no esté disponible o el enlace esté roto."
          action={<Button onClick={() => navigate('/menu')}>Volver al menú</Button>}
        />
      </div>
    )
  }

  const drop = drops.find((d) => d.id === product.dropId)
  const related = products
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId && !p.isSecret)
    .slice(0, 6)
  const isFavorite = favorites.has(product.id)
  const soldOut = !product.isAvailable || product.stock === 0

  return (
    <div className="pb-8">
      {/* Hero */}
      <div className="relative">
        <SmartImage
          src={product.image}
          alt={product.name}
          wrapperClassName="aspect-[4/3] w-full sm:aspect-[21/9] lg:rounded-b-[32px]"
          className="size-full"
          emoji="🍔"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/30" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <IconButton label="Volver" onClick={() => navigate(-1)} className="bg-ink/60 backdrop-blur">
            <ArrowLeft className="size-4" />
          </IconButton>
          <div className="flex gap-2">
            <IconButton
              label="Compartir"
              className="bg-ink/60 backdrop-blur"
              onClick={() => {
                const url = window.location.href
                if (navigator.share) {
                  void navigator.share({ title: product.name, url })
                } else {
                  void navigator.clipboard?.writeText(url)
                  toast({ title: 'Enlace copiado', emoji: '🔗' })
                }
              }}
            >
              <Share2 className="size-4" />
            </IconButton>
            <IconButton
              label="Favorito"
              className={cn('backdrop-blur', isFavorite ? 'bg-flame text-white' : 'bg-ink/60')}
              onClick={() => favorites.toggle(product.id)}
            >
              <Heart className={cn('size-4', isFavorite && 'fill-current')} />
            </IconButton>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-1.5">
            {product.badges.map((badge) => (
              <ProductBadgePill key={badge} badge={badge} />
            ))}
            {drop && (
              <Pill tone="flame">
                <Flame className="size-3" /> Drop #{String(drop.dropNumber).padStart(3, '0')}
              </Pill>
            )}
          </div>
          <h1 className="mt-2 font-display text-3xl leading-tight text-bone sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-1 font-marker text-base text-red">{product.tagline}</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 pt-5 sm:px-6 lg:grid-cols-[1fr_420px] lg:gap-12">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Rating value={product.rating} count={product.reviewsCount} size="md" />
            <SpicyMeter level={product.spicy} />
            <span className="text-xs text-concrete">⏱ {product.prepMinutes} min de preparación</span>
            {product.calories && (
              <span className="text-xs text-concrete">🔥 {product.calories} kcal</span>
            )}
          </div>

          <p className="text-sm leading-relaxed text-ash sm:text-base">{product.description}</p>

          {product.comboContents && (
            <div className="rounded-3xl border border-red/25 bg-red/[0.06] p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-red">
                <Sparkles className="size-3.5" /> Incluye
              </p>
              <ul className="mt-2 space-y-1">
                {product.comboContents.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-bone">
                    <span className="size-1.5 rounded-full bg-red" /> {item}
                  </li>
                ))}
              </ul>
              {product.savings && (
                <p className="mt-2 text-xs font-bold text-lime">
                  Ahorras {money(product.savings)} vs. pedir por separado
                </p>
              )}
            </div>
          )}

          <div className="rounded-3xl border border-white/[0.08] bg-carbon p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-ash">
              Ingredientes
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {product.ingredients.map((ingredient) => (
                <span
                  key={ingredient}
                  className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] text-ash"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>

          {drop && (
            <div className="rounded-3xl border border-flame/30 bg-flame/[0.06] p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-flame">
                Edición limitada
              </p>
              <p className="mt-1 text-sm text-bone">
                Quedan <span className="font-bold text-flame">{drop.remaining}</span> de{' '}
                {drop.total} unidades. Cuando se agote, no vuelve.
              </p>
            </div>
          )}

          <Link
            to="/menu"
            className="inline-block text-xs font-bold uppercase tracking-wider text-ash transition hover:text-red"
          >
            ← Seguir explorando el menú
          </Link>
        </div>

        {/* Personalizador */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-white/[0.08] bg-carbon p-5">
            <div className="mb-4 flex items-end justify-between gap-3 border-b border-white/[0.06] pb-4">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-concrete">
                  Personaliza tu pedido
                </p>
                <p className="font-display text-2xl text-red">{money(product.price)}</p>
                {product.compareAtPrice && (
                  <p className="text-xs text-concrete line-through">
                    {money(product.compareAtPrice)}
                  </p>
                )}
              </div>
              {soldOut ? (
                <Pill tone="flame">Agotado</Pill>
              ) : (
                <Button variant="outline" size="sm" onClick={openCart} icon={<ShoppingBag className="size-3.5" />}>
                  Ver pedido
                </Button>
              )}
            </div>

            <ProductCustomizer
              product={product}
              onSubmit={({ selections, quantity, notes, unitPrice }) => {
                addLine({
                  productId: product.id,
                  name: product.name,
                  image: product.image,
                  basePrice: product.price,
                  unitPrice,
                  quantity,
                  selections,
                  notes,
                  isCombo: product.categoryId === 'cat_combos',
                  comboContents: product.comboContents,
                })
                toast({
                  title: 'Agregado al pedido',
                  description: `${quantity}x ${product.name}`,
                  emoji: '🍔',
                  tone: 'success',
                })
              }}
            />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-12">
          <ProductRail
            title="También te puede gustar"
            products={related}
            actionTo={`/menu`}
            actionLabel="Ver menú"
          />
        </div>
      )}
    </div>
  )
}
