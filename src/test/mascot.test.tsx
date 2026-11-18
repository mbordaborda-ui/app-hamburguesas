import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'
import { mascotMessages, mascotPersonalities, pickMascotMessage } from '@/data/mascot'
import { useAuth } from '@/store/auth'
import { useCart } from '@/store/cart'
import { useDb } from '@/store/db'
import { useMascot } from '@/store/mascot'

function renderApp(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  )
}

const resetMascot = () =>
  useMascot.setState({
    index: 0,
    line: mascotPersonalities[0].messages[0],
    isReaction: false,
    tone: mascotPersonalities[0].color,
    messageKey: 0,
    burst: 0,
    recent: [],
  })

beforeEach(() => {
  useDb.getState().resetDemoData()
  useCart.setState({ lines: [], couponCode: null, pointsRedeemed: 0, tip: 0 })
  useAuth.setState({ user: null, status: 'idle', error: null })
  resetMascot()
})

describe('La Burger del Parche', () => {
  it('aparece en el home con su primera actitud y una de sus frases', async () => {
    renderApp('/')
    expect(await screen.findByText('La Burger del Parche')).toBeTruthy()
    expect(screen.getByText(mascotPersonalities[0].name)).toBeTruthy()
    expect(screen.getByText(mascotPersonalities[0].messages[0])).toBeTruthy()
    expect(screen.getByText(mascotPersonalities[0].description)).toBeTruthy()
  })

  it('recorre las 6 actitudes y cada una dice una de sus frases', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await screen.findByText(mascotPersonalities[0].name)

    const boton = () => screen.getByRole('button', { name: /la burger del parche/i })

    for (let i = 1; i < mascotPersonalities.length; i++) {
      await user.click(boton())
      const personality = mascotPersonalities[i]
      expect(await screen.findByText(personality.name)).toBeTruthy()
      expect(personality.messages).toContain(useMascot.getState().line)
    }

    // Sexto toque: vuelve a empezar
    await user.click(boton())
    expect(await screen.findByText(mascotPersonalities[0].name)).toBeTruthy()
  })

  it('cada actitud tiene al menos 7 frases distintas', () => {
    mascotPersonalities.forEach((personality) => {
      expect(personality.messages.length).toBeGreaterThanOrEqual(7)
      expect(new Set(personality.messages).size).toBe(personality.messages.length)
    })
  })

  it('reacciona al agregar una burger al carrito', async () => {
    const user = userEvent.setup()
    renderApp('/menu')

    await user.click(await screen.findByRole('button', { name: /agregar la callejera/i }))

    await waitFor(() => {
      expect(useMascot.getState().isReaction).toBe(true)
    })
    expect(mascotMessages.add).toContain(useMascot.getState().line)
  })

  it('avisa cuando el carrito queda vacío', async () => {
    const user = userEvent.setup()
    renderApp('/menu')

    await user.click(await screen.findByRole('button', { name: /agregar la callejera/i }))
    await waitFor(() => expect(useCart.getState().lines).toHaveLength(1))

    await user.click(screen.getByRole('button', { name: /abrir carrito/i }))
    await user.click(await screen.findByRole('button', { name: /eliminar la callejera/i }))

    await waitFor(() => {
      expect(mascotMessages.empty).toContain(useMascot.getState().line)
    })
  })

  it('nunca repite la misma frase dos veces seguidas', () => {
    const { say } = useMascot.getState()
    let anterior = ''
    for (let i = 0; i < 20; i++) {
      say('idle')
      const actual = useMascot.getState().line
      expect(actual).not.toBe(anterior)
      anterior = actual
    }
  })

  it('el selector elige una actitud concreta', () => {
    useMascot.getState().select(4)
    expect(mascotPersonalities[useMascot.getState().index].name).toBe('Delivery')
    expect(mascotPersonalities[4].messages).toContain(useMascot.getState().line)
  })

  it('pickMascotMessage evita la última frase usada', () => {
    const pool = ['a', 'b', 'c']
    for (let i = 0; i < 20; i++) {
      expect(pickMascotMessage(pool, ['a'])).not.toBe('a')
    }
  })
})
