import { cn } from '@/lib/utils'

/**
 * Wordmark EL PARCHE: lettering condensado con contorno, volumen y
 * degradado azul eléctrico (color de identidad) + trazo de aerosol naranja.
 */
export function Logo({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-[26px]',
    lg: 'text-4xl',
  }
  // A tamaños pequeños el contorno se afina para no comerse las letras.
  const heavy = size === 'lg' ? 'tag-3d' : 'tag-3d-sm'
  const light = size === 'lg' ? 'tag-outline' : 'tag-outline-sm'
  return (
    <span className={cn('inline-flex flex-col leading-none', className)}>
      <span className={cn('font-display uppercase tracking-[-0.01em]', sizes[size])}>
        <span className={cn(light, 'text-bone')}>EL</span>
        <span className={cn(heavy, 'tag-fill-blue')}>PARCHE</span>
      </span>
      <svg
        viewBox="0 0 120 9"
        className="mt-0.5 h-1.5 w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="logo-spray" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFD21F" />
            <stop offset="52%" stopColor="#FF6A00" />
            <stop offset="100%" stopColor="#FF2D7A" />
          </linearGradient>
        </defs>
        <path
          d="M1 6.2C17 2.2 33 7.6 51 5.1S87 1.6 118 4.6"
          fill="none"
          stroke="url(#logo-spray)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

/** Marca compacta para móvil: calcomanía circular con la burger. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative grid size-10 place-items-center rounded-2xl border-2 border-ink bg-red text-lg shadow-primary',
        className,
      )}
      aria-hidden
    >
      <span className="sticker-print pointer-events-none absolute inset-0 rounded-2xl opacity-40 mix-blend-multiply" />
      <span className="relative">🍔</span>
    </span>
  )
}
