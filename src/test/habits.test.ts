import { describe, expect, it } from 'vitest'
import { orderToLines, topProduct, usualOrder } from '@/lib/habits'
import type { Order, OrderItem } from '@/types'

const item = (productId: string, name: string, quantity = 1): OrderItem => ({
  id: `${productId}_${quantity}`,
  productId,
  name,
  image: '',
  unitPrice: 20000,
  quantity,
  selections: [],
})

const order = (
  items: OrderItem[],
  createdAt: string,
  status: Order['status'] = 'delivered',
): Order => ({ id: `o_${createdAt}`, items, createdAt, status }) as Order

describe('usualOrder', () => {
  it('sin historial no hay combo', () => {
    expect(usualOrder([])).toBeNull()
  })

  it('elige el combo más repetido', () => {
    const orders = [
      order([item('p1', 'LA CALLEJERA'), item('p2', 'PAPAS')], '2026-01-01T10:00:00Z'),
      order([item('p1', 'LA CALLEJERA'), item('p2', 'PAPAS')], '2026-02-01T10:00:00Z'),
      order([item('p3', 'LA CRIMINAL')], '2026-03-01T10:00:00Z'),
    ]
    const usual = usualOrder(orders)
    expect(usual?.times).toBe(2)
    expect(usual?.items.map((i) => i.productId).sort()).toEqual(['p1', 'p2'])
  })

  it('ignora pedidos cancelados', () => {
    const orders = [
      order([item('p1', 'LA CALLEJERA')], '2026-01-01T10:00:00Z', 'cancelled'),
    ]
    expect(usualOrder(orders)).toBeNull()
  })

  it('usa el pedido más reciente del grupo como representante', () => {
    const orders = [
      order([item('p1', 'LA CALLEJERA', 1)], '2026-01-01T10:00:00Z'),
      order([item('p1', 'LA CALLEJERA', 3)], '2026-05-01T10:00:00Z'),
    ]
    const usual = usualOrder(orders)
    expect(usual?.items[0].quantity).toBe(3)
  })
})

describe('topProduct', () => {
  it('suma cantidades entre pedidos', () => {
    const orders = [
      order([item('p1', 'LA CALLEJERA', 2)], '2026-01-01T10:00:00Z'),
      order([item('p2', 'PAPAS', 1)], '2026-02-01T10:00:00Z'),
      order([item('p1', 'LA CALLEJERA', 1)], '2026-03-01T10:00:00Z'),
    ]
    expect(topProduct(orders)?.productId).toBe('p1')
    expect(topProduct(orders)?.quantity).toBe(3)
  })
})

describe('orderToLines', () => {
  it('convierte items en líneas de carrito', () => {
    const lines = orderToLines([item('p1', 'LA CALLEJERA', 2)])
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({
      productId: 'p1',
      name: 'LA CALLEJERA',
      quantity: 2,
      basePrice: 20000,
      unitPrice: 20000,
    })
    expect(lines[0].id).toMatch(/^line_/)
  })
})
