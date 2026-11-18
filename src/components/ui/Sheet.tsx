import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  side?: 'bottom' | 'right'
  size?: 'md' | 'lg' | 'full'
  hideClose?: boolean
}

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  side = 'bottom',
  size = 'md',
  hideClose,
}: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  const widths = { md: 'sm:max-w-lg', lg: 'sm:max-w-3xl', full: 'sm:max-w-5xl' }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex" role="dialog" aria-modal="true">
          <motion.button
            type="button"
            aria-label="Cerrar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
          />

          <motion.div
            initial={side === 'bottom' ? { y: '100%' } : { x: '100%' }}
            animate={side === 'bottom' ? { y: 0 } : { x: 0 }}
            exit={side === 'bottom' ? { y: '100%' } : { x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.7 }}
            className={cn(
              'relative z-10 flex w-full flex-col border-white/10 bg-carbon',
              side === 'bottom'
                ? 'mt-auto max-h-[92dvh] rounded-t-[28px] border-t sm:mx-auto sm:mb-auto sm:mt-auto sm:max-h-[88dvh] sm:rounded-[28px] sm:border'
                : 'ml-auto h-full max-w-md border-l',
              side === 'bottom' && widths[size],
            )}
          >
            {side === 'bottom' && (
              <div className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-white/20 sm:hidden" />
            )}

            {(title || !hideClose) && (
              <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
                <div className="min-w-0">
                  {title && (
                    <h2 className="font-display text-lg leading-tight text-bone">{title}</h2>
                  )}
                  {subtitle && <p className="mt-0.5 text-xs text-ash">{subtitle}</p>}
                </div>
                {!hideClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="-mr-1 -mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-ash transition hover:bg-white/10 hover:text-bone active:scale-90"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            )}

            <div className="no-scrollbar flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
              {children}
            </div>

            {footer && (
              <div className="safe-bottom shrink-0 border-t border-white/10 bg-carbon/95 px-5 pb-4 pt-3 backdrop-blur">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
