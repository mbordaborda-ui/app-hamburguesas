import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

type Variant =
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'dark'
  | 'hot'
type Size = 'sm' | 'md' | 'lg' | 'xl'

const variants: Record<Variant, string> = {
  // Azul eléctrico: acción principal de la marca.
  primary:
    'bg-red text-white hover:bg-red-deep shadow-primary active:scale-[0.97] border border-red/40',
  // Naranja graffiti: energía, promos y urgencia.
  accent:
    'bg-orange text-ink hover:bg-orange-deep shadow-orange active:scale-[0.97] border border-orange/50',
  hot: 'bg-magenta text-white hover:bg-magenta/90 shadow-[0_10px_34px_-8px_rgba(255,45,122,0.7)] active:scale-[0.97]',
  // Crema: máximo contraste y legibilidad (checkout).
  secondary: 'bg-bone text-ink hover:bg-white active:scale-[0.97] border border-bone/20',
  outline:
    'border border-white/15 bg-white/[0.03] text-bone hover:border-red/70 hover:text-white hover:bg-red/10 active:scale-[0.97]',
  ghost: 'text-ash hover:text-bone hover:bg-white/[0.06] active:scale-[0.97]',
  danger: 'bg-magenta text-white hover:bg-magenta/90 active:scale-[0.97]',
  dark: 'bg-graphite text-bone border border-white/10 hover:border-white/25 active:scale-[0.97]',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[11px] gap-1.5 rounded-xl',
  md: 'h-11 px-4 text-[13px] gap-2 rounded-2xl',
  lg: 'h-13 px-6 text-[15px] gap-2.5 rounded-2xl',
  xl: 'h-15 px-7 text-[17px] gap-3 rounded-2xl',
}

interface BaseProps {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  loading?: boolean
  className?: string
  children: ReactNode
  icon?: ReactNode
  iconRight?: ReactNode
}

export interface ButtonProps
  extends BaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  as?: 'button'
}

const shell = (variant: Variant, size: Size, fullWidth?: boolean, className?: string) =>
  cn(
    // Lettering condensado de marca + microinteracción de presión.
    'relative inline-flex items-center justify-center font-display uppercase tracking-[0.06em] transition-all duration-200 select-none',
    'disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red',
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className,
  )

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  className,
  children,
  icon,
  iconRight,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={shell(variant, size, fullWidth, className)}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
      {!loading && iconRight}
    </button>
  )
}

export interface LinkButtonProps extends BaseProps {
  to: string
  replace?: boolean
}

export function LinkButton({
  to,
  replace,
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  children,
  icon,
  iconRight,
}: LinkButtonProps) {
  return (
    <Link to={to} replace={replace} className={shell(variant, size, fullWidth, className)}>
      {icon}
      {children}
      {iconRight}
    </Link>
  )
}

export function IconButton({
  className,
  children,
  label,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      {...rest}
      aria-label={label}
      className={cn(
        'relative inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-bone transition-all duration-200',
        'hover:border-red/60 hover:text-white hover:bg-red/10 active:scale-90',
        className,
      )}
    >
      {children}
    </button>
  )
}
