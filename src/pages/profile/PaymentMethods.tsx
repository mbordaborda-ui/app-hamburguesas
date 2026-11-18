import { ShieldCheck, Plus, Check } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'

export default function PaymentMethods() {
  const methods = useDb((s) => s.settings.paymentMethods)
  const updatePaymentMethod = useDb((s) => s.updatePaymentMethod)

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <PageHeader
        eyebrow="Pagos"
        title="Métodos de pago"
        description="Administra cómo quieres pagar tus pedidos. Los pagos son procesados por ePayco."
      />

      <div className="mb-5 flex items-start gap-3 rounded-3xl border border-yellow/25 bg-yellow/[0.06] p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-yellow" />
        <div>
          <p className="text-sm font-bold text-bone">Pago seguro de extremo a extremo</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ash">
            Nunca almacenamos datos de tarjetas. ePayco tokeniza la información y las llaves
            privadas viven únicamente en el backend.
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {methods.map((method) => (
          <li
            key={method.id}
            className={cn(
              'flex items-center gap-3 rounded-3xl border p-4 transition',
              method.enabled ? 'border-white/[0.1] bg-carbon' : 'border-white/[0.06] bg-carbon/50 opacity-70',
            )}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/[0.05] text-xl">
              {method.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-bone">{method.label}</p>
                {method.requiresBackend && <Pill tone="outline">ePayco</Pill>}
              </div>
              <p className="mt-0.5 text-xs text-ash">{method.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={method.enabled}
              aria-label={`Activar ${method.label}`}
              onClick={() => {
                updatePaymentMethod(method.id, { enabled: !method.enabled })
                toast({
                  title: method.enabled ? 'Método desactivado' : 'Método activado',
                  description: method.label,
                  emoji: method.emoji,
                  tone: method.enabled ? 'default' : 'success',
                })
              }}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                method.enabled ? 'bg-red' : 'bg-white/15',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 size-5 rounded-full bg-ink transition-all',
                  method.enabled ? 'left-[22px]' : 'left-0.5',
                )}
              />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-red/15 text-red">
            <Plus className="size-4" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-bone">Guardar una tarjeta</p>
            <p className="text-xs text-ash">
              La tokenización se hace en el backend con ePayco. Disponible al conectar el servidor.
            </p>
          </div>
        </div>
        <Button
          className="mt-4"
          variant="outline"
          fullWidth
          onClick={() =>
            toast({
              title: 'Disponible al conectar el backend',
              description: 'La arquitectura ya está lista para ePayco.',
              emoji: '💳',
            })
          }
          icon={<Check className="size-4" />}
        >
          Agregar tarjeta
        </Button>
      </div>
    </div>
  )
}
