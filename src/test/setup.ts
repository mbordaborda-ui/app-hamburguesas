import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// happy-dom no implementa matchMedia ni scrollTo
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
Element.prototype.scrollIntoView = vi.fn()

beforeEach(() => {
  try {
    localStorage.clear()
  } catch {
    /* el navegador puede tener el almacenamiento bloqueado */
  }
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
