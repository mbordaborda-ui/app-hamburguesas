/**
 * Cliente HTTP único de la app.
 *
 * Toda la app habla con el backend a través de `api` (ver services/api.ts),
 * y `api` usa este cliente cuando `VITE_API_URL` está definido. De esa forma
 * pasar de la capa local (demo/PWA offline) a un backend real es cambiar una
 * variable de entorno, sin tocar componentes.
 */

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

/**
 * Backend dedicado de pagos/pedidos (server/). Permite usar ePayco real sin
 * migrar toda la app a remoto: si solo defines `VITE_PAYMENTS_API_URL`, los
 * pagos van al backend y el resto de datos siguen en modo local.
 */
export const PAYMENTS_API_URL = (import.meta.env.VITE_PAYMENTS_API_URL as string | undefined) ?? ''

export const isRemote = Boolean(API_URL)

import { tokenStore } from '@/lib/safeStorage'

export { tokenStore }

export class ApiError extends Error {
  status: number
  code?: string
  constructor(message: string, status = 500, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  /** Fuerza una base distinta (ej. el backend de pagos). */
  baseUrl?: string
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, headers, baseUrl, ...rest } = options

  const root = baseUrl ?? API_URL
  const url = new URL(`${root}${path}`, root || window.location.origin)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }

  const token = tokenStore.get()

  const response = await fetch(url.toString(), {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    let message = `Error ${response.status}`
    let code: string | undefined
    try {
      const data = (await response.json()) as { message?: string; error?: string }
      message = data.message ?? data.error ?? message
      code = data.error
    } catch {
      /* respuesta sin JSON */
    }
    throw new ApiError(message, response.status, code)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
