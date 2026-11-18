import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface FieldProps {
  label?: string
  hint?: ReactNode
  error?: string | null
  icon?: ReactNode
}

export function Input({
  label,
  hint,
  error,
  icon,
  className,
  ...rest
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ash">
          {label}
        </span>
      )}
      <span className="relative flex items-center">
        {icon && <span className="absolute left-3.5 text-ash">{icon}</span>}
        <input
          {...rest}
          className={cn(
            'h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm text-bone placeholder:text-concrete',
            'transition focus:border-red/70 focus:bg-white/[0.05] focus:outline-none',
            icon && 'pl-10',
            error && 'border-flame/70',
            className,
          )}
        />
      </span>
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-flame">{error}</span>
      ) : (
        hint && <span className="mt-1.5 block text-xs text-concrete">{hint}</span>
      )}
    </label>
  )
}

export function Textarea({
  label,
  hint,
  error,
  className,
  ...rest
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ash">
          {label}
        </span>
      )}
      <textarea
        {...rest}
        className={cn(
          'w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-bone placeholder:text-concrete',
          'transition focus:border-red/70 focus:bg-white/[0.05] focus:outline-none',
          error && 'border-flame/70',
          className,
        )}
      />
      {hint && <span className="mt-1.5 block text-xs text-concrete">{hint}</span>}
    </label>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
  description?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <span className="min-w-0">
        {label && <span className="block text-sm font-semibold text-bone">{label}</span>}
        {description && <span className="block text-xs text-ash">{description}</span>}
      </span>
      <span
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-red' : 'bg-white/15',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-ink transition-all duration-200',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </span>
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; emoji?: string }[]
  className?: string
}) {
  return (
    <div
      className={cn(
        'no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1',
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-200',
            value === option.value
              ? 'bg-red text-white'
              : 'text-ash hover:bg-white/[0.06] hover:text-bone',
          )}
        >
          {option.emoji && <span className="mr-1">{option.emoji}</span>}
          {option.label}
        </button>
      ))}
    </div>
  )
}
