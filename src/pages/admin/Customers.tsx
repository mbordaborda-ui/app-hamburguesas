import { Trash2, UserCog } from 'lucide-react'
import { AdminCard, DataTable } from '@/components/admin/AdminBits'
import { IconButton } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Badge'
import { dateLabel, money } from '@/lib/format'
import { levelById } from '@/lib/loyalty'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'

export default function Customers() {
  const users = useDb((s) => s.users)
  const accounts = useDb((s) => s.accounts)
  const orders = useDb((s) => s.orders)
  const upsertUser = useDb((s) => s.upsertUser)
  const deleteUser = useDb((s) => s.deleteUser)

  return (
    <div className="space-y-5">
      <AdminCard
        title="Clientes"
        subtitle={`${users.length} registrados · ${users.filter((u) => u.role === 'admin').length} administradores`}
      >
        {users.length === 0 ? (
          <p className="py-10 text-center text-xs text-concrete">
            Aún no hay clientes registrados. Los usuarios aparecerán al crear su cuenta.
          </p>
        ) : (
          <DataTable headers={['Cliente', 'Nivel', 'Puntos', 'Pedidos', 'Gastado', 'Alta', '']}>
            {users.map((user) => {
              const account = accounts[user.id]
              const level = levelById(account?.level ?? 'rookie')
              const userOrders = orders.filter((o) => o.userId === user.id)
              return (
                <tr key={user.id} className="border-b border-white/[0.05] last:border-0">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        loading="lazy"
                        className="size-9 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-bone">{user.name}</p>
                        <p className="truncate text-[10px] text-concrete">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      <Pill tone="outline">
                        {level.emoji} {level.name}
                      </Pill>
                      {user.role !== 'customer' && (
                        <Pill tone={user.role === 'admin' ? 'grape' : user.role === 'kitchen' ? 'orange' : 'flame'}>
                          {user.role === 'admin'
                            ? '🛡️ Admin'
                            : user.role === 'kitchen'
                              ? '👨‍🍳 Cocina'
                              : '🛵 Domiciliario'}
                        </Pill>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs font-bold text-red">
                    {account?.points ?? 0}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-ash">{userOrders.length}</td>
                  <td className="px-3 py-2.5 text-xs text-ash">
                    {money(account?.totalSpent ?? 0)}
                  </td>
                  <td className="px-3 py-2.5 text-[10px] text-concrete">
                    {dateLabel(user.createdAt)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      <IconButton
                        label="Cambiar rol"
                        className="size-8"
                        onClick={() => {
                          // Cliente → Domiciliario → Cocina → Admin → Cliente
                          const next =
                            user.role === 'customer'
                              ? 'courier'
                              : user.role === 'courier'
                                ? 'kitchen'
                                : user.role === 'kitchen'
                                  ? 'admin'
                                  : 'customer'
                          upsertUser({ ...user, role: next })
                          toast({
                            title:
                              next === 'admin'
                                ? 'Ahora es admin'
                                : next === 'courier'
                                  ? 'Ahora es domiciliario'
                                  : next === 'kitchen'
                                    ? 'Ahora es cocina'
                                    : 'Rol de cliente',
                            description: user.name,
                            emoji:
                              next === 'courier'
                                ? '🛵'
                                : next === 'kitchen'
                                  ? '👨‍🍳'
                                  : next === 'admin'
                                    ? '🛡️'
                                    : '👤',
                          })
                        }}
                      >
                        <UserCog className="size-3.5" />
                      </IconButton>
                      <IconButton
                        label="Eliminar cliente"
                        className="size-8 hover:border-flame/50 hover:text-flame"
                        onClick={() => {
                          deleteUser(user.id)
                          toast({ title: 'Cliente eliminado', description: user.name, tone: 'error' })
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              )
            })}
          </DataTable>
        )}
      </AdminCard>
    </div>
  )
}
