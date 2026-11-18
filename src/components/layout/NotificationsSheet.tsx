import { useNavigate } from 'react-router-dom'
import { BellOff, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { Sheet } from '@/components/ui/Sheet'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDb } from '@/store/db'
import { useUi } from '@/store/ui'

export function NotificationsSheet() {
  const open = useUi((s) => s.notificationsOpen)
  const setOpen = useUi((s) => s.setNotificationsOpen)
  const notifications = useDb((s) => s.notifications)
  const markAllRead = useDb((s) => s.markAllNotificationsRead)
  const markRead = useDb((s) => s.markNotificationRead)
  const navigate = useNavigate()

  const unread = notifications.filter((n) => !n.read).length

  return (
    <Sheet
      open={open}
      onClose={() => setOpen(false)}
      title="Notificaciones"
      subtitle={unread ? `${unread} sin leer` : 'Estás al día'}
      footer={
        notifications.length > 0 ? (
          <Button
            variant="outline"
            fullWidth
            onClick={markAllRead}
            icon={<CheckCheck className="size-4" />}
          >
            Marcar todo como leído
          </Button>
        ) : undefined
      }
    >
      {notifications.length === 0 ? (
        <EmptyState
          emoji="🔕"
          title="Sin notificaciones"
          description="Aquí verás el estado de tus pedidos, drops y recompensas."
        />
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => {
                  markRead(n.id)
                  if (n.actionUrl) {
                    setOpen(false)
                    navigate(n.actionUrl)
                  }
                }}
                className={cn(
                  'flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition',
                  n.read
                    ? 'border-white/[0.06] bg-white/[0.02]'
                    : 'border-red/30 bg-red/[0.06]',
                )}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-lg">
                  {n.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-bone">{n.title}</span>
                    {!n.read && <span className="size-2 shrink-0 rounded-full bg-red" />}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ash">{n.body}</span>
                  <span className="mt-1 block text-[10px] uppercase tracking-wider text-concrete">
                    {timeAgo(n.createdAt)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {notifications.length === 0 && (
        <div className="mt-4 flex justify-center text-concrete">
          <BellOff className="size-4" />
        </div>
      )}
    </Sheet>
  )
}
