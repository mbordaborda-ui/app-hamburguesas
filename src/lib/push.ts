/**
 * Notificaciones nativas (Web Notifications API).
 *
 * Dos caminos:
 *
 * 1. **Local (sin backend).** Mientras la pestaña esté viva —en primer plano o
 *    en segundo plano— `showLocalNotification` muestra la notificación del
 *    sistema. Es lo que usa la app hoy para avisar "tu pedido va en camino".
 * 2. **Push real (con backend).** El service worker (`public/sw-push.js`) ya
 *    escucha el evento `push`, así que si el backend envía el mensaje con
 *    Web Push, el aviso llega **con la app cerrada**. Para activarlo hace falta
 *    un backend con llaves VAPID y definir `VITE_VAPID_PUBLIC_KEY`.
 *
 * Nada de esto es obligatorio: si el navegador no soporta notificaciones o el
 * usuario no da permiso, todo se resuelve en silencio.
 */

import { API_URL, request } from '@/services/http'

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported'

export interface PushMessage {
  title: string
  body: string
  emoji?: string
  actionUrl?: string
  /** Agrupa avisos del mismo pedido: el nuevo reemplaza al anterior. */
  tag?: string
}

const ICON = '/pwa-192x192.png'
const DEFAULT_TAG = 'elparche'

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof Notification !== 'undefined' &&
    'Notification' in window
  )
}

export function pushPermission(): PushPermission {
  if (!pushSupported()) return 'unsupported'
  return Notification.permission as PushPermission
}

export async function requestPushPermission(): Promise<PushPermission> {
  if (!pushSupported()) return 'unsupported'
  try {
    return (await Notification.requestPermission()) as PushPermission
  } catch {
    return 'denied'
  }
}

/**
 * Devuelve el service worker activo, si existe. Se evita `navigator.serviceWorker.ready`
 * porque nunca resuelve cuando no hay ningún SW registrado (por ejemplo en `npm run dev`).
 */
async function serviceWorkerRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return undefined
  try {
    return (await navigator.serviceWorker.getRegistration()) ?? undefined
  } catch {
    return undefined
  }
}

/** Muestra una notificación del sistema. Devuelve `false` si no se pudo. */
export async function showLocalNotification(message: PushMessage): Promise<boolean> {
  if (pushPermission() !== 'granted') return false

  const title = message.emoji ? `${message.emoji} ${message.title}` : message.title
  const options: NotificationOptions = {
    body: message.body,
    icon: ICON,
    badge: ICON,
    tag: message.tag ?? DEFAULT_TAG,
    data: { url: message.actionUrl ?? '/' },
  }

  const registration = await serviceWorkerRegistration()
  if (registration) {
    try {
      await registration.showNotification(title, options)
      return true
    } catch {
      /* cae al Notification de la página */
    }
  }

  try {
    const notification = new Notification(title, options)
    notification.onclick = () => {
      window.focus()
      if (message.actionUrl) window.location.assign(message.actionUrl)
      notification.close()
    }
    return true
  } catch {
    return false
  }
}

/** ¿Hay llave VAPID configurada para el push real? */
export function pushConfigured(): boolean {
  return Boolean(import.meta.env.VITE_VAPID_PUBLIC_KEY)
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(normalized)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

/**
 * Registra la suscripción de Web Push y la envía al backend.
 *
 * Sin `VITE_VAPID_PUBLIC_KEY` (o sin backend) devuelve `false`: la app sigue
 * funcionando solo con notificaciones locales.
 */
export async function subscribeToPush(): Promise<boolean> {
  if (pushPermission() !== 'granted') return false
  if (!pushConfigured()) return false

  const registration = await serviceWorkerRegistration()
  if (!registration || !('pushManager' in registration)) return false

  try {
    const existing = await registration.pushManager.getSubscription()
    if (existing) return true

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
    })

    if (API_URL) {
      await request('/notifications/subscribe', {
        method: 'POST',
        body: subscription.toJSON(),
      })
    }

    return true
  } catch {
    return false
  }
}
