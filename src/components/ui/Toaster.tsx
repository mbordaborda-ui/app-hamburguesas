import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, Sparkles, TriangleAlert, X } from 'lucide-react'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/utils'

const toneStyles = {
  default: 'border-white/10 bg-graphite',
  success: 'border-acid/30 bg-acid/10',
  error: 'border-magenta/40 bg-magenta/10',
  reward: 'border-red/40 bg-red/10',
}

const toneIcon = {
  default: <Info className="size-4 text-yellow" />,
  success: <CheckCircle2 className="size-4 text-acid" />,
  error: <TriangleAlert className="size-4 text-magenta" />,
  reward: <Sparkles className="size-4 text-red" />,
}

export function Toaster() {
  const toasts = useUi((s) => s.toasts)
  const dismiss = useUi((s) => s.dismissToast)

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[120] flex flex-col items-center gap-2 px-3 sm:left-auto sm:right-4 sm:top-4 sm:items-end">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-pop backdrop-blur-xl',
              toneStyles[toast.tone ?? 'default'],
            )}
          >
            <span className="mt-0.5 shrink-0 text-lg">
              {toast.emoji ?? toneIcon[toast.tone ?? 'default']}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-bone">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-ash">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Cerrar notificación"
              className="shrink-0 text-concrete transition hover:text-bone"
            >
              <X className="size-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
