import { forwardRef, type ReactNode } from 'react'

/**
 * Stub de framer-motion para pruebas: evita animaciones reales (y sus
 * AbortError) manteniendo la misma API que usa la app.
 */
const FRAMER_PROPS = new Set([
  'initial',
  'animate',
  'exit',
  'transition',
  'variants',
  'layout',
  'layoutId',
  'whileHover',
  'whileTap',
  'whileFocus',
  'whileDrag',
  'whileInView',
  'drag',
  'dragConstraints',
  'dragElastic',
  'onAnimationComplete',
  'onAnimationStart',
  'style',
])

export const motion = new Proxy(
  {},
  {
    get: (_target, tag: string) => {
      const Component = forwardRef<HTMLElement, Record<string, unknown>>((props, ref) => {
        const clean: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(props)) {
          if (!FRAMER_PROPS.has(key)) clean[key] = value
        }
        const Tag = tag as 'div'
        return (
          <Tag ref={ref as never} {...(clean as Record<string, never>)}>
            {props.children as ReactNode}
          </Tag>
        )
      })
      Component.displayName = `motion.${tag}`
      return Component
    },
  },
) as Record<string, ReturnType<typeof forwardRef>>

export function AnimatePresence({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

export const useReducedMotion = () => false
