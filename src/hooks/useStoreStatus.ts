import { useEffect, useMemo, useState } from 'react'
import { storeStatus, type StoreStatus } from '@/lib/hours'
import { useDb } from '@/store/db'

/**
 * Estado de apertura reactivo: se recalcula cada 30 s para que la app pase a
 * "Cerrado" (y bloquee el checkout) en cuanto llega la hora de cierre.
 */
export function useStoreStatus(): StoreStatus {
  const settings = useDb((s) => s.settings)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [])

  return useMemo(() => storeStatus(settings, now), [settings, now])
}
