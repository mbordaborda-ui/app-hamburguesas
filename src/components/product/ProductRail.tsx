import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductCard } from './ProductCard'
import type { Product } from '@/types'

export function ProductRail({
  title,
  subtitle,
  products,
  actionTo,
  actionLabel = 'Ver todo',
  accent,
}: {
  title: string
  subtitle?: string
  products: Product[]
  actionTo?: string
  actionLabel?: string
  accent?: ReactNode
}) {
  if (products.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 px-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-display text-lg leading-tight text-bone sm:text-2xl">
            {title}
            {accent}
          </h2>
          {subtitle && <p className="mt-0.5 text-xs text-ash sm:text-sm">{subtitle}</p>}
        </div>
        {actionTo && (
          <Link
            to={actionTo}
            className="flex shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-wider text-red transition hover:gap-2"
          >
            {actionLabel} <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>

      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:px-6 lg:hidden">
        {products.map((product) => (
          <div key={product.id} className="w-[46%] min-w-[160px] max-w-[220px] shrink-0 snap-start sm:w-[220px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <div className="hidden gap-4 px-4 sm:px-6 lg:grid lg:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
