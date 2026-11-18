import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Camera, Heart, PenLine, Send, Star } from 'lucide-react'
import { Scribble, SpraySplat } from '@/components/brand/StreetArt'
import { Button } from '@/components/ui/Button'
import { EmptyState, StarInput } from '@/components/ui/Feedback'
import { Sheet } from '@/components/ui/Sheet'
import { SmartImage } from '@/components/ui/SmartImage'
import { Textarea } from '@/components/ui/Input'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { api } from '@/services/api'
import { useAuth } from '@/store/auth'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'

export default function Community() {
  const [params, setParams] = useSearchParams()
  const reviews = useDb((s) => s.reviews)
  const likeReview = useDb((s) => s.likeReview)
  const orders = useDb((s) => s.orders)
  const user = useAuth((s) => s.user)

  const orderId = params.get('order')
  const order = orderId ? orders.find((o) => o.id === orderId) : undefined
  const [composerOpen, setComposerOpen] = useState(Boolean(orderId))
  const [filter, setFilter] = useState<'todas' | 'fotos' | 'top'>('todas')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    burger: 5,
    fries: 5,
    delivery: 5,
    overall: 5,
    comment: '',
    photo: '',
  })

  const filtered = reviews
    .filter((r) => (filter === 'fotos' ? Boolean(r.photo) : true))
    .sort((a, b) =>
      filter === 'top' ? b.likes - a.likes : +new Date(b.createdAt) - +new Date(a.createdAt),
    )

  const submit = async () => {
    if (!form.comment.trim()) {
      toast({ title: 'Cuéntanos algo', description: 'Escribe un comentario para publicar.', tone: 'error' })
      return
    }
    setSubmitting(true)
    try {
      await api.reviews.create({
        userId: user?.id,
        userName: user?.name ?? 'Cliente del parche',
        avatar: user?.avatar ?? 'https://i.pravatar.cc/150?u=anonimo',
        orderId: order?.id,
        productId: order?.items[0]?.productId,
        productName: order?.items[0]?.name,
        ratings: {
          burger: form.burger,
          fries: form.fries,
          delivery: form.delivery,
          overall: form.overall,
        },
        comment: form.comment.trim(),
        photo: form.photo.trim() || undefined,
      })
      toast({
        title: '¡Gracias por tu reseña!',
        description: 'Ganaste 80 Street Points',
        emoji: '⭐',
        tone: 'reward',
      })
      setComposerOpen(false)
      setParams({})
      setForm({ burger: 5, fries: 5, delivery: 5, overall: 5, comment: '', photo: '' })
    } catch (error) {
      toast({ title: 'No pudimos publicar', description: (error as Error).message, tone: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <header className="relative mb-5 overflow-hidden rounded-[28px] border border-white/[0.08] bg-carbon p-5 sm:p-6">
        <div className="texture-brick absolute inset-0 opacity-20" />
        <SpraySplat seed={7} className="absolute -right-16 -top-14 size-56 text-yellow/[0.1]" />
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-marker text-sm text-red">Comunidad</p>
            <h1 className="font-display text-3xl text-bone sm:text-4xl">#ELPARCHE</h1>
            <Scribble className="mt-1 h-3.5 w-40 text-red/60" />
            <p className="mt-2 max-w-md text-sm text-ash">
              Fotos, reseñas y momentos reales del parche. Sin filtros, pura actitud.
            </p>
          </div>
          <Button icon={<PenLine className="size-4" />} onClick={() => setComposerOpen(true)}>
            Escribir reseña
          </Button>
        </div>
      </header>

      <div className="mb-5 flex gap-2">
        {(
          [
            { id: 'todas', label: 'Todas' },
            { id: 'fotos', label: '📸 Con foto' },
            { id: 'top', label: '🔥 Más gustadas' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              'rounded-full px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide transition',
              filter === item.id
                ? 'bg-red text-white'
                : 'bg-white/[0.04] text-concrete hover:text-ash',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState emoji="📸" title="Todavía no hay reseñas" description="Sé el primero en compartir." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((review) => (
            <article
              key={review.id}
              className="flex flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-carbon"
            >
              {review.photo && (
                <SmartImage
                  src={review.photo}
                  alt={review.productName ?? 'Pedido'}
                  wrapperClassName="aspect-[4/3] w-full"
                  className="size-full"
                />
              )}
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-2.5">
                  <img
                    src={review.avatar}
                    alt={review.userName}
                    loading="lazy"
                    className="size-9 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-bone">{review.userName}</p>
                    <p className="truncate text-[10px] text-concrete">
                      {review.productName ?? 'Pedido'} · {timeAgo(review.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-red">
                    {'★'.repeat(review.ratings.overall)}
                  </span>
                </div>

                <p className="mt-3 flex-1 text-xs leading-relaxed text-ash">{review.comment}</p>

                <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <div className="flex gap-3 text-[10px] text-concrete">
                    <span>🍔 {review.ratings.burger}</span>
                    <span>🍟 {review.ratings.fries}</span>
                    <span>🛵 {review.ratings.delivery}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => likeReview(review.id)}
                    className="flex items-center gap-1 text-[11px] font-bold text-ash transition hover:text-flame"
                  >
                    <Heart className="size-3.5" /> {review.likes}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Sheet
        open={composerOpen}
        onClose={() => {
          setComposerOpen(false)
          if (orderId) setParams({})
        }}
        title="Califica tu experiencia"
        subtitle={order ? `Pedido ${order.code}` : 'Cuéntanos cómo estuvo'}
      >
        <div className="space-y-5 pb-2">
          {[
            { key: 'burger' as const, label: 'La hamburguesa', emoji: '🍔' },
            { key: 'fries' as const, label: 'Las papas', emoji: '🍟' },
            { key: 'delivery' as const, label: 'El domicilio', emoji: '🛵' },
            { key: 'overall' as const, label: 'Experiencia general', emoji: '⭐' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-bone">
                {item.emoji} {item.label}
              </span>
              <StarInput
                value={form[item.key]}
                onChange={(value) => setForm((f) => ({ ...f, [item.key]: value }))}
                size="md"
              />
            </div>
          ))}

          <Textarea
            label="Tu comentario"
            placeholder="¿Qué tal estuvo? ¿Qué mejorarías?"
            rows={4}
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
          />

          <div>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ash">
              Foto (URL)
            </span>
            <div className="flex gap-2">
              <div className="relative flex flex-1 items-center">
                <Camera className="absolute left-3.5 size-4 text-ash" />
                <input
                  value={form.photo}
                  onChange={(e) => setForm((f) => ({ ...f, photo: e.target.value }))}
                  placeholder="https://..."
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-10 pr-3 text-sm text-bone placeholder:text-concrete focus:border-red/70 focus:outline-none"
                />
              </div>
            </div>
            <p className="mt-1.5 text-xs text-concrete">
              En producción se sube directo a storage. Por ahora pega un enlace.
            </p>
          </div>

          <Button
            fullWidth
            size="lg"
            loading={submitting}
            icon={<Send className="size-4" />}
            onClick={submit}
          >
            Publicar reseña
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-concrete">
            <Star className="size-3 text-red" /> Ganas 80 Street Points por reseñar
          </p>
        </div>
      </Sheet>
    </div>
  )
}
