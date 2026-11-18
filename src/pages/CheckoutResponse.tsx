import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { LinkButton } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Feedback'
import { money } from '@/lib/format'
import { getPaymentGateway } from '@/services/payments'
import { useDb } from '@/store/db'
import type { PaymentStatus } from '@/types'

const FINAL: PaymentStatus[] = ['approved', 'rejected', 'cancelled', 'refunded']

export default function CheckoutResponse() {
  const [params] = useSearchParams()
  const reference = params.get('ref') ?? ''

  const payments = useDb((s) => s.payments)
  const orders = useDb((s) => s.orders)
  const setPaymentStatus = useDb((s) => s.setPaymentStatus)
  const setOrderStatus = useDb((s) => s.setOrderStatus)
  const patchOrder = useDb((s) => s.patchOrder)
  const pushNotification = useDb((s) => s.pushNotification)

  const payment = useMemo(
    () => payments.find((item) => item.providerRef === reference),
    [payments, reference],
  )
  const order = payment ? orders.find((item) => item.id === payment.orderId) : undefined

  const [status, setStatus] = useState<PaymentStatus>('pending')
  const [checking, setChecking] = useState(() => Boolean(reference))
  const synced = useRef(false)

  useEffect(() => {
    if (!reference) return
    if (synced.current) return
    synced.current = true

    let active = true
    const gateway = getPaymentGateway()

    const run = async () => {
      let resolved: PaymentStatus = 'pending'
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          resolved = await gateway.getStatus(reference)
        } catch {
          resolved = 'pending'
        }
        if (FINAL.includes(resolved)) break
        await new Promise((resolve) => setTimeout(resolve, 1200))
      }
      if (!active) return

      setStatus(resolved)
      setChecking(false)

      if (!payment) return
      setPaymentStatus(payment.id, resolved)
      if (resolved === 'approved') {
        setOrderStatus(payment.orderId, 'confirmed')
        patchOrder(payment.orderId, { paymentStatus: 'approved' })
        pushNotification({
          type: 'order',
          title: `Pago aprobado · ${order?.code ?? ''}`,
          body: 'Tu pedido entró a la cocina. 🔥',
          emoji: '✅',
          actionUrl: `/tracking/${payment.orderId}`,
        })
      } else if (resolved === 'rejected') {
        patchOrder(payment.orderId, { paymentStatus: 'rejected' })
        pushNotification({
          type: 'order',
          title: 'El pago no se pudo procesar',
          body: 'Puedes intentar de nuevo con otro método.',
          emoji: '⚠️',
          actionUrl: `/tracking/${payment.orderId}`,
        })
      }
    }

    void run()
    return () => {
      active = false
    }
  }, [reference, payment, order, setPaymentStatus, setOrderStatus, patchOrder, pushNotification])

  const view = (() => {
    if (!reference || !payment) {
      return {
        icon: <XCircle className="size-10 text-flame" />,
        title: 'No encontramos ese pago',
        body: 'El enlace puede haber expirado o pertenecer a otra sesión.',
      }
    }
    if (checking || status === 'pending' || status === 'processing') {
      return {
        icon: <Clock className="size-10 text-yellow" />,
        title: 'Confirmando tu pago…',
        body: 'Estamos verificando la transacción con ePayco. Un momento.',
      }
    }
    if (status === 'approved') {
      return {
        icon: <CheckCircle2 className="size-10 text-acid" />,
        title: '¡Pago aprobado!',
        body: 'Tu pedido ya está en la cocina. Te avisamos en cada paso.',
      }
    }
    return {
      icon: <XCircle className="size-10 text-flame" />,
      title: 'El pago fue rechazado',
      body: 'No pudimos procesar el cobro. Puedes intentar de nuevo con otro método.',
    }
  })()

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="rounded-[28px] border border-white/[0.08] bg-carbon p-6 text-center">
        <div className="grid place-items-center">
          {checking && reference && payment ? (
            <Spinner className="size-9 text-red" />
          ) : (
            view.icon
          )}
        </div>
        <h1 className="mt-4 font-display text-2xl text-bone">{view.title}</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-ash">{view.body}</p>

        {order && (
          <dl className="mt-5 space-y-1.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-left text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-ash">Pedido</dt>
              <dd className="font-display text-bone">{order.code}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ash">Total</dt>
              <dd className="font-display text-red">{money(order.total)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ash">Referencia</dt>
              <dd className="truncate text-xs text-concrete">{reference}</dd>
            </div>
          </dl>
        )}

        <div className="mt-5 space-y-2">
          {order && (
            <LinkButton to={`/tracking/${order.id}`} fullWidth size="lg">
              Ver seguimiento
            </LinkButton>
          )}
          {status === 'rejected' && (
            <LinkButton to="/checkout" fullWidth variant="outline" size="lg">
              Intentar de nuevo
            </LinkButton>
          )}
          <Link
            to="/menu"
            className="block pt-1 text-xs font-bold uppercase tracking-wider text-ash transition hover:text-red"
          >
            Volver al menú
          </Link>
        </div>
      </div>
    </div>
  )
}
