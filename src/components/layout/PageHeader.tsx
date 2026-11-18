import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  back = true,
}: {
  eyebrow?: string
  title: string
  description?: ReactNode
  action?: ReactNode
  back?: boolean
}) {
  const navigate = useNavigate()
  return (
    <header className="mb-5">
      {back && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ash transition hover:text-red"
        >
          <ArrowLeft className="size-3.5" /> Volver
        </button>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {eyebrow && <p className="font-marker text-sm text-red">{eyebrow}</p>}
          <h1 className="font-display text-2xl text-bone sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 max-w-lg text-xs text-ash sm:text-sm">{description}</p>}
        </div>
        {action}
      </div>
    </header>
  )
}
