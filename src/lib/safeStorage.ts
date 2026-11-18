import type { StateStorage } from 'zustand/middleware'

/**
 * Almacenamiento tolerante a fallos.
 *
 * Si el navegador bloquea `localStorage` (modo privado, cookies bloqueadas,
 * políticas de empresa, iframes restringidos), el acceso lanza una excepción
 * que rompería la inicialización de los stores y dejaría la pantalla en blanco.
 * Aquí caemos a memoria para que la app siempre arranque.
 */

const memory = new Map<string, string>()

let available: boolean | null = null

export const storageAvailable = () => {
  if (available !== null) return available
  try {
    const key = '__elparche_probe__'
    window.localStorage.setItem(key, '1')
    window.localStorage.removeItem(key)
    available = true
  } catch {
    available = false
  }
  return available
}

export const safeGet = (name: string): string | null => {
  try {
    if (storageAvailable()) return window.localStorage.getItem(name)
  } catch {
    /* bloqueado */
  }
  return memory.get(name) ?? null
}

export const safeSet = (name: string, value: string): void => {
  try {
    if (storageAvailable()) {
      window.localStorage.setItem(name, value)
      return
    }
  } catch {
    /* bloqueado */
  }
  memory.set(name, value)
}

export const safeRemove = (name: string): void => {
  try {
    if (storageAvailable()) window.localStorage.removeItem(name)
  } catch {
    /* bloqueado */
  }
  memory.delete(name)
}

/** Adaptador para zustand/persist. */
export const safeStorage: StateStorage = {
  getItem: safeGet,
  setItem: safeSet,
  removeItem: safeRemove,
}

/** Token de sesión, también a prueba de bloqueos. */
export const tokenStore = {
  get: () => safeGet('elparche:token'),
  set: (token: string) => safeSet('elparche:token', token),
  clear: () => safeRemove('elparche:token'),
}

/** Credenciales demo (solo modo local). */
export const credentialStore = {
  read: (): Record<string, { password: string; userId: string }> => {
    try {
      return JSON.parse(safeGet('elparche:credentials') ?? '{}')
    } catch {
      return {}
    }
  },
  write: (map: Record<string, { password: string; userId: string }>) => {
    safeSet('elparche:credentials', JSON.stringify(map))
  },
}

/**
 * Limpia service workers y cachés. Es la cura para la pantalla blanca causada
 * por un service worker que sirve un `index.html` viejo apuntando a assets
 * que ya no existen.
 */
export async function clearAppCache(options: { keepData?: boolean } = {}) {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
    }
  } catch {
    /* ignorar */
  }

  if (!options.keepData) {
    try {
      window.localStorage.clear()
      window.sessionStorage.clear()
    } catch {
      /* ignorar */
    }
  }
}

export const isServiceWorkerActive = async () => {
  try {
    if (!('serviceWorker' in navigator)) return false
    const registrations = await navigator.serviceWorker.getRegistrations()
    return registrations.length > 0
  } catch {
    return false
  }
}
