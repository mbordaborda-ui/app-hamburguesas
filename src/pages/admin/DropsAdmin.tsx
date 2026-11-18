import { AdminCard, DataTable } from '@/components/admin/AdminBits'
import { Button, IconButton } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/Feedback'
import { SmartImage } from '@/components/ui/SmartImage'
import { countdown, money } from '@/lib/format'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'

export default function DropsAdmin() {
  const drops = useDb((s) => s.drops)
  const upsertDrop = useDb((s) => s.upsertDrop)

  return (
    <div className="space-y-5">
      <AdminCard
        title="Drops activos"
        subtitle="Controla el inventario de las ediciones limitadas"
      >
        {drops.length === 0 ? (
          <p className="py-10 text-center text-xs text-concrete">No hay drops configurados.</p>
        ) : (
          <DataTable headers={['Drop', 'Precio', 'Inventario', 'Termina', 'Estado', 'Ajustar']}>
            {drops.map((drop) => {
              const soldOut = drop.remaining === 0
              return (
                <tr key={drop.id} className="border-b border-white/[0.05] last:border-0">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <SmartImage
                        src={drop.image}
                        alt={drop.name}
                        wrapperClassName="size-10 shrink-0 rounded-xl"
                        className="size-full"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-bone">
                          #{String(drop.dropNumber).padStart(3, '0')} {drop.name}
                        </p>
                        <p className="truncate text-[10px] text-concrete">{drop.tagline}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs font-bold text-red">{money(drop.price)}</td>
                  <td className="px-3 py-2.5">
                    <div className="w-32 space-y-1">
                      <span className="text-[10px] font-bold text-ash">
                        {drop.remaining}/{drop.total}
                      </span>
                      <ProgressBar
                        value={drop.remaining}
                        max={drop.total}
                        tone={soldOut ? 'flame' : 'volt'}
                        className="h-1.5"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-ash">{countdown(drop.endsAt)}</td>
                  <td className="px-3 py-2.5">
                    <Pill tone={soldOut ? 'flame' : drop.active ? 'lime' : 'neutral'}>
                      {soldOut ? 'Sold out' : drop.active ? 'Activo' : 'Pausado'}
                    </Pill>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <IconButton
                        label="Restar unidad"
                        className="size-8"
                        onClick={() =>
                          upsertDrop({ ...drop, remaining: Math.max(0, drop.remaining - 1) })
                        }
                      >
                        <span className="text-sm font-bold">−</span>
                      </IconButton>
                      <IconButton
                        label="Sumar unidad"
                        className="size-8"
                        onClick={() =>
                          upsertDrop({
                            ...drop,
                            remaining: Math.min(drop.total, drop.remaining + 1),
                          })
                        }
                      >
                        <span className="text-sm font-bold">+</span>
                      </IconButton>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          upsertDrop({ ...drop, active: !drop.active })
                          toast({
                            title: drop.active ? 'Drop pausado' : 'Drop activado',
                            description: drop.name,
                            emoji: drop.emoji,
                          })
                        }}
                      >
                        {drop.active ? 'Pausar' : 'Activar'}
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </DataTable>
        )}
      </AdminCard>

      <AdminCard title="Cómo funciona un drop" subtitle="Reglas de negocio">
        <ul className="space-y-2 text-xs text-ash">
          <li>· Cada drop se asocia a un producto del catálogo mediante <code className="text-red">dropId</code>.</li>
          <li>· El inventario baja automáticamente al confirmar cada pedido.</li>
          <li>· Al llegar a 0, el producto pasa a <span className="font-bold text-flame">SOLD OUT</span> y no se puede pedir.</li>
          <li>· Los niveles Street Boss y Legend reciben acceso anticipado de 24 horas.</li>
        </ul>
      </AdminCard>
    </div>
  )
}
