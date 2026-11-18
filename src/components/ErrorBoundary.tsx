import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw, Trash2, TriangleAlert } from 'lucide-react'
import { clearAppCache, storageAvailable } from '@/lib/safeStorage'

interface State {
  error: Error | null
}

/**
 * Nunca más una pantalla blanca: si algo falla en tiempo de ejecución,
 * mostramos una pantalla de recuperación con el error real y acciones
 * para desbloquear la app (recargar / limpiar caché y datos).
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[EL PARCHE] Error en tiempo de ejecución:', error, info.componentStack)
  }

  private reload = () => window.location.reload()

  private reset = async () => {
    await clearAppCache()
    window.location.reload()
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-dvh items-center justify-center bg-ink px-4 py-10">
        <div className="texture-concrete w-full max-w-lg rounded-[28px] border border-flame/30 bg-carbon p-6 sm:p-8">
          <span className="grid size-14 place-items-center rounded-2xl bg-flame/15 text-flame">
            <TriangleAlert className="size-7" />
          </span>

          <p className="mt-4 font-marker text-base text-red">Se quemó algo en la parrilla</p>
          <h1 className="mt-1 font-display text-2xl text-bone">
            La app no pudo arrancar
          </h1>
          <p className="mt-2 text-sm text-ash">
            Esto suele pasar por una versión vieja en caché o por datos corruptos guardados en el
            navegador. Prueba recargar; si sigue, limpia caché y datos.
          </p>

          <pre className="mt-4 max-h-40 overflow-auto rounded-2xl border border-white/10 bg-ink/70 p-3 text-[11px] leading-relaxed text-flame">
            {error.name}: {error.message}
          </pre>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={this.reload}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-red px-4 text-xs font-extrabold uppercase tracking-wider text-ink transition active:scale-95"
            >
              <RefreshCw className="size-4" /> Recargar
            </button>
            <button
              type="button"
              onClick={this.reset}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 px-4 text-xs font-extrabold uppercase tracking-wider text-bone transition hover:border-flame/50 hover:text-flame active:scale-95"
            >
              <Trash2 className="size-4" /> Limpiar caché
            </button>
          </div>

          {!storageAvailable() && (
            <p className="mt-4 rounded-2xl border border-red/30 bg-red/[0.08] p-3 text-xs text-ash">
              Tu navegador está bloqueando el almacenamiento local. La app funcionará, pero tu
              carrito y tus puntos no se guardarán al cerrar la pestaña.
            </p>
          )}
        </div>
      </div>
    )
  }
}
