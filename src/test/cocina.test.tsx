import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'
import { useAuth } from '@/store/auth'
import { useCart } from '@/store/cart'
import { useDb } from '@/store/db'
import type { Order, User } from '@/types'

const kitchenUser: User = {
  id: 'u_kitchen',
  name: 'Cocina Parche',
  email: 'cocina@elparche.co',
  avatar: 'https://i.pravatar.cc/150?u=kitchen',
  createdAt: new Date().toISOString(),
  provider: 'email',
  role: 'kitchen',
  referralCode: 'COCINA123',
}

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'ord_cocina',
  code: 'EP-5555',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'confirmed',
  statusHistory: [{ status: 'confirmed', at: new Date().toISOString() }],
  items: [
    {
      id: 'it_burger',
      productId: 'custom_burger',
      name: 'BURGER A TU GUSTO',
      image: '/img/hero-burger.jpg',
      unitPrice: 32900,
      quantity: 1,
      selections: [
        { groupId: 'g_patty', groupName: 'Carne', optionId: 'patty_double', name: 'Doble 300 g', price: 12000 },
        { groupId: 'g_toppings', groupName: 'Toppings', optionId: 'top_bacon', name: 'Bacon', price: 4000 },
        {
          groupId: 'g_toppings',
          groupName: 'Toppings',
          optionId: 'top_onion',
          name: 'Cebolla caramelizada',
          price: 2500,
        },
      ],
      notes: 'Sin pepinillos',
    },
    {
      id: 'it_cola',
      productId: 'p_cola',
      name: 'GASEOSA 400ML',
      image: '/img/photo-1554866585-cd94860890b7.jpg',
      unitPrice: 5500,
      quantity: 2,
      selections: [],
    },
  ],
  subtotal: 43900,
  discount: 0,
  deliveryFee: 6900,
  tip: 0,
  total: 50800,
  address: { id: 'addr_1', label: 'Casa', line: 'Calle 100 #15-20', city: 'Bogotá' },
  paymentMethodId: 'cash',
  paymentStatus: 'pending',
  pointsEarned: 0,
  pointsRedeemed: 0,
  etaMinutes: 28,
  deliveryMode: 'delivery',
  reviewed: false,
  ...overrides,
})

function renderApp(route = '/cocina') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useDb.getState().resetDemoData()
  useCart.setState({ lines: [], couponCode: null, pointsRedeemed: 0, tip: 0 })
  useAuth.setState({ user: null, status: 'idle', error: null })
})

describe('Módulo de cocina', () => {
  it('muestra el detalle exacto del pedido y los adicionales', async () => {
    useDb.getState().addOrder(makeOrder())
    useAuth.setState({ user: kitchenUser })

    renderApp()

    expect(await screen.findByText('COCINA')).toBeTruthy()
    expect(screen.getByText('EP-5555')).toBeTruthy()
    expect(screen.getByText(/Doble 300 g/)).toBeTruthy()
    expect(screen.getByText(/Bacon/)).toBeTruthy()
    expect(screen.getByText(/Sin pepinillos/)).toBeTruthy()
    expect(screen.getByText(/Adicionales/)).toBeTruthy()
    expect(screen.getByText(/GASEOSA 400ML/)).toBeTruthy()
  })

  it('confirma ítem por ítem y luego toda la orden', async () => {
    const user = userEvent.setup()
    useDb.getState().addOrder(makeOrder())
    useAuth.setState({ user: kitchenUser })

    renderApp()

    await user.click(await screen.findByRole('button', { name: /empezar a preparar/i }))
    await waitFor(() => expect(useDb.getState().orders[0].status).toBe('preparing'))

    // Confirmar el ítem preparado (uno por uno)
    await user.click(await screen.findByRole('button', { name: /marcar preparado/i }))
    await waitFor(() =>
      expect(useDb.getState().orders[0].preparedItems).toContain('it_burger'),
    )

    // Confirmar toda la orden
    await user.click(await screen.findByRole('button', { name: /confirmar toda la orden/i }))
    await waitFor(() => expect(useDb.getState().orders[0].status).toBe('ready'))
  })

  it('permite marcar los adicionales como empacados', async () => {
    const user = userEvent.setup()
    useDb.getState().addOrder(makeOrder({ status: 'ready' }))
    useAuth.setState({ user: kitchenUser })

    renderApp()

    await user.click(await screen.findByRole('button', { name: /listos/i }))
    await user.click(await screen.findByRole('button', { name: /gaseosa/i }))

    await waitFor(() => {
      expect(useDb.getState().orders[0].packedItems).toContain('it_cola')
    })
  })

  it('confirma el pedido listo después de empacar los adicionales', async () => {
    const user = userEvent.setup()
    useDb.getState().addOrder(makeOrder({ status: 'ready' }))
    useAuth.setState({ user: kitchenUser })

    renderApp()

    await user.click(await screen.findByRole('button', { name: /listos/i }))
    // Aún sin empacar: el botón de confirmar está deshabilitado.
    const confirmDisabled = screen.getByRole('button', {
      name: /empaca los adicionales/i,
    }) as HTMLButtonElement
    expect(confirmDisabled.disabled).toBe(true)

    await user.click(await screen.findByRole('button', { name: /gaseosa/i }))
    await user.click(await screen.findByRole('button', { name: /confirmar listo/i }))

    await waitFor(() => {
      expect(useDb.getState().orders[0].readyConfirmedAt).toBeTruthy()
    })
  })

  it('muestra la receta completa de la hamburguesa', async () => {
    useDb.getState().addOrder(
      makeOrder({
        items: [
          {
            id: 'it_callejera',
            productId: 'p_callejera',
            name: 'LA CALLEJERA',
            image: '/img/photo-1568901346375-23c9450c58cd.jpg',
            unitPrice: 24900,
            quantity: 1,
            selections: [],
          },
        ],
      }),
    )
    useAuth.setState({ user: kitchenUser })

    renderApp()

    expect(await screen.findByText('LA CALLEJERA')).toBeTruthy()
    expect(screen.getByText('Pan brioche')).toBeTruthy()
    expect(screen.getByText('Carne smash 120g')).toBeTruthy()
    expect(screen.getByText('Cheddar')).toBeTruthy()
    expect(screen.getByText('Lechuga')).toBeTruthy()
    expect(screen.getByText('Tomate')).toBeTruthy()
  })

  it('un cliente no puede entrar al módulo', async () => {
    useAuth.setState({ user: { ...kitchenUser, id: 'u_cliente', role: 'customer' } })
    renderApp()
    await waitFor(() => {
      expect(screen.queryByText('COCINA')).toBeNull()
    })
  })
})
