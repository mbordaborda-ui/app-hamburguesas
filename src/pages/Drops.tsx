import { Link } from 'react-router-dom'
import { Clock, Flame, ShoppingBag, Zap } from 'lucide-react'
import {
  GraffitiTitle,
  Scribble,
  SpraySplat,
  Star4,
  Sticker,
} from '@/components/brand/StreetArt'
import { Pill } from '@/components/ui/Badge'
import { Button, LinkButton } from '@/components/ui/Button'
import { EmptyState, ProgressBar } from '@/components/ui/Feedback'
import { SmartImage } from '@/components/ui/SmartImage'
import { countdown, money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCart } from '@/store/cart'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'

export default function Drops() {
  const drops = useDb((s) => s.drops)
  const products = useDb((s) => s.products)
  const addLine = useCart((s) => s.addLine)

  const ordered = [...drops].sort((a, b) => {
    if (a.remaining === 0 && b.remaining > 0) return 1
    if (b.remaining === 0 && a.remaining > 0) return -1
    return b.dropNumber - a.dropNumber
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* ------------------------------ CABECERA ------------------------------ */}
      <header className="relative mb-6 overflow-hidden rounded-[28px] border border-orange/30 bg-gradient-to-br from-orange/[0.14] via-carbon to-carbon p-5 sm:p-8">
        <div className="texture-brick absolute inset-0 opacity-20" />
        <SpraySplat seed={13} className="absolute -left-20 -top-20 size-64 text-orange/[0.09]" />

        <div className="relative">
          <div className="flex items-center gap-2">
            <Flame className="size-4 text-orange" />
            <span className="font-display text-[11px] uppercase tracking-[0.24em] text-orange">
              Ediciones limitadas
            </span>
          </div>
          <h1 className="mt-1 font-display text-5xl leading-[0.9] text-bone sm:text-6xl">DROPS</h1>
          <Scribble className="mt-1 h-4 w-44 text-orange" />
          <p className="mt-3 max-w-lg text-sm text-ash">
            Cada drop es una receta única, con cantidad limitada y tiempo limitado. Cuando se agota,
            no vuelve. Nunca.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Sticker tone="orange" rotate={-4} size="sm">
              <Zap className="size-3" /> {drops.filter((d) => d.remaining > 0).length} activos
            </Sticker>
            <Pill tone="neutral">
              🔥 {drops.reduce((a, d) => a + d.remaining, 0)} unidades disponibles
            </Pill>
          </div>
        </div>
      </header>

      {ordered.length === 0 ? (
        <EmptyState
          emoji="🔥"
          title="No hay drops activos"
          description="Vuelve pronto, estamos cocinando algo brutal."
        />
      ) : (
        <div className="space-y-5">
          {ordered.map((drop) => {
            const product = products.find((p) => p.id === drop.productId)
            const soldOut = drop.remaining === 0
            const percent = (drop.remaining / drop.total) * 100

            return (
              <article
                key={drop.id}
                className={cn(
                  'group relative overflow-hidden rounded-[28px] border bg-carbon transition',
                  soldOut ? 'border-white/[0.07]' : 'border-orange/30 hover:border-orange/60',
                )}
              >
                <div className="grid sm:grid-cols-[minmax(0,44%)_1fr]">
                  {/* ------------------------- IMAGEN ------------------------- */}
                  <div className="relative">
                    <SmartImage
                      src={drop.image}
                      alt={drop.name}
                      wrapperClassName="aspect-[4/3] w-full sm:aspect-auto sm:h-full"
                      className={cn(
                        'size-full transition duration-700',
                        !soldOut && 'group-hover:scale-105',
                        soldOut && 'grayscale',
                      )}
                      emoji="🔥"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-carbon/90 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-carbon/80" />
                    <div className="absolute left-3 top-3">
                      <Sticker tone={soldOut ? 'cream' : 'orange'} rotate={-6} size="sm">
                        Drop #{String(drop.dropNumber).padStart(3, '0')}
                      </Sticker>
                    </div>
                    {soldOut && (
                      <div className="absolute inset-0 grid place-items-center bg-ink/75 backdrop-blur-[2px]">
                        <span className="tag-3d rotate-[-6deg] font-display text-4xl uppercase tracking-widest text-orange">
                          Sold out
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ------------------------ CONTENIDO ------------------------ */}
                  <div className="relative flex flex-col gap-3 p-5">
                    <div className="texture-hatch pointer-events-none absolute inset-0 opacity-30" />
                    <div className="relative">
                      <span className="text-2xl">{drop.emoji}</span>
                      <GraffitiTitle fill={soldOut ? 'yellow' : 'hot'} className="mt-1 block text-3xl sm:text-4xl">
                        {drop.name}
                      </GraffitiTitle>
                      <p className="mt-2 text-sm text-ash">{drop.tagline}</p>
                    </div>

                    <div className="relative space-y-2">
                      <div className="flex items-center justify-between font-display text-[11px] uppercase tracking-wider">
                        <span className={soldOut ? 'text-concrete' : 'text-orange'}>
                          {soldOut ? 'Agotado' : `${drop.remaining} / ${drop.total} disponibles`}
                        </span>
                        <span className="flex items-center gap-1 text-ash">
                          <Clock className="size-3" /> Termina en {countdown(drop.endsAt)}
                        </span>
                      </div>
                      <ProgressBar
                        value={drop.remaining}
                        max={drop.total}
                        tone={soldOut ? 'flame' : percent < 30 ? 'flame' : 'volt'}
                        className="h-2.5"
                      />
                    </div>

                    <div className="relative mt-auto flex items-center justify-between gap-3 pt-1">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-concrete">Precio</p>
                        <p className="font-display text-2xl text-bone">{money(drop.price)}</p>
                      </div>
                      {soldOut ? (
                        <Button disabled variant="outline">
                          Sold out
                        </Button>
                      ) : (
                        <Button
                          variant="accent"
                          icon={<ShoppingBag className="size-4" />}
                          disabled={!product}
                          onClick={() => {
                            if (!product) return
                            addLine({
                              productId: product.id,
                              name: product.name,
                              image: product.image,
                              basePrice: product.price,
                              unitPrice: product.price,
                              quantity: 1,
                              selections: [],
                            })
                            toast({
                              title: 'Drop asegurado',
                              description: `${product.name} · quedan ${drop.remaining - 1}`,
                              emoji: '🔥',
                              tone: 'success',
                            })
                          }}
                        >
                          Conseguir
                        </Button>
                      )}
                    </div>

                    {product && (
                      <Link
                        to={`/product/${product.slug}`}
                        className="relative font-display text-[11px] uppercase tracking-wider text-ash transition hover:text-red"
                      >
                        Ver detalles y personalizar →
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <div className="texture-concrete relative mt-8 overflow-hidden rounded-[28px] border border-white/[0.08] bg-carbon p-6 text-center">
        <Star4 className="relative mx-auto size-5 text-orange" />
        <p className="relative mt-2 font-display text-lg uppercase tracking-wide text-bone">
          ¿No quieres perderte el próximo?
        </p>
        <p className="relative mx-auto mt-1 max-w-md text-xs text-ash">
          Activa las notificaciones y te avisamos 24 horas antes si eres Street Boss o Legend.
        </p>
        <LinkButton to="/rewards" variant="outline" className="relative mt-3">
          Ver mis beneficios
        </LinkButton>
      </div>
    </div>
  )
}
