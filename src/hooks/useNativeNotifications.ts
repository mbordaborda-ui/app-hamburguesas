import { useEffect, useRef } from 'react'
import { pushPermission, showLocalNotification } from '@/lib/push'
import { useDb } from '@/store/db'

/**
 * Puente entre las notificaciones in-app (`useDb.notifications`) y las
 * notificaciones del sistema. Cuando entra una notificación nueva y el usuario
 * dio permiso, la mostramos también fuera de la app.
 *
 * Es de solo lectura: observa el store, nunca lo modifica.
 */
export function useNativeNotifications() {
  const lastId = useRef<string | null>(null)

  useEffect(() => {
    // Arrancamos desde la más reciente para no disparar avisos viejos al abrir.
    lastId.current = useDb.getState().notifications[0]?.id ?? null

    return useDb.subscribe((state) => {
      const newest = state.notifications[0]
      if (!newest || newest.id === lastId.current) return
      lastId.current = newest.id

      if (pushPermission() !== 'granted') return

      void showLocalNotification({
        title: newest.title,
        body: newest.body,
        emoji: newest.emoji,
        actionUrl: newest.actionUrl,
        tag: newest.actionUrl ?? 'elparche',
      })
    })
  }, [])
}
