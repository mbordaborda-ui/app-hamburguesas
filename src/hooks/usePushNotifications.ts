import { useCallback, useEffect, useState } from 'react'
import {
  pushConfigured,
  pushPermission,
  pushSupported,
  requestPushPermission,
  subscribeToPush,
  type PushPermission,
} from '@/lib/push'

/**
 * Estado del permiso de notificaciones y acción para activarlas.
 * Si el usuario acepta, además intenta registrar la suscripción de push real
 * (queda inactiva hasta que exista backend + `VITE_VAPID_PUBLIC_KEY`).
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>(() => pushPermission())
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const sync = () => setPermission(pushPermission())
    sync()
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('focus', sync)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('focus', sync)
    }
  }, [])

  const enable = useCallback(async () => {
    setBusy(true)
    try {
      const result = await requestPushPermission()
      setPermission(result)
      if (result === 'granted') await subscribeToPush()
      return result
    } finally {
      setBusy(false)
    }
  }, [])

  return {
    supported: pushSupported(),
    configured: pushConfigured(),
    permission,
    busy,
    enable,
  }
}
