/**
 * "Construye tu burger": datos del armador visual.
 *
 * Cada paso tiene sus opciones con precio. El precio base cubre pan + carne
 * 150 g + queso cheddar + salsa de la casa (las opciones por defecto).
 */

export type BuilderStepId = 'bun' | 'patty' | 'cheese' | 'sauce' | 'toppings'

export interface BuilderOption {
  id: string
  name: string
  emoji: string
  price: number
  note?: string
  default?: boolean
  /** Cuántas carnes dibuja el armador (doble carne = 2). */
  patties?: number
}

export interface BuilderStep {
  id: BuilderStepId
  name: string
  emoji: string
  type: 'single' | 'multi'
  required?: boolean
  max?: number
  hint?: string
  options: BuilderOption[]
}

export const BUILDER_BASE_PRICE = 24900

export const builderSteps: BuilderStep[] = [
  {
    id: 'bun',
    name: 'Pan',
    emoji: '🥯',
    type: 'single',
    required: true,
    hint: 'La base de todo',
    options: [
      { id: 'bun_brioche', name: 'Brioche', emoji: '🥯', price: 0, default: true },
      { id: 'bun_pretzel', name: 'Pretzel', emoji: '🥨', price: 2500 },
      { id: 'bun_integral', name: 'Integral', emoji: '🌾', price: 1500 },
    ],
  },
  {
    id: 'patty',
    name: 'Carne',
    emoji: '🥩',
    type: 'single',
    required: true,
    hint: 'El corazón del parche',
    options: [
      { id: 'patty_150', name: '150 g', emoji: '🥩', price: 0, default: true, note: 'Clásica', patties: 1 },
      { id: 'patty_200', name: '200 g', emoji: '🥩', price: 6000, note: 'Más contundente', patties: 1 },
      { id: 'patty_double', name: 'Doble 300 g', emoji: '🥩', price: 12000, note: 'Para valientes', patties: 2 },
      { id: 'patty_veggie', name: 'Vegetariana', emoji: '🌱', price: 2000, note: 'Sin carne', patties: 1 },
    ],
  },
  {
    id: 'cheese',
    name: 'Queso',
    emoji: '🧀',
    type: 'single',
    required: true,
    hint: 'Que se derrita bien',
    options: [
      { id: 'cheese_cheddar', name: 'Cheddar', emoji: '🧀', price: 0, default: true },
      { id: 'cheese_mozza', name: 'Mozzarella', emoji: '🧀', price: 2000 },
      { id: 'cheese_house', name: 'Queso de la casa', emoji: '🧀', price: 3500 },
      { id: 'cheese_none', name: 'Sin queso', emoji: '🚫', price: 0 },
    ],
  },
  {
    id: 'sauce',
    name: 'Salsa',
    emoji: '🔥',
    type: 'single',
    required: true,
    hint: 'El toque final',
    options: [
      { id: 'sauce_house', name: 'House Sauce', emoji: '🔥', price: 0, default: true },
      { id: 'sauce_bbq', name: 'BBQ ahumada', emoji: '🍯', price: 1200 },
      { id: 'sauce_hot', name: 'Picante del parche', emoji: '🌶️', price: 1200 },
      { id: 'sauce_garlic', name: 'Garlic cremosa', emoji: '🧄', price: 1800 },
    ],
  },
  {
    id: 'toppings',
    name: 'Toppings',
    emoji: '🥓',
    type: 'multi',
    max: 6,
    hint: 'Hasta 6. Aquí se arma la obra maestra',
    options: [
      { id: 'top_bacon', name: 'Bacon', emoji: '🥓', price: 4000, default: true },
      { id: 'top_onion', name: 'Cebolla caramelizada', emoji: '🧅', price: 2500, default: true },
      { id: 'top_pickles', name: 'Pepinillos', emoji: '🥒', price: 1500, default: true },
      { id: 'top_jalapeno', name: 'Jalapeños', emoji: '🌶️', price: 2000 },
      { id: 'top_egg', name: 'Huevo de campo', emoji: '🍳', price: 3000 },
      { id: 'top_crispy', name: 'Cebolla crispy', emoji: '🧅', price: 2500 },
      { id: 'top_mushroom', name: 'Champiñones', emoji: '🍄', price: 3500 },
      { id: 'top_guacamole', name: 'Guacamole', emoji: '🥑', price: 3800 },
    ],
  },
]

export interface BuilderSelection {
  bun: BuilderOption
  patty: BuilderOption
  cheese: BuilderOption
  sauce: BuilderOption
  toppings: BuilderOption[]
}

const defaultOf = (stepId: BuilderStepId): BuilderOption => {
  const step = builderSteps.find((item) => item.id === stepId)!
  return step.options.find((option) => option.default) ?? step.options[0]
}

export function defaultBuilderSelection(): BuilderSelection {
  const toppingsStep = builderSteps.find((step) => step.id === 'toppings')!
  return {
    bun: defaultOf('bun'),
    patty: defaultOf('patty'),
    cheese: defaultOf('cheese'),
    sauce: defaultOf('sauce'),
    toppings: toppingsStep.options.filter((option) => option.default),
  }
}

export function builderSelectionTotal(selection: BuilderSelection): number {
  const singles =
    selection.bun.price + selection.patty.price + selection.cheese.price + selection.sauce.price
  const toppings = selection.toppings.reduce((acc, option) => acc + option.price, 0)
  return BUILDER_BASE_PRICE + singles + toppings
}
