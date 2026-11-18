import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Lock, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { ProductCard, ProductCardSkeletonGrid } from '@/components/product/ProductCard'
import { Scribble, SpraySplat, Sticker } from '@/components/brand/StreetArt'
import { Button, LinkButton } from '@/components/ui/Button'
import { Pill, ProductBadgeSticker, SpicyMeter } from '@/components/ui/Badge'
import { EmptyState, Rating } from '@/components/ui/Feedback'
import { SmartImage } from '@/components/ui/SmartImage'
import { money } from '@/lib/format'
import { levelForPoints } from '@/lib/loyalty'
import { cn } from '@/lib/utils'
import { useLoyalty } from '@/hooks/useLoyalty'
import { useCart } from '@/store/cart'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'
import type { Product } from '@/types'

type SortKey = 'todos' | 'mas_vendido' | 'nuevo' | 'promo' | 'precio_asc' | 'precio_desc'

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'mas_vendido', label: '⭐ Más vendidos' },
  { key: 'nuevo', label: '🆕 Nuevos' },
  { key: 'promo', label: '⚡ Promos' },
  { key: 'precio_asc', label: '💸 Menor precio' },
  { key: 'precio_desc', label: '💎 Mayor precio' },
]

export default function Menu() {
  const { categorySlug } = useParams()
  const navigate = useNavigate()
  const categories = useDb((s) => s.categories)
  const products = useDb((s) => s.products)
  const addLine = useCart((s) => s.addLine)
  const { account, current } = useLoyalty()

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('todos')
  const [loading, setLoading] = useState(true)

  const activeCategory = categories.find((c) => c.slug === categorySlug)

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 260)
    return () => clearTimeout(timer)
  }, [categorySlug, sort])

  const unlockedLevel = levelForPoints(account.lifetimePoints)
  const levelOrder = ['rookie', 'crew', 'street_boss', 'legend']

  const visible = useMemo(() => {
    let list = products.filter((p) => !p.isSecret)

    if (activeCategory) {
      if (activeCategory.id === 'cat_best') list = list.filter((p) => p.isBestSeller)
      else if (activeCategory.id === 'cat_new') list = list.filter((p) => p.isNew)
      else list = list.filter((p) => p.categoryId === activeCategory.id)
    }

    if (sort === 'mas_vendido') list = list.filter((p) => p.isBestSeller)
    if (sort === 'nuevo') list = list.filter((p) => p.isNew)
    if (sort === 'promo') list = list.filter((p) => p.compareAtPrice)
    if (sort === 'precio_asc') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'precio_desc') list = [...list].sort((a, b) => b.price - a.price)

    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q)),
      )
    }

    return list
  }, [products, activeCategory, sort, query])

  // Producto destacado en formato póster (como los Drops).
  // Solo en la vista general, y se saca de la cuadrícula para no repetirlo.
  const featured =
    !activeCategory && sort === 'todos' && !query.trim()
      ? visible.find((p) => p.isBestSeller)
      : undefined
  const gridItems = featured ? visible.filter((p) => p.id !== featured.id) : visible

  const quickAdd = (product: Product) => {
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
    addLine({
      productId: product.id,
      name: product.name,
      image: product.image,
      basePrice: product.price,
      unitPrice: product.price + defaults.reduce((acc, item) => acc + item.price, 0),
      quantity: 1,
      selections: defaults,
      isCombo: product.categoryId === 'cat_combos',
      comboContents: product.comboContents,
    })
    toast({ title: 'Agregado al pedido', description: product.name, emoji: '🍔', tone: 'success' })
  }

  const secretProducts = products.filter((p) => p.isSecret)
  const secretUnlocked = secretProducts.filter(
    (p) =>
      p.unlockLevel && levelOrder.indexOf(unlockedLevel.id) >= levelOrder.indexOf(p.unlockLevel),
  )

  return (
    <div className="pb-8">
      {/* --------------------------- CABECERA PÓSTER --------------------------- */}
      <section className="px-4 pt-4 sm:px-6">
        <header className="relative overflow-hidden rounded-[28px] border border-red/25 bg-gradient-to-br from-red/[0.1] via-carbon to-carbon p-5 sm:p-7">
          <div className="texture-brick absolute inset-0 opacity-15" />
          <SpraySplat seed={21} className="absolute -left-20 -top-20 size-64 text-red/[0.08]" />

          <div className="relative">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-orange" />
              <span className="font-display text-[11px] uppercase tracking-[0.24em] text-orange">
                {activeCategory ? activeCategory.name : 'El menú del parche'}
              </span>
            </div>

            <h1 className="mt-1 font-display text-5xl leading-[0.9] text-bone sm:text-6xl">
              {activeCategory ? activeCategory.name.toUpperCase() : 'EL MENÚ'}
            </h1>
            <Scribble className="mt-1 h-4 w-44 text-orange" />

            <p className="mt-3 max-w-lg text-sm text-ash sm:text-base">
              Elige tu burger, ármala a tu gusto y la mandamos pa&apos; tu casa.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Sticker tone="red" rotate={-4} size="sm">
                {visible.length} productos
              </Sticker>
              <Pill tone="neutral">🔥 Lo más pedido primero</Pill>
            </div>

            <div className="mt-4">
              <LinkButton
                to="/construye"
                size="md"
                variant="accent"
                icon={<Sparkles className="size-4" />}
              >
                Construye tu burger
              </LinkButton>
            </div>
          </div>
        </header>
      </section>

      {/* ------------------------ BARRA FUNCIONAL FIJA ------------------------ */}
      <div className="sticky top-14 z-30 mt-4 border-y border-white/[0.07] bg-ink/92 backdrop-blur-xl sm:top-16">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ash" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca smash, tocineta, picante..."
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-10 pr-10 text-sm text-bone placeholder:text-concrete focus:border-orange/70 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-concrete hover:text-bone"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
            <button
              type="button"
              onClick={() => navigate('/menu')}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-2xl border px-3.5 py-2 font-display text-xs uppercase tracking-wide transition',
                !activeCategory
                  ? 'border-orange bg-orange text-ink shadow-orange'
                  : 'border-white/10 bg-white/[0.04] text-ash hover:border-orange/50 hover:text-bone',
              )}
            >
              Todo
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => navigate(`/menu/${category.slug}`)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-2xl border px-3.5 py-2 font-display text-xs uppercase tracking-wide transition',
                  activeCategory?.id === category.id
                    ? 'border-orange bg-orange text-ink shadow-orange'
                    : 'border-white/10 bg-white/[0.04] text-ash hover:border-orange/50 hover:text-bone',
                )}
              >
                <span aria-hidden>{category.emoji}</span>
                {category.name}
              </button>
            ))}
          </div>

          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 pt-3 sm:-mx-6 sm:px-6">
            <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-orange/80">
              <SlidersHorizontal className="size-3" /> Ordenar
            </span>
            {sortOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSort(option.key)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition',
                  sort === option.key
                    ? 'bg-orange text-ink shadow-orange'
                    : 'bg-white/[0.04] text-concrete hover:bg-white/[0.08] hover:text-ash',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6">
        {loading ? (
          <ProductCardSkeletonGrid count={8} />
        ) : visible.length === 0 ? (
          <EmptyState
            emoji="🔍"
            title="No encontramos nada"
            description="Prueba con otra búsqueda o cambia de categoría."
            action={
              <Button
                onClick={() => {
                  setQuery('')
                  setSort('todos')
                  navigate('/menu')
                }}
              >
                Ver todo el menú
              </Button>
            }
          />
        ) : (
          <>
            {/* --------------------- DESTACADO ESTILO DROP --------------------- */}
            {featured && (
              <article className="group relative mb-6 overflow-hidden rounded-[28px] border border-red/25 bg-carbon">
                <div className="grid sm:h-[340px] sm:grid-cols-[minmax(0,44%)_1fr]">
                  <div className="relative">
                    <SmartImage
                      src={featured.image}
                      alt={featured.name}
                      wrapperClassName="aspect-[4/3] w-full sm:absolute sm:inset-0 sm:aspect-auto sm:h-full"
                      className="size-full transition duration-700 group-hover:scale-105"
                      emoji="🍔"
                      priority
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-carbon/90 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-carbon/80" />
                    {featured.badges[0] && (
                      <div className="absolute left-3 top-3">
                        <ProductBadgeSticker badge={featured.badges[0]} rotate={-6} />
                      </div>
                    )}
                  </div>

                  <div className="relative flex flex-col gap-3 p-5">
                    <div>
                      <p className="font-display text-[11px] uppercase tracking-[0.24em] text-orange">
                        Lo más pedido
                      </p>
                      <Link to={`/product/${featured.slug}`}>
                        <h2 className="mt-1 font-display text-3xl leading-[0.95] text-bone transition group-hover:text-orange sm:text-4xl">
                          {featured.name}
                        </h2>
                      </Link>
                      <p className="mt-2 text-sm text-ash">{featured.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Rating value={featured.rating} count={featured.reviewsCount} />
                      <SpicyMeter level={featured.spicy} />
                      <span className="text-xs text-concrete">
                        ⏱ {featured.prepMinutes} min
                      </span>
                    </div>

                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-concrete">Precio</p>
                        <p className="font-display text-3xl leading-none text-bone">
                          {money(featured.price)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => quickAdd(featured)}
                          aria-label={`Agregar ${featured.name}`}
                        >
                          Agregar
                        </Button>
                        <LinkButton
                          to={`/product/${featured.slug}`}
                          variant="outline"
                          iconRight={<ArrowRight className="size-4" />}
                        >
                          Personalizar
                        </LinkButton>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* ----------------------------- CUADRÍCULA ----------------------------- */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
              {gridItems.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}

        {/* --------------------------- MENÚ SECRETO --------------------------- */}
        <section className="mt-10">
          <div className="mb-3 flex items-center gap-2">
            <Lock className="size-4 text-violet" />
            <h2 className="font-display text-2xl text-bone">MENÚ SECRETO</h2>
            <span className="rounded-full bg-violet/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-violet">
              {secretUnlocked.length}/{secretProducts.length} desbloqueados
            </span>
          </div>

          {secretUnlocked.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-violet/30 bg-violet/[0.05] p-6 text-center">
              <p className="text-3xl">🔒</p>
              <p className="mt-2 font-display text-base text-bone">
                Nivel {current.name} desbloquea lo oculto
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-ash">
                Sube de nivel, completa misiones o consigue códigos secretos para revelar productos
                que no están en el menú público.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
              {secretUnlocked.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
