import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'
import { useAuth } from '@/store/auth'
import { useCart } from '@/store/cart'
import { useDb } from '@/store/db'
import type { Order, User } from '@/types'

const COURIER_EMAIL = 'domiciliario@elparche.co'
const DRIVER_ID = 'drv_andres'

const courierUser: User = {
  id: 'u_courier',
  name: 'Andrés “El Rápido”',
  email: COURIER_EMAIL,
  phone: '+57 300 123 4567',
  avatar: 'https://i.pravatar.cc/150?u=courier',
  createdAt: new Date().toISOString(),
  provider: 'email',
  role: 'courier',
  referralCode: 'ANDRES123',
}

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'ord_test',
  code: 'EP-4242',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'ready',
  statusHistory: [{ status: 'ready', at: new Date().toISOString() }],
  items: [
    {
      id: 'it_1',
      productId: 'p_callejera',
      name: 'LA CALLEJERA',
      image: '/img/photo-1568901346375-23c9450c58cd.jpg',
      unitPrice: 24900,
      quantity: 2,
      selections: [],
    },
  ],
  subtotal: 49800,
  discount: 0,
  deliveryFee: 6900,
  tip: 0,
  total: 56700,
  address: {
    id: 'addr_1',
    label: 'Casa',
    line: 'Calle 100 #15-20, Apto 301',
    details: 'Torre B',
    city: 'Bogotá',
    neighborhood: 'Chicó',
  },
  paymentMethodId: 'cash',
  paymentStatus: 'pending',
  pointsEarned: 0,
  pointsRedeemed: 0,
  etaMinutes: 28,
  deliveryMode: 'delivery',
  reviewed: false,
  ...overrides,
})

function renderApp(route = '/domiciliario') {
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

describe('Módulo domiciliario', () => {
  it('muestra los pedidos asignados con su dirección', async () => {
    const order = makeOrder()
    useDb.getState().addOrder(order)
    useDb.getState().assignCourier(order.id, DRIVER_ID)
    useAuth.setState({ user: courierUser })

    renderApp()

    expect(await screen.findByText('Módulo domiciliario')).toBeTruthy()
    expect(screen.getByText('Andrés “El Rápido”')).toBeTruthy()
    expect(screen.getByText('Calle 100 #15-20, Apto 301')).toBeTruthy()
    expect(screen.getByText('EP-4242')).toBeTruthy()
    expect(screen.getByText(/Cobrar/)).toBeTruthy()
  })

  it('inicia el viaje y luego marca el pedido como entregado', async () => {
    const user = userEvent.setup()
    const order = makeOrder()
    useDb.getState().addOrder(order)
    useDb.getState().assignCourier(order.id, DRIVER_ID)
    useAuth.setState({ user: courierUser })

    renderApp()

    await user.click(await screen.findByRole('button', { name: /iniciar viaje/i }))
    await waitFor(() => {
      expect(useDb.getState().orders[0].status).toBe('on_the_way')
    })

    await user.click(await screen.findByRole('button', { name: /marcar entregado/i }))
    await waitFor(() => {
      expect(useDb.getState().orders[0].status).toBe('delivered')
    })
    expect(await screen.findByText(/ENTREGADOS/)).toBeTruthy()
  })

  it('permite tomar un pedido disponible sin asignar', async () => {
    const user = userEvent.setup()
    useDb.getState().addOrder(makeOrder({ id: 'ord_libre', code: 'EP-7777', courierId: undefined }))
    useAuth.setState({ user: courierUser })

    renderApp()

    await user.click(await screen.findByRole('button', { name: /tomar/i }))
    await waitFor(() => {
      expect(useDb.getState().orders[0].courierId).toBe(DRIVER_ID)
    })
  })

  it('un cliente no puede entrar al módulo', async () => {
    useAuth.setState({ user: { ...courierUser, id: 'u_cliente', role: 'customer' } })
    renderApp()
    await waitFor(() => {
      expect(screen.queryByText('Módulo domiciliario')).toBeNull()
    })
  })
})
