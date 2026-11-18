import { describe, expect, it } from 'vitest'
import {
  BUILDER_BASE_PRICE,
  builderSelectionTotal,
  builderSteps,
  defaultBuilderSelection,
} from '@/data/builder'

describe('construye tu burger', () => {
  it('la selección por defecto suma $32.900', () => {
    expect(builderSelectionTotal(defaultBuilderSelection())).toBe(32900)
  })

  it('sin toppings, el total es el precio base', () => {
    const selection = defaultBuilderSelection()
    selection.toppings = []
    expect(builderSelectionTotal(selection)).toBe(BUILDER_BASE_PRICE)
  })

  it('cada paso simple trae una opción por defecto', () => {
    for (const step of builderSteps) {
      expect(step.options.length).toBeGreaterThan(0)
      if (step.type === 'single') {
        expect(step.options.some((option) => option.default)).toBe(true)
      }
    }
  })

  it('la carne doble dibuja 2 carnes', () => {
    const pattyStep = builderSteps.find((step) => step.id === 'patty')!
    expect(pattyStep.options.find((option) => option.id === 'patty_double')!.patties).toBe(2)
    expect(pattyStep.options.find((option) => option.id === 'patty_150')!.patties).toBe(1)
  })

  it('elegir carne doble suma $12.000', () => {
    const selection = defaultBuilderSelection()
    const before = builderSelectionTotal(selection)
    selection.patty = builderSteps
      .find((step) => step.id === 'patty')!
      .options.find((option) => option.id === 'patty_double')!
    expect(builderSelectionTotal(selection) - before).toBe(12000)
  })
})
