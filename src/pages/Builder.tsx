import { useMemo, useState } from 'react'
import { ArrowRight, Check, Minus, Plus, RotateCcw, ShoppingBag, Sparkles } from 'lucide-react'
import { BurgerStack } from '@/components/builder/BurgerStack'
import { Scribble, SpraySplat, Sticker } from '@/components/brand/StreetArt'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import {
  BUILDER_BASE_PRICE,
  builderSelectionTotal,
  builderSteps,
  defaultBuilderSelection,
  type BuilderOption,
  type BuilderSelection,
  type BuilderStepId,
} from '@/data/builder'
import { money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCart } from '@/store/cart'
import { toast, useUi } from '@/store/ui'
import type { SelectedOption } from '@/types'

const stepLabel: Record<BuilderStepId, { groupId: string; groupName: string }> = {
  bun: { groupId: 'g_bun', groupName: 'Pan' },
  patty: { groupId: 'g_patty', groupName: 'Carne' },
  cheese: { groupId: 'g_cheese', groupName: 'Queso' },
  sauce: { groupId: 'g_sauce', groupName: 'Salsa' },
  toppings: { groupId: 'g_toppings', groupName: 'Toppings' },
}

export default function Builder() {
  const addLine = useCart((s) => s.addLine)
  const openCart = useUi((s) => s.openCart)

  const [selection, setSelection] = useState<BuilderSelection>(defaultBuilderSelection)
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [assembleGen, setAssembleGen] = useState(0)

  const unitPrice = useMemo(() => builderSelectionTotal(selection), [selection])
  const total = unitPrice * quantity

  const chooseSingle = (stepId: Exclude<BuilderStepId, 'toppings'>, option: BuilderOption) =>
    setSelection((current) => ({ ...current, [stepId]: option }))

  const toggleTopping = (option: BuilderOption) =>
    setSelection((current) => {
      const exists = current.toppings.some((item) => item.id === option.id)
      if (exists) {
        return { ...current, toppings: current.toppings.filter((item) => item.id !== option.id) }
      }
      const max = builderSteps.find((step) => step.id === 'toppings')!.max ?? 6
      if (current.toppings.length >= max) return current
      return { ...current, toppings: [...current.toppings, option] }
    })

  const add = () => {
    const toSelection = (stepId: BuilderStepId, option: BuilderOption): SelectedOption => ({
      groupId: stepLabel[stepId].groupId,
      groupName: stepLabel[stepId].groupName,
      optionId: option.id,
      name: option.name,
      price: option.price,
    })

    const selections: SelectedOption[] = [
      toSelection('bun', selection.bun),
      toSelection('patty', selection.patty),
      toSelection('cheese', selection.cheese),
      toSelection('sauce', selection.sauce),
      ...selection.toppings.map((topping) => toSelection('toppings', topping)),
    ]

    addLine({
      productId: 'custom_burger',
      name: 'BURGER A TU GUSTO',
      image: '/img/hero-burger.jpg',
      basePrice: BUILDER_BASE_PRICE,
      unitPrice,
      quantity,
      selections,
      notes: notes.trim() || undefined,
    })
    toast({
      title: '¡Burger armada!',
      description: `${quantity}x a tu gusto · ${money(total)}`,
      emoji: '🍔',
      tone: 'success',
    })
    // Ensambla la burger de nuevo y, al terminar, abre el carrito.
    setAssembleGen((gen) => gen + 1)
    window.setTimeout(() => openCart(), 850)
  }

  return (
    <div className="pb-10">
      {/* ------------------------------ CABECERA ------------------------------ */}
      <section className="px-4 pt-4 sm:px-6">
        <header className="relative overflow-hidden rounded-[28px] border border-orange/30 bg-gradient-to-br from-orange/[0.12] via-carbon to-carbon p-5 sm:p-7">
          <div className="texture-brick absolute inset-0 opacity-15" />
          <SpraySplat seed={33} className="absolute -right-16 -top-20 size-64 text-orange/[0.1]" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-orange" />
              <span className="font-display text-[11px] uppercase tracking-[0.24em] text-orange">
                A tu manera
              </span>
            </div>
            <h1 className="mt-1 font-display text-5xl leading-[0.9] text-bone sm:text-6xl">
              CONSTRUYE TU BURGER
            </h1>
            <Scribble className="mt-1 h-4 w-52 text-orange" />
            <p className="mt-3 max-w-lg text-sm text-ash sm:text-base">
              Elige pan, carne, queso, salsa y toppings. Mírala armarse capa por capa y mándala pa&apos;
              tu casa. 🔥
            </p>
          </div>
        </header>
      </section>

      <div className="mx-auto mt-6 flex max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:gap-10">
        {/* --------------------------- PREVIEW + TOTAL --------------------------- */}
        <div className="sticky top-14 z-30 lg:top-24 lg:w-[420px] lg:shrink-0 lg:self-start">
          <div className="rounded-[28px] border border-white/[0.08] bg-carbon p-3 shadow-pop sm:p-5 lg:flex lg:min-h-[560px] lg:flex-col lg:shadow-none">
            {/* Móvil: burger a la izquierda y controles a la derecha para no tapar la lista.
                Desde sm: se apila como antes. */}
            <div className="flex items-center gap-3 sm:block lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
              <div className="w-[128px] shrink-0 sm:w-auto lg:flex lg:flex-1 lg:flex-col">
                <div className="[zoom:0.46] sm:[zoom:0.82] lg:flex lg:flex-1 lg:items-center lg:justify-center lg:[zoom:1]">
                  <BurgerStack
                    selection={selection}
                    assembleGen={assembleGen}
                    hideLabelOnMobile
                    onSelectStep={(stepId) =>
                      document
                        .getElementById(`step-${stepId}`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  />
                </div>
              </div>

              <div className="min-w-0 flex-1 sm:mt-3 lg:mt-0 lg:flex lg:flex-col lg:justify-end">
                <div className="flex flex-wrap items-end justify-between gap-2 sm:border-t sm:border-white/[0.06] sm:pt-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-concrete">
                      Total
                    </p>
                    <p className="font-display text-2xl leading-none text-red sm:text-3xl">
                      {money(total)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Menos cantidad"
                      className="grid size-8 place-items-center rounded-full text-bone transition hover:bg-white/10 active:scale-90"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="min-w-6 text-center text-sm font-extrabold text-bone">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                      aria-label="Más cantidad"
                      className="grid size-8 place-items-center rounded-full bg-red text-white transition hover:bg-red-deep active:scale-90"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>

                <Button
                  size="lg"
                  fullWidth
                  className="mt-3"
                  icon={<ShoppingBag className="size-4" />}
                  onClick={add}
                >
                  <span className="sm:hidden">Agregar</span>
                  <span className="hidden sm:inline">Agregar al pedido · {money(total)}</span>
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setSelection(defaultBuilderSelection())
                    setQuantity(1)
                    setNotes('')
                  }}
                  className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-concrete transition hover:text-flame"
                >
                  <RotateCcw className="size-3.5" /> Reiniciar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------- PASOS ------------------------------- */}
        <div className="min-w-0 flex-1 space-y-5">
          {builderSteps.map((step, index) => {
            const isMulti = step.type === 'multi'
            const selectedCount = isMulti
              ? selection.toppings.length
              : 1
            return (
              <div key={step.id}>
                <section
                  id={`step-${step.id}`}
                  className="scroll-mt-24 rounded-[28px] border border-white/[0.08] bg-carbon p-4 sm:p-5"
                >
                  <header className="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-9 place-items-center rounded-xl bg-white/[0.06] text-lg">
                        {step.emoji}
                      </span>
                      <div>
                        <h2 className="font-display text-lg uppercase tracking-wide text-bone">
                          {step.name}
                        </h2>
                        {step.hint && <p className="text-[11px] text-ash">{step.hint}</p>}
                      </div>
                    </div>
                    <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ash">
                      {isMulti ? `Hasta ${step.max}` : 'Elige 1'}
                    </span>
                  </header>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {step.options.map((option) => {
                      const selected = isMulti
                        ? selection.toppings.some((item) => item.id === option.id)
                        : selection[step.id as Exclude<BuilderStepId, 'toppings'>].id === option.id
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            isMulti
                              ? toggleTopping(option)
                              : chooseSingle(step.id as Exclude<BuilderStepId, 'toppings'>, option)
                          }
                          className={cn(
                            'flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition',
                            selected
                              ? 'border-red/60 bg-red/[0.08]'
                              : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20',
                          )}
                        >
                          <span className="text-xl" aria-hidden>
                            {option.emoji}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-bone">
                              {option.name}
                            </span>
                            {option.note && (
                              <span className="block text-[10px] text-concrete">{option.note}</span>
                            )}
                          </span>
                          <span
                            className={cn(
                              'shrink-0 text-xs font-bold',
                              option.price > 0 ? 'text-red' : 'text-concrete',
                            )}
                          >
                            {option.price > 0 ? `+${money(option.price)}` : 'Incluido'}
                          </span>
                          <span
                            className={cn(
                              'grid size-5 shrink-0 place-items-center border transition',
                              isMulti ? 'rounded-md' : 'rounded-full',
                              selected ? 'border-red bg-red text-white' : 'border-white/25',
                            )}
                          >
                            {selected && <Check className="size-3" strokeWidth={3.5} />}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {isMulti && (
                    <p className="mt-3 text-[11px] text-concrete">
                      {selectedCount} de {step.max} toppings seleccionados
                    </p>
                  )}
                </section>

                {index < builderSteps.length - 1 && (
                  <div className="flex justify-center py-1.5 text-orange" aria-hidden>
                    <ArrowRight className="size-5 rotate-90" />
                  </div>
                )}
              </div>
            )
          })}

          <div className="rounded-[28px] border border-white/[0.08] bg-carbon p-4 sm:p-5">
            <Textarea
              label="Notas para la cocina"
              placeholder="Sin cebolla, término medio, salsa aparte..."
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          {/* Resumen + CTA (móvil y desktop) */}
          <div className="rounded-[28px] border border-red/25 bg-red/[0.06] p-4 sm:p-5">
            <div className="flex flex-wrap gap-1.5">
              {[
                selection.bun,
                selection.patty,
                selection.cheese,
                selection.sauce,
                ...selection.toppings,
              ].map((option) => (
                <Sticker key={option.id} tone="ink" rotate={0} size="sm">
                  {option.emoji} {option.name}
                </Sticker>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-concrete">
                  Tu burger
                </p>
                <p className="font-display text-2xl text-red">{money(total)}</p>
              </div>
              <Button size="lg" icon={<ShoppingBag className="size-4" />} onClick={add}>
                Agregar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
