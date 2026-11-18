import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { AdminCard, DataTable } from '@/components/admin/AdminBits'
import { Button, IconButton } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Badge'
import { Input, Segmented, Switch, Textarea } from '@/components/ui/Input'
import { Sheet } from '@/components/ui/Sheet'
import { SmartImage } from '@/components/ui/SmartImage'
import { money } from '@/lib/format'
import { slugify, uid } from '@/lib/utils'
import { useDb } from '@/store/db'
import { toast } from '@/store/ui'
import type { Product } from '@/types'

const emptyProduct = (categoryId: string): Product => ({
  id: uid('p'),
  slug: '',
  name: '',
  tagline: '',
  description: '',
  price: 0,
  image: '',
  categoryId,
  rating: 5,
  reviewsCount: 0,
  tags: [],
  badges: [],
  spicy: 0,
  isAvailable: true,
  prepMinutes: 15,
  ingredients: [],
  optionGroups: [],
})

export default function Products() {
  const products = useDb((s) => s.products)
  const categories = useDb((s) => s.categories)
  const upsertProduct = useDb((s) => s.upsertProduct)
  const deleteProduct = useDb((s) => s.deleteProduct)
  const toggleProductAvailability = useDb((s) => s.toggleProductAvailability)

  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todas')
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<Product | null>(null)

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (categoryFilter === 'todas' || p.categoryId === categoryFilter) &&
          p.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [products, query, categoryFilter],
  )

  const openEditor = (product: Product) => {
    setEditing(product)
    setForm({ ...product })
  }

  const save = () => {
    if (!form || !form.name.trim()) return
    const finalProduct: Product = {
      ...form,
      slug: form.slug || slugify(form.name),
      image: form.image || '/img/photo-1568901346375-23c9450c58cd.jpg',
    }
    upsertProduct(finalProduct)
    toast({ title: editing?.name ? 'Producto actualizado' : 'Producto creado', description: finalProduct.name, emoji: '🍔', tone: 'success' })
    setForm(null)
    setEditing(null)
  }

  return (
    <div className="space-y-5">
      <AdminCard
        title="Catálogo"
        subtitle={`${products.length} productos · ${products.filter((p) => !p.isAvailable).length} pausados`}
        action={
          <Button
            size="sm"
            icon={<Plus className="size-4" />}
            onClick={() => {
              setEditing(null)
              setForm(emptyProduct(categories[0]?.id ?? 'cat_burgers'))
            }}
          >
            Nuevo
          </Button>
        }
      >
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ash" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto..."
              className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-10 pr-3 text-sm text-bone placeholder:text-concrete focus:border-red/70 focus:outline-none"
            />
          </div>
          <Segmented
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: 'todas', label: 'Todas' },
              ...categories.map((c) => ({ value: c.id, label: c.name, emoji: c.emoji })),
            ]}
          />
        </div>

        <DataTable headers={['Producto', 'Categoría', 'Precio', 'Ventas', 'Estado', '']}>
          {filtered.map((product) => (
            <tr key={product.id} className="border-b border-white/[0.05] last:border-0">
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <SmartImage
                    src={product.image}
                    alt={product.name}
                    wrapperClassName="size-10 shrink-0 rounded-xl"
                    className="size-full"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-bone">{product.name}</p>
                    <p className="truncate text-[10px] text-concrete">{product.tagline}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2.5 text-xs text-ash">
                {categories.find((c) => c.id === product.categoryId)?.name ?? '—'}
              </td>
              <td className="px-3 py-2.5 text-xs font-bold text-red">{money(product.price)}</td>
              <td className="px-3 py-2.5 text-xs text-ash">{product.reviewsCount}</td>
              <td className="px-3 py-2.5">
                <button type="button" onClick={() => toggleProductAvailability(product.id)}>
                  <Pill tone={product.isAvailable ? 'lime' : 'flame'}>
                    {product.isAvailable ? 'Disponible' : 'Pausado'}
                  </Pill>
                </button>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex justify-end gap-1.5">
                  <IconButton label="Editar" className="size-8" onClick={() => openEditor(product)}>
                    <Pencil className="size-3.5" />
                  </IconButton>
                  <IconButton
                    label="Eliminar"
                    className="size-8 hover:border-flame/50 hover:text-flame"
                    onClick={() => {
                      deleteProduct(product.id)
                      toast({ title: 'Producto eliminado', description: product.name, tone: 'default' })
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </IconButton>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>

        {filtered.length === 0 && (
          <p className="py-8 text-center text-xs text-concrete">Sin resultados.</p>
        )}
      </AdminCard>

      <Sheet
        open={Boolean(form)}
        onClose={() => {
          setForm(null)
          setEditing(null)
        }}
        title={editing ? 'Editar producto' : 'Nuevo producto'}
        subtitle="Los cambios se reflejan al instante en la tienda"
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => {
                setForm(null)
                setEditing(null)
              }}
            >
              Cancelar
            </Button>
            <Button fullWidth onClick={save}>
              Guardar producto
            </Button>
          </div>
        }
      >
        {form && (
          <div className="space-y-3 pb-2">
            {form.image && (
              <SmartImage
                src={form.image}
                alt={form.name || 'Vista previa'}
                wrapperClassName="aspect-[16/9] w-full rounded-2xl"
                className="size-full"
              />
            )}
            <Input
              label="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Frase corta"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            />
            <Textarea
              label="Descripción"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Input
              label="URL de imagen"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Precio"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
              <Input
                label="Precio anterior"
                type="number"
                value={form.compareAtPrice ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    compareAtPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Minutos de preparación"
                type="number"
                value={form.prepMinutes}
                onChange={(e) => setForm({ ...form, prepMinutes: Number(e.target.value) })}
              />
              <Input
                label="Stock (opcional)"
                type="number"
                value={form.stock ?? ''}
                onChange={(e) =>
                  setForm({ ...form, stock: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </div>
            <div>
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ash">
                Categoría
              </span>
              <Segmented
                value={form.categoryId}
                onChange={(value) => setForm({ ...form, categoryId: value })}
                options={categories.map((c) => ({ value: c.id, label: c.name, emoji: c.emoji }))}
              />
            </div>
            <div>
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ash">
                Nivel de picante
              </span>
              <Segmented
                value={String(form.spicy)}
                onChange={(value) => setForm({ ...form, spicy: Number(value) as Product['spicy'] })}
                options={[
                  { value: '0', label: 'Sin picante' },
                  { value: '1', label: '🌶️ Suave' },
                  { value: '2', label: '🌶️🌶️ Medio' },
                  { value: '3', label: '🌶️🌶️🌶️ Fuerte' },
                ]}
              />
            </div>
            <Input
              label="Etiquetas (separadas por coma)"
              value={form.tags.join(', ')}
              onChange={(e) =>
                setForm({
                  ...form,
                  tags: e.target.value
                    .split(',')
                    .map((t) => t.trim().toLowerCase())
                    .filter(Boolean),
                })
              }
            />
            <Input
              label="Ingredientes (separados por coma)"
              value={form.ingredients.join(', ')}
              onChange={(e) =>
                setForm({
                  ...form,
                  ingredients: e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
            />
            <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
              <Switch
                checked={form.isAvailable}
                onChange={(value) => setForm({ ...form, isAvailable: value })}
                label="Disponible para pedir"
                description="Si lo apagas, no aparece disponible en la tienda"
              />
              <Switch
                checked={Boolean(form.isBestSeller)}
                onChange={(value) => setForm({ ...form, isBestSeller: value })}
                label="Marcar como más vendido"
              />
              <Switch
                checked={Boolean(form.isNew)}
                onChange={(value) => setForm({ ...form, isNew: value })}
                label="Marcar como nuevo"
              />
              <Switch
                checked={Boolean(form.isSecret)}
                onChange={(value) => setForm({ ...form, isSecret: value })}
                label="Menú secreto"
                description="Solo visible al desbloquear el nivel"
              />
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
