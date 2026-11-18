import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Clock,
  Flame,
  Gift,
  MapPin,
  Star,
  Ticket,
  Zap,
} from 'lucide-react'
import { ProductRail } from '@/components/product/ProductRail'
import { ProductCard } from '@/components/product/ProductCard'
import { BarrioLayer } from '@/components/brand/BarrioLayer'
import { MascotStage } from '@/components/mascot/BurgerMascot'
import {
  BurstSticker,
  GraffitiTitle,
  Scribble,
  SpraySplat,
  Sticker,
  StreetBand,
} from '@/components/brand/StreetArt'
import { SmartImage } from '@/components/ui/SmartImage'
import { Pill } from '@/components/ui/Badge'
import { StoreHoursCard, StoreStatusPill } from '@/components/store/StoreHours'
import { UsualOrderCard } from '@/components/profile/UsualOrderCard'
import { ProgressBar } from '@/components/ui/Feedback'
import { Button, LinkButton } from '@/components/ui/Button'
import { countdown, money } from '@/lib/format'
import { useLoyalty } from '@/hooks/useLoyalty'
import { useDb } from '@/store/db'
import { useUi } from '@/store/ui'

const HERO_IMAGE = '/img/hero-burger.jpg'

export default function Home() {
  const products = useDb((s) => s.products)
  const drops = useDb((s) => s.drops)
  const coupons = useDb((s) => s.coupons)
  const reviews = useDb((s) => s.reviews)
  const settings = useDb((s) => s.settings)
  const { account, current, next, percent, remaining, isGuest } = useLoyalty()
  const openCart = useUi((s) => s.openCart)

  const bestSellers = products.filter((p) => p.isBestSeller && !p.isSecret)
  const news = products.filter((p) => p.isNew && !p.isSecret)
  const combos = products.filter((p) => p.categoryId === 'cat_combos')
  const activeDrop = drops.filter((d) => d.active && d.remaining > 0)[0]

  return (
    <div className="space-y-10 pb-6 lg:space-y-14">
      {/* ------------------------------- HERO ------------------------------- */}
      <section className="relative px-4 pt-4 sm:px-6 lg:pt-6">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-carbon lg:min-h-[560px]">
          {/*
            En móvil la foto ocupa su propio bloque arriba y el texto va debajo
            sobre fondo sólido: así la hamburguesa SIEMPRE se ve.
            En desktop la foto pasa a ser fondo y el texto se monta encima.
          */}
          <div className="relative h-64 w-full sm:h-80 lg:absolute lg:inset-0 lg:h-full">
            <SmartImage
              src={HERO_IMAGE}
              alt="Hamburguesa del parche"
              wrapperClassName="absolute inset-0 size-full"
              className="size-full object-center"
              emoji="🍔"
              priority
            />
            {/* Oscurecido solo en desktop, donde el texto va sobre la foto */}
            <div className="absolute inset-0 hidden bg-gradient-to-r from-ink via-ink/85 to-ink/25 lg:block" />
            {/* Fundido suave hacia el contenido en móvil */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-carbon via-carbon/70 to-transparent lg:hidden" />

            {/* Sello de marca: presente pero sin tapar la hamburguesa */}
            <div className="absolute right-3 top-3 origin-top-right scale-[0.62] sm:right-5 sm:top-5 sm:scale-75 lg:right-8 lg:top-8 lg:scale-100">
              <BurstSticker tone="orange" rotate={-12}>
                Puro
                <br />
                barrio
              </BurstSticker>
            </div>
          </div>

          <div className="texture-brick pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay" />

          <BarrioLayer variant="hero" seed={6} />

          <div className="relative flex flex-col gap-5 p-5 pt-1 sm:p-8 sm:pt-2 lg:max-w-2xl lg:py-20">
            <div className="flex flex-wrap items-center gap-2">
              <Sticker tone="red" rotate={-4} size="sm">
                🛵 100% a domicilio
              </Sticker>
              <StoreStatusPill />
              <Pill tone="orange">
                <Zap className="size-3" /> Street food
              </Pill>
            </div>

            <div>
              <p className="font-display text-base uppercase tracking-[0.14em] text-orange sm:text-lg">
                ¿Hambre o antojo?
              </p>
              <h1 className="mt-1.5 font-display text-[42px] leading-[0.9] tracking-[-0.01em] sm:text-6xl lg:text-[68px]">
                <span className="tag-outline block text-bone">BURGERS QUE</span>
                <GraffitiTitle fill="fire" className="block">
                  ROMPEN LA CALLE
                </GraffitiTitle>
              </h1>
              <Scribble className="mt-2 h-4 w-44 text-orange sm:w-56" />
              <p className="mt-3 max-w-md text-base leading-relaxed text-ash sm:text-lg">
                Sabor brutal, salsas de la casa y burgers que llegan, rompen y se van. 🔥
              </p>
              <p className="mt-2 font-display text-xs uppercase tracking-[0.2em] text-orange">
                El parche empieza aquí.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <LinkButton
                to="/menu"
                size="lg"
                variant="primary"
                iconRight={<ArrowRight className="size-4" />}
              >
                Pedir ahora 🔥
              </LinkButton>
              <Button
                size="lg"
                variant="outline"
                onClick={() =>
                  document.getElementById('mas-vendidos')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Ver menú
              </Button>
            </div>

            <dl className="mt-2 grid max-w-xs grid-cols-2 gap-3">
              <Stat
                icon={<Clock className="size-3.5" />}
                value={`${settings.avgPrepMinutes + 12} min`}
                label="Entrega prom."
              />
              <Stat icon={<Star className="size-3.5" />} value="4.9" label="1.2k reseñas" />
            </dl>
          </div>
        </div>
      </section>

      {/* --------------------------- CATEGORÍAS ----------------------------- */}
      <section className="no-scrollbar flex gap-2.5 overflow-x-auto px-4 sm:px-6 lg:flex-wrap lg:justify-center">
        {[
          { slug: 'hamburguesas', label: 'Burgers', emoji: '🍔' },
          { slug: 'combos', label: 'Combos', emoji: '🍟' },
          { slug: 'bebidas', label: 'Bebidas', emoji: '🥤' },
          { slug: 'acompanamientos', label: 'Acompañantes', emoji: '🍗' },
          { slug: 'papas', label: 'Papas', emoji: '🍟' },
          { slug: 'especiales', label: 'Promos', emoji: '🔥' },
        ].map((cat) => (
          <Link
            key={cat.slug}
            to={`/menu/${cat.slug}`}
            className="group flex shrink-0 items-center gap-2.5 rounded-2xl border border-white/10 bg-carbon px-4 py-3 transition hover:border-red/50 hover:bg-red/[0.08] active:scale-95"
          >
            <span className="text-lg" aria-hidden>
              {cat.emoji}
            </span>
            <span className="whitespace-nowrap font-display text-sm uppercase tracking-wide text-bone">
              {cat.label}
            </span>
          </Link>
        ))}
      </section>

      {/* ---------------------- CONSTRUYE TU BURGER ------------------------ */}
      <section className="px-4 sm:px-6">
        <Link
          to="/construye"
          className="group relative flex items-center gap-4 overflow-hidden rounded-[28px] border border-orange/40 bg-gradient-to-br from-orange/[0.16] via-carbon to-carbon p-5 shadow-orange transition hover:-translate-y-0.5 hover:border-orange/70 sm:p-6"
        >
          <div className="texture-hatch pointer-events-none absolute inset-0 opacity-30" />
          <SpraySplat seed={41} className="absolute -right-12 -top-14 size-56 text-orange/[0.14]" />
          <span className="relative grid size-16 shrink-0 place-items-center rounded-2xl border-2 border-orange/50 bg-orange/15 text-4xl transition duration-200 group-hover:-rotate-6 group-hover:scale-105 sm:size-20 sm:text-5xl">
            🍔
          </span>
          <span className="relative min-w-0 flex-1">
            <span className="block font-display text-[11px] uppercase tracking-[0.2em] text-orange">
              🔥 Nuevo · A tu manera
            </span>
            <span className="mt-1 block font-display text-2xl leading-none text-bone sm:text-3xl">
              CONSTRUYE TU BURGER
            </span>
            <span className="mt-1 block text-xs text-ash sm:text-sm">
              Arma tu burger capa por capa y mírala cambiar en vivo.
            </span>
          </span>
          <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-orange text-ink shadow-orange transition group-hover:translate-x-1">
            <ArrowRight className="size-5" strokeWidth={2.6} />
          </span>
        </Link>
      </section>

      {/* ------------------------ TU COMBO HABITUAL ------------------------ */}
      <section className="px-4 sm:px-6">
        <UsualOrderCard />
      </section>

      {/* ------------------------ LA BURGER DEL PARCHE ---------------------- */}
      <MascotStage />

      {/* --------------------------- CINTA DE BARRIO ------------------------ */}
      <StreetBand
        items={[
          'Puro barrio',
          'Pura actitud',
          'Hecho en Colombia',
          'Calle y sabor',
          'El parche es de todos',
        ]}
        tone="yellow"
      />

      {/* ---------------------------- REWARDS ------------------------------- */}
      <section className="px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[28px] border border-red/20 bg-gradient-to-br from-red/[0.08] via-carbon to-carbon p-5 sm:p-6">
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Gift className="size-4 text-red" />
                <span className="font-display text-[11px] uppercase tracking-[0.2em] text-red">
                  Street Points
                </span>
              </div>
              <h2 className="font-display text-2xl text-bone sm:text-3xl">
                {isGuest ? 'Únete y empieza a ganar' : `${account.points} puntos disponibles`}
              </h2>
              <p className="max-w-md text-sm text-ash">
                $1.000 gastados = 1 punto. Canjéalos por papas, bebidas, toppings o hamburguesas
                completas.
              </p>
              <div className="max-w-sm space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                  <span className="text-ash">
                    {current.emoji} {current.name}
                  </span>
                  {next && (
                    <span className="text-concrete">
                      {account.lifetimePoints} / {next.minPoints}
                    </span>
                  )}
                </div>
                <ProgressBar value={percent} showGlow />
                {next && (
                  <p className="text-[11px] text-ash">
                    Te faltan <span className="font-bold text-red">{remaining} pts</span> para{' '}
                    {next.emoji} {next.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <LinkButton to="/rewards" variant="primary">
                Ver recompensas
              </LinkButton>
              {isGuest && (
                <LinkButton to="/register" variant="outline">
                  Crear cuenta
                </LinkButton>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------- DROP -------------------------------- */}
      {activeDrop && (
        <section className="px-4 sm:px-6">
          <Link
            to="/drops"
            className="group relative block overflow-hidden rounded-[28px] border border-orange/35"
          >
            <SmartImage
              src={activeDrop.image}
              alt={activeDrop.name}
              wrapperClassName="h-64 w-full sm:h-80"
              className="size-full transition duration-700 group-hover:scale-105"
              emoji="🔥"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/72 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <Sticker tone="orange" rotate={-4} size="sm">
                  <Flame className="size-3" /> Drop #{String(activeDrop.dropNumber).padStart(3, '0')}
                </Sticker>
                <Pill tone="neutral">⏳ Termina en {countdown(activeDrop.endsAt)}</Pill>
              </div>
              <h2 className="mt-2 font-display text-4xl text-bone sm:text-5xl">{activeDrop.name}</h2>
              <p className="mt-1 max-w-lg text-sm text-ash">{activeDrop.tagline}</p>

              <div className="mt-4 max-w-md space-y-2">
                <div className="flex items-center justify-between font-display text-xs uppercase tracking-wider">
                  <span className="text-orange">
                    {activeDrop.remaining} / {activeDrop.total} disponibles
                  </span>
                  <span className="text-bone">{money(activeDrop.price)}</span>
                </div>
                <ProgressBar
                  value={activeDrop.remaining}
                  max={activeDrop.total}
                  tone="flame"
                  className="h-2.5"
                />
              </div>

              <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-2xl bg-orange px-5 py-3 font-display text-sm uppercase tracking-wide text-ink shadow-orange transition group-hover:gap-3">
                Conseguir el drop <ArrowRight className="size-4" />
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* -------------------------- MÁS VENDIDOS ---------------------------- */}
      <div id="mas-vendidos" className="scroll-mt-24">
        <ProductRail
          title="Los más pedidos"
          subtitle="Lo que todo el parche pide una y otra vez"
          products={bestSellers}
          actionTo="/menu/mas-vendidos"
          accent={<Sticker tone="yellow" rotate={-8} size="sm">🍔 Best Seller</Sticker>}
        />
      </div>

      {/* ------------------------------ NUEVOS ------------------------------ */}
      <ProductRail
        title="Recién salidos"
        subtitle="Nuevos sabores que llegaron a la calle"
        products={news}
        actionTo="/menu/nuevos"
        accent={<Sticker tone="acid" rotate={7} size="sm">💥 New Drop</Sticker>}
      />

      {/* ------------------------------ COMBOS ------------------------------ */}
      <section className="space-y-3 px-4 sm:px-6">
        <div className="flex items-end justify-between gap-3">
          <div className="relative">
            <h2 className="font-display text-xl text-bone sm:text-3xl">COMBOS QUE AHORRAN</h2>
            <Scribble className="mt-0.5 h-3.5 w-40 text-orange" />
            <p className="mt-1 text-xs text-ash sm:text-sm">
              Hamburguesa + papas + bebida, con precio de parche
            </p>
          </div>
          <Link
            to="/menu/combos"
            className="flex shrink-0 items-center gap-1 font-display text-xs uppercase tracking-wide text-red transition hover:gap-2"
          >
            Ver todo <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {combos.slice(0, 3).map((product) => (
            <div key={product.id} className="relative">
              <ProductCard product={product} />
              {product.savings && (
                <span className="pointer-events-none absolute -right-1 top-1/2 z-10 rounded-full border-2 border-ink bg-acid px-2.5 py-1 font-display text-[10px] uppercase tracking-wide text-ink shadow-sticker">
                  Ahorras {money(product.savings)}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------- PROMOS -------------------------------- */}
      <section className="px-4 sm:px-6">
        <div className="mb-3 flex items-center gap-2">
          <Ticket className="size-4 text-yellow" />
          <h2 className="font-display text-xl text-bone sm:text-3xl">PROMOS ACTIVAS</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {coupons.slice(0, 4).map((coupon) => (
            <div
              key={coupon.id}
              className="relative overflow-hidden rounded-2xl border border-dashed border-white/20 bg-carbon p-4"
            >
              <div className="absolute -left-2.5 top-1/2 size-5 -translate-y-1/2 rounded-full bg-ink" />
              <div className="absolute -right-2.5 top-1/2 size-5 -translate-y-1/2 rounded-full bg-ink" />
              <div className="absolute inset-x-0 top-0 h-1 bg-red" />
              <span className="text-2xl">{coupon.emoji}</span>
              <p className="mt-2 font-display text-xl tracking-wide text-bone">{coupon.code}</p>
              <p className="mt-0.5 text-xs text-ash">{coupon.description}</p>
              <p className="mt-2 text-[10px] uppercase tracking-wider text-concrete">
                Desde {money(coupon.minSubtotal)} · vence en {countdown(coupon.expiresAt)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------- COMUNIDAD ------------------------------ */}
      <section className="space-y-3 px-4 sm:px-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-bone sm:text-3xl">#ELPARCHE EN LA CALLE</h2>
            <p className="mt-0.5 text-xs text-ash sm:text-sm">Fotos y reseñas reales de clientes</p>
          </div>
          <Link
            to="/community"
            className="flex shrink-0 items-center gap-1 font-display text-xs uppercase tracking-wide text-red"
          >
            Ver todo <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          {reviews.slice(0, 6).map((review) => (
            <article
              key={review.id}
              className="w-[78%] shrink-0 overflow-hidden rounded-3xl border border-white/[0.08] bg-carbon sm:w-[320px]"
            >
              {review.photo && (
                <SmartImage
                  src={review.photo}
                  alt={review.productName ?? 'Pedido'}
                  wrapperClassName="aspect-[4/3] w-full"
                  className="size-full"
                />
              )}
              <div className="space-y-2 p-4">
                <div className="flex items-center gap-2">
                  <img
                    src={review.avatar}
                    alt={review.userName}
                    loading="lazy"
                    className="size-8 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-bone">{review.userName}</p>
                    <p className="text-[10px] text-concrete">{review.productName}</p>
                  </div>
                  <span className="ml-auto text-xs font-bold text-yellow">
                    {'★'.repeat(review.ratings.overall)}
                  </span>
                </div>
                <p className="line-clamp-3 text-xs leading-relaxed text-ash">{review.comment}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------- HORARIOS ------------------------------ */}
      <section className="px-4 sm:px-6">
        <StoreHoursCard />
      </section>

      {/* --------------------------- MANIFIESTO ----------------------------- */}
      <section className="px-4 sm:px-6">
        <div className="texture-concrete relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-graphite p-6 text-center sm:p-12">
          <div className="texture-brick absolute inset-0 opacity-20" />
          <SpraySplat seed={18} className="absolute -left-16 top-1/2 size-56 text-red/[0.09]" />
          <p className="relative font-display text-base uppercase tracking-[0.14em] text-orange sm:text-xl">
            No vendemos hamburguesas. Vendemos el parche.
          </p>
          <h2 className="relative mt-3 font-display text-3xl leading-[0.95] text-bone sm:text-5xl">
            CALLE · SABOR · COLOMBIA
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-sm text-ash">
            Nacimos en una esquina, con un asador prestado y muchas ganas. Hoy llegamos a tu casa
            con la misma actitud: producto honesto, sabor brutal y pura actitud.
          </p>

          <p className="relative mt-6">
            <span className="tag-3d tag-fill-fire font-display text-2xl sm:text-3xl">
              #ElParcheEstáServido
            </span>
          </p>

          <div className="relative mt-6 flex flex-wrap justify-center gap-2">
            <LinkButton to="/menu" size="lg" variant="primary">
              Armar mi pedido
            </LinkButton>
            <Button
              size="lg"
              variant="outline"
              onClick={openCart}
              icon={<MapPin className="size-4" />}
            >
              Ver mi carrito
            </Button>
          </div>
        </div>
      </section>

    </div>
  )
}

function Stat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur">
      <dt className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-concrete">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-base text-bone">{value}</dd>
    </div>
  )
}
