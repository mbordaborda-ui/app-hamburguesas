import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'
import { alwaysOpenHours } from '@/lib/hours'
import { useAuth } from '@/store/auth'
import { useCart } from '@/store/cart'
import { useDb } from '@/store/db'

function renderApp(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useDb.getState().resetDemoData()
  // Horario abierto 24 h: el checkout no debe depender de la hora real al correr los tests.
  useDb.getState().updateSettings({ isOpen: true, hours: alwaysOpenHours() })
  useCart.setState({ lines: [], couponCode: null, pointsRedeemed: 0, tip: 0 })
  useAuth.setState({ user: null, status: 'idle', error: null })
})

describe('EL PARCHE', () => {
  it('muestra la home con hero y CTAs', async () => {
    renderApp('/')
    expect(await screen.findByText(/hambre o antojo/i)).toBeTruthy()
    expect(screen.getAllByText(/empieza aquí/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /pedir ahora/i })).toBeTruthy()
    expect(screen.getByText(/los más pedidos/i)).toBeTruthy()
  })

  it('permite agregar un producto al carrito desde el menú', async () => {
    const user = userEvent.setup()
    renderApp('/menu')

    const addButton = await screen.findByRole('button', { name: /agregar la callejera/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(useCart.getState().lines).toHaveLength(1)
    })
    expect(useCart.getState().lines[0].name).toBe('LA CALLEJERA')

    const cartButton = screen.getByRole('button', { name: /abrir carrito/i })
    expect(cartButton.textContent).toContain('1')
  })

  it('completa el flujo de checkout y crea el pedido', async () => {
    const user = userEvent.setup()
    renderApp('/menu')

    await user.click(await screen.findByRole('button', { name: /agregar la callejera/i }))
    await waitFor(() => expect(useCart.getState().lines).toHaveLength(1))

    // Ir al checkout desde el carrito
    await user.click(screen.getByRole('button', { name: /abrir carrito/i }))
    const goCheckout = await screen.findByRole('button', { name: /pedir ahora/i })
    await user.click(goCheckout)

    // Paso 1: dirección
    const addressInput = await screen.findByPlaceholderText(/cra 45/i)
    await user.type(addressInput, 'Calle 100 #15-20, Apto 301')
    await user.click(screen.getByRole('button', { name: /guardar dirección/i }))
    await waitFor(() => expect(useDb.getState().addresses.length).toBeGreaterThan(0))
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    // Paso 2: pedido
    await user.click(await screen.findByRole('button', { name: /continuar/i }))

    // Paso 3: pago
    const cardOption = await screen.findByRole('button', { name: /tarjeta débito\/crédito/i })
    await user.click(cardOption)
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    // Paso 4: confirmar
    const confirm = await screen.findByRole('button', { name: /confirmar pedido/i })
    await user.click(confirm)

    await waitFor(() => expect(useDb.getState().orders).toHaveLength(1), { timeout: 5000 })
    // El cobro es asíncrono: esperamos a que el pago se confirme
    await waitFor(
      () => expect(useDb.getState().orders[0].paymentStatus).toBe('approved'),
      { timeout: 5000 },
    )
    const order = useDb.getState().orders[0]
    expect(order.total).toBeGreaterThan(0)
    expect(order.status).toBe('confirmed')
    expect(useCart.getState().lines).toHaveLength(0)

    expect(await screen.findByText(new RegExp(`pedido ${order.code}`, 'i'))).toBeTruthy()
  })

  it('muestra el programa de puntos en rewards', async () => {
    renderApp('/rewards')
    expect(await screen.findByText(/niveles del parche/i)).toBeTruthy()
    expect(screen.getAllByText(/rookie/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/street boss/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/recompensas/i)).toBeTruthy()
  })

  it('permite iniciar sesión como administrador', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.type(await screen.findByPlaceholderText(/tu@correo.com/i), 'admin@elparche.co')
    await user.type(screen.getByPlaceholderText('••••••••'), 'parche123')
    await user.click(screen.getByRole('button', { name: /^entrar$/i }))

    await waitFor(() => expect(useAuth.getState().user?.role).toBe('admin'))
  })

  it('bloquea el panel admin a clientes anónimos', async () => {
    renderApp('/admin')
    await waitFor(() => expect(useAuth.getState().user).toBeNull())
    expect(await screen.findByText(/inicia sesión/i)).toBeTruthy()
  })

  it('arranca sin pantalla blanca aunque el navegador bloquee localStorage', async () => {
    const original = window.localStorage
    const blocked = new Proxy(
      {},
      {
        get() {
          throw new DOMException('Access denied', 'SecurityError')
        },
      },
    )
    Object.defineProperty(window, 'localStorage', { value: blocked, configurable: true })

    try {
      vi.resetModules()
      const { default: FreshApp } = await import('@/App')
      render(
        <MemoryRouter initialEntries={['/']}>
          <FreshApp />
        </MemoryRouter>,
      )
      expect(await screen.findByText(/hambre o antojo/i)).toBeTruthy()
    } finally {
      Object.defineProperty(window, 'localStorage', { value: original, configurable: true })
    }
  })
})
