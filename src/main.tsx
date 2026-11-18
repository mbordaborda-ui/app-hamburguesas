import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from '@/App'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import '@/index.css'

/**
 * Cuando un deploy nuevo cambia los nombres de los chunks, un service worker
 * viejo puede servir un `index.html` que pide archivos que ya no existen.
 * Eso produce una pantalla blanca con "Failed to fetch dynamically imported
 * module". Aquí recargamos una única vez para que la app se recupere sola.
 */
window.addEventListener('vite:preloadError', () => {
  const key = 'elparche:preload-recovery'
  try {
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch {
    /* almacenamiento bloqueado: recargamos igual */
  }
  window.location.reload()
})

const container = document.getElementById('root')

if (!container) {
  document.body.innerHTML =
    '<div style="min-height:100vh;display:grid;place-items:center;background:#0A0A0A;color:#F5F5F5;font-family:sans-serif">No se encontró el contenedor #root</div>'
} else {
  createRoot(container).render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>,
  )
}
