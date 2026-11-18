import { useNavigate } from 'react-router-dom'
import { ProductCard } from '@/components/product/ProductCard'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { PageHeader } from '@/components/layout/PageHeader'
import { useFavorites } from '@/hooks/useLoyalty'
import { useDb } from '@/store/db'

export default function Favorites() {
  const favorites = useFavorites()
  const products = useDb((s) => s.products)
  const navigate = useNavigate()

  const list = products.filter((p) => favorites.ids.includes(p.id))

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <PageHeader
        eyebrow="Tu selección"
        title="Favoritos"
        description={`${list.length} productos guardados para pedir en un toque`}
      />

      {list.length === 0 ? (
        <EmptyState
          emoji="❤️"
          title="Todavía no guardas favoritos"
          description="Toca el corazón en cualquier producto y aparecerá aquí."
          action={<Button onClick={() => navigate('/menu')}>Explorar el menú</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
