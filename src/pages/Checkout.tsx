import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Check,
  CreditCard,
  Info,
  MapPin,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { CouponField } from '@/components/cart/CouponField'
import { CartLineItem } from '@/components/cart/CartLineItem'
import { TotalsBreakdown } from '@/components/cart/TotalsBreakdown'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { Input, Textarea } from '@/components/ui/Input'
import { SmartImage } from '@/components/ui/SmartImage'
import { money } from '@/lib/format'
import { CLOSED_MESSAGE } from '@/lib/hours'
import { cn, uid } from '@/lib/utils'
import { useCartPricing } from '@/hooks/useCartPricing'
import { useLoyalty } from '@/hooks/useLoyalty'
import { useStoreStatus } from '@/hooks/useStoreStatus'
import { api } from '@/services/api'
import { useAuth } from '@/store/auth'
import { useCart } from '@/store/cart'
import { useDb } from '@/store/db'
import { toast, useUi } from '@/store/ui'
import type { Address, PaymentMethodId } from '@/types'

const steps = ['Dirección', 'Pedido', 'Pago', 'Confirmar'] as const

export default function Checkout() {
  const navigate = useNavigate()
  const lines = useCart((s) => s.lines)
  const clearCart = useCart((s) => s.clear)
  const tip = useCart((s) => s.tip)
  const setTip = useCart((s) => s.setTip)
  const pointsRedeemed = useCart((s) => s.pointsRedeemed)
  const setPoints = useCart((s) => s.setPoints)
  const couponCode = useCart((s) => s.couponCode)

  const addresses = useDb((s) => s.addresses)
  const upsertAddress = useDb((s) => s.upsertAddress)
  const settings = useDb((s) => s.settings)
  const user = useAuth((s) => s.user)
  const { account, isGuest } = useLoyalty()
  const setAddressPickerOpen = useUi((s) => s.setAddressPickerOpen)
  const activeAddressId = useUi((s) => s.activeAddressId)
  const setActiveAddress = useUi((s) => s.setActiveAddress)

  const { total, subtotal, pointsDiscount, pointsEarned } = useCartPricing()
  const status = useStoreStatus()

  const [step, setStep] = useState(0)
  const [method, setMethod] = useState<PaymentMethodId | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [newAddress, setNewAddress] = useState({ label: 'Casa', line: '', details: '' })

  const enabledMethods = useMemo(
    () => settings.paymentMethods.filter((m) => m.enabled),
    [settings.paymentMethods],
  )

  const address =
    addresses.find((a) => a.id === activeAddressId) ?? addresses.find((a) => a.isDefault) ?? addresses[0]

  const maxPoints = Math.min(account.points, Math.floor(subtotal / settings.pointsValue))

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          emoji="🛒"
          title="No hay nada que pedir todavía"
          description="Agrega algo del menú y volvemos al checkout."
          action={<Button onClick={() => navigate('/menu')}>Ir al menú</Button>}
        />
      </div>
    )
  }

  const saveAddress = () => {
    if (!newAddress.line.trim()) return
    const created: Address = {
      id: uid('addr'),
      label: newAddress.label,
      line: newAddress.line.trim(),
      details: newAddress.details.trim() || undefined,
      city: 'Bogotá',
      isDefault: addresses.length === 0,
    }
    upsertAddress(user?.id ?? 'guest', created)
    setActiveAddress(created.id)
    setNewAddress({ label: 'Casa', line: '', details: '' })
    toast({ title: 'Dirección lista', emoji: '📍', tone: 'success' })
  }

  const canContinue = () => {
    if (step === 0) return Boolean(address)
    if (step === 2) return Boolean(method)
    return true
  }

  const submit = async () => {
    if (submitting || !method) return
    if (!address) {
      toast({
        title: 'Falta tu dirección',
        description: 'Agrega una dirección de entrega para continuar.',
        emoji: '📍',
        tone: 'error',
      })
      setStep(0)
      return
    }
    if (!status.open) {
      toast({ title: CLOSED_MESSAGE, description: status.detail, emoji: '🔒', tone: 'error' })
      return
    }
    setSubmitting(true)
    try {
      const result = await api.orders.create({
        lines,
        address,
        paymentMethodId: method,
        couponCode: couponCode ?? undefined,
        pointsRedeemed,
        tip,
        notes: notes.trim() || undefined,
        deliveryMode: 'delivery',
        userId: user?.id,
        customer: {
          name: user?.name ?? 'Cliente invitado',
          email: user?.email ?? 'invitado@elparche.co',
          phone: user?.phone,
        },
      })

      clearCart()

      // ePayco real: el backend nos manda al checkout seguro y luego volvemos
      // a /checkout/response con la referencia del pago.
      if (result.session.requiresRedirect && result.session.redirectUrl) {
        window.location.assign(result.session.redirectUrl)
        return
      }

      toast({
        title: `Pedido ${result.order.code} confirmado`,
        description:
          result.session.status === 'approved'
            ? 'Pago aprobado. Ya estamos en la cocina.'
            : 'Pago pendiente. Te avisamos al confirmar.',
        emoji: '🎉',
        tone: 'success',
      })
      navigate(`/tracking/${result.order.id}`, { replace: true })
    } catch (error) {
      toast({ title: 'No pudimos crear tu pedido', description: (error as Error).message, tone: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
      <button
        type="button"
        onClick={() => (step === 0 ? navigate(-1) : setStep((s) => s - 1))}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ash transition hover:text-red"
      >
        <ArrowLeft className="size-3.5" /> {step === 0 ? 'Volver' : 'Paso anterior'}
      </button>

      {/* Stepper */}
      <ol className="mb-6 flex items-center gap-1.5">
        {steps.map((label, index) => (
          <li key={label} className="flex flex-1 items-center gap-1.5">
            <button
              type="button"
              onClick={() => index < step && setStep(index)}
              className={cn(
                'flex flex-1 flex-col gap-1.5 text-left',
                index <= step ? 'cursor-pointer' : 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-full rounded-full transition-colors duration-300',
                  index <= step ? 'bg-red' : 'bg-white/10',
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wider transition-colors',
                  index === step ? 'text-red' : index < step ? 'text-ash' : 'text-concrete',
                )}
              >
                {index + 1}. {label}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {!status.open && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-flame/30 bg-flame/[0.08] p-3.5">
          <Info className="mt-0.5 size-4 shrink-0 text-flame" />
          <p className="text-xs leading-relaxed text-ash">
            <span className="font-bold text-bone">{CLOSED_MESSAGE}</span> {status.detail} Puedes
            dejar tu carrito listo y pedir apenas abramos.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {/* ------------------------------ PASO 1 ------------------------------ */}
          {step === 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-xl text-bone">Dirección de entrega</h2>

              <div className="flex items-start gap-2.5 rounded-2xl border border-orange/30 bg-orange/[0.08] p-3.5">
                <Bike className="mt-0.5 size-4 shrink-0 text-orange" />
                <p className="text-xs leading-relaxed text-ash">
                  <span className="font-bold text-bone">100% a domicilio.</span> Domicilio{' '}
                  {money(settings.deliveryFee)} · gratis desde {money(settings.freeDeliveryFrom)}.
                </p>
              </div>

              <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-ash">
                      Dirección de entrega
                    </h3>
                    <button
                      type="button"
                      onClick={() => setAddressPickerOpen(true)}
                      className="text-[11px] font-bold uppercase tracking-wider text-red"
                    >
                      Gestionar
                    </button>
                  </div>

                  {addresses.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveAddress(item.id)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition',
                        address?.id === item.id
                          ? 'border-red/60 bg-red/[0.08]'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/25',
                      )}
                    >
                      <MapPin className={cn('mt-0.5 size-4', address?.id === item.id ? 'text-red' : 'text-ash')} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-bone">{item.label}</span>
                        <span className="block truncate text-xs text-ash">{item.line}</span>
                      </span>
                      {address?.id === item.id && <Check className="size-4 text-red" />}
                    </button>
                  ))}

                  <div className="space-y-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-ash">
                      Agregar nueva dirección
                    </p>
                    <div className="flex gap-2">
                      {['Casa', 'Trabajo', 'Otra'].map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setNewAddress((f) => ({ ...f, label }))}
                          className={cn(
                            'flex-1 rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wide transition',
                            newAddress.label === label
                              ? 'border-red bg-red text-white'
                              : 'border-white/10 text-ash hover:border-white/25',
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <Input
                      placeholder="Cra 45 #23-12, Apto 502"
                      value={newAddress.line}
                      onChange={(e) => setNewAddress((f) => ({ ...f, line: e.target.value }))}
                    />
                    <Input
                      placeholder="Detalles (torre, portería...)"
                      value={newAddress.details}
                      onChange={(e) => setNewAddress((f) => ({ ...f, details: e.target.value }))}
                    />
                    <Button variant="outline" fullWidth onClick={saveAddress}>
                      Guardar dirección
                    </Button>
                  </div>
                </div>
            </section>
          )}

          {/* ------------------------------ PASO 2 ------------------------------ */}
          {step === 1 && (
            <section className="space-y-4">
              <h2 className="font-display text-xl text-bone">Revisa tu pedido</h2>
              <div className="divide-y divide-white/[0.06] rounded-3xl border border-white/[0.08] bg-carbon px-4">
                {lines.map((line) => (
                  <CartLineItem key={line.id} line={line} compact />
                ))}
              </div>

              <div className="rounded-3xl border border-white/[0.08] bg-carbon p-4">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-ash">
                  Propina para el repartidor
                </p>
                <p className="mt-0.5 text-xs text-concrete">
                  Opcional. 100% va para quien te lleva el pedido.
                </p>
                <div className="mt-3 flex gap-2">
                  {[0, 2000, 4000, 6000].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTip(value)}
                      className={cn(
                        'flex-1 rounded-xl border py-2.5 text-xs font-bold transition',
                        tip === value
                          ? 'border-red bg-red text-white'
                          : 'border-white/10 text-ash hover:border-white/25',
                      )}
                    >
                      {value === 0 ? 'Sin propina' : money(value)}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                label="Notas del pedido"
                placeholder="Instrucciones para el repartidor o la cocina"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <CouponField />
            </section>
          )}

          {/* ------------------------------ PASO 3 ------------------------------ */}
          {step === 2 && (
            <section className="space-y-4">
              <h2 className="font-display text-xl text-bone">¿Cómo quieres pagar?</h2>

              <div className="flex items-start gap-2.5 rounded-2xl border border-yellow/25 bg-yellow/[0.06] p-3.5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-yellow" />
                <p className="text-xs leading-relaxed text-ash">
                  Pagos procesados por <span className="font-bold text-bone">ePayco</span>. Las
                  llaves privadas viven solo en el backend: tu información nunca toca el navegador
                  de forma insegura.
                </p>
              </div>

              <div className="space-y-2">
                {enabledMethods.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setMethod(option.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition',
                      method === option.id
                        ? 'border-red/60 bg-red/[0.08]'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/25',
                    )}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-lg">
                      {option.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-bone">{option.label}</span>
                      <span className="block text-xs text-ash">{option.description}</span>
                    </span>
                    <span
                      className={cn(
                        'grid size-5 shrink-0 place-items-center rounded-full border transition',
                        method === option.id ? 'border-red bg-red text-white' : 'border-white/25',
                      )}
                    >
                      {method === option.id && <Check className="size-3" strokeWidth={3.5} />}
                    </span>
                  </button>
                ))}
              </div>

              {method && settings.paymentMethods.find((m) => m.id === method)?.instructions && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-red/25 bg-red/[0.06] p-3.5">
                  <Info className="mt-0.5 size-4 shrink-0 text-red" />
                  <p className="text-xs text-ash">
                    {settings.paymentMethods.find((m) => m.id === method)?.instructions}
                  </p>
                </div>
              )}

              {!isGuest && account.points > 0 && (
                <div className="rounded-3xl border border-white/[0.08] bg-carbon p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-ash">
                      Canjear Street Points
                    </p>
                    <span className="text-xs font-bold text-red">{account.points} pts</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={maxPoints}
                    step={10}
                    value={pointsRedeemed}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="mt-3 w-full accent-[#FFD400]"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ash">
                      Usando <span className="font-bold text-bone">{pointsRedeemed}</span> pts
                    </span>
                    <span className="font-bold text-lime">- {money(pointsDiscount)}</span>
                  </div>
                </div>
              )}

              {isGuest && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
                  <p className="text-sm text-ash">
                    <Link to="/login" className="font-bold text-red underline-offset-2 hover:underline">
                      Inicia sesión
                    </Link>{' '}
                    para canjear puntos y guardar tu historial.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* ------------------------------ PASO 4 ------------------------------ */}
          {step === 3 && (
            <section className="space-y-4">
              <h2 className="font-display text-xl text-bone">Confirma y pide</h2>

              <div className="space-y-3 rounded-3xl border border-white/[0.08] bg-carbon p-4">
                <Row icon={<MapPin className="size-4" />} label="Entrega a domicilio">
                  {address ? `${address.label} · ${address.line}` : 'Sin dirección'}
                </Row>
                <Row icon={<CreditCard className="size-4" />} label="Pago">
                  {settings.paymentMethods.find((m) => m.id === method)?.label ?? 'Sin elegir'}
                </Row>
                <Row icon={<Wallet className="size-4" />} label="Productos">
                  {lines.length} referencias · {lines.reduce((a, l) => a + l.quantity, 0)} unidades
                </Row>
                {notes && (
                  <Row icon={<Info className="size-4" />} label="Notas">
                    {notes}
                  </Row>
                )}
              </div>

              <div className="flex items-center gap-3 rounded-3xl border border-white/[0.08] bg-carbon p-3">
                <SmartImage
                  src={lines[0].image}
                  alt={lines[0].name}
                  wrapperClassName="size-14 shrink-0 rounded-xl"
                  className="size-full"
                />
                <div className="min-w-0">
                  <p className="text-xs text-ash">
                    {lines[0].name}
                    {lines.length > 1 && ` y ${lines.length - 1} más`}
                  </p>
                  <p className="font-display text-lg text-red">{money(total)}</p>
                </div>
              </div>

              {pointsEarned > 0 && (
                <p className="rounded-2xl bg-red/[0.08] px-4 py-3 text-center text-xs font-bold text-red">
                  🎁 Ganarás {pointsEarned} Street Points con este pedido
                </p>
              )}
            </section>
          )}

          {/* Navegación de pasos */}
          <div className="flex gap-2 pt-2">
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)} className="flex-1">
                Atrás
              </Button>
            )}
            {step < 3 ? (
              <Button
                fullWidth
                size="lg"
                disabled={!canContinue()}
                iconRight={<ArrowRight className="size-4" />}
                onClick={() => setStep((s) => s + 1)}
              >
                Continuar
              </Button>
            ) : (
              <Button
                fullWidth
                size="lg"
                loading={submitting}
                disabled={!status.open}
                icon={<ShieldCheck className="size-4" />}
                onClick={submit}
              >
                {!status.open
                  ? CLOSED_MESSAGE
                  : submitting
                    ? 'Procesando pago...'
                    : `Confirmar pedido · ${money(total)}`}
              </Button>
            )}
          </div>
        </div>

        {/* Resumen lateral */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-white/[0.08] bg-carbon p-5">
            <h3 className="font-display text-sm uppercase tracking-wide text-bone">Resumen</h3>
            <div className="mt-4">
              <TotalsBreakdown />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Row({
  icon,
  label,
  children,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-ash">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-concrete">
          {label}
        </span>
        <span className="block text-sm text-bone">{children}</span>
      </span>
    </div>
  )
}
