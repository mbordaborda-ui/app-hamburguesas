/**
 * Utilidades HTTP mínimas para el backend (sin dependencias).
 */

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS })
  res.end(JSON.stringify(data))
}

export function sendHtml(res, status, html) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', ...CORS_HEADERS })
  res.end(html)
}

export function sendRedirect(res, location) {
  res.writeHead(303, { Location: location, ...CORS_HEADERS })
  res.end()
}

export function sendNoContent(res) {
  res.writeHead(204, CORS_HEADERS)
  res.end()
}

/** Lee el cuerpo y lo parsea como JSON o como formulario (según content-type). */
export function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 2_000_000) {
        req.destroy()
        reject(new Error('payload demasiado grande'))
      }
    })
    req.on('end', () => {
      if (!raw) return resolve({})
      const type = req.headers['content-type'] ?? ''
      if (type.includes('application/json')) {
        try {
          resolve(JSON.parse(raw))
        } catch {
          resolve({})
        }
      } else {
        resolve(Object.fromEntries(new URLSearchParams(raw)))
      }
    })
    req.on('error', reject)
  })
}
