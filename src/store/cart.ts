import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from '@/lib/safeStorage'
import type { CartLine } from '@/types'

interface CartState {
  lines: CartLine[]
  couponCode: string | null
  pointsRedeemed: number
  tip: number
  deliveryMode: 'delivery' | 'pickup'
  lastAddedId: string | null

  addLine: (line: Omit<CartLine, 'id'> & { id?: string }) => string
  increment: (lineId: string) => void
  decrement: (lineId: string) => void
  setQuantity: (lineId: string, quantity: number) => void
  updateLine: (lineId: string, patch: Partial<CartLine>) => void
  removeLine: (lineId: string) => void
  clear: () => void
  setCoupon: (code: string | null) => void
  setPoints: (points: number) => void
  setTip: (tip: number) => void
  setDeliveryMode: (mode: 'delivery' | 'pickup') => void
  loadLines: (lines: CartLine[]) => void
}

const lineSignature = (line: Omit<CartLine, 'id'>) =>
  `${line.productId}|${line.selections
    .map((s) => s.optionId)
    .sort()
    .join(',')}|${line.notes ?? ''}`

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      couponCode: null,
      pointsRedeemed: 0,
      tip: 0,
      deliveryMode: 'delivery',
      lastAddedId: null,

      addLine(input) {
        const signature = lineSignature(input)
        const existing = get().lines.find((l) => lineSignature(l) === signature)
        if (existing) {
          set((s) => ({
            lines: s.lines.map((l) =>
              l.id === existing.id ? { ...l, quantity: l.quantity + input.quantity } : l,
            ),
            lastAddedId: existing.id,
          }))
          return existing.id
        }
        const id = input.id ?? `line_${Math.random().toString(36).slice(2, 9)}`
        set((s) => ({ lines: [...s.lines, { ...input, id }], lastAddedId: id }))
        return id
      },

      increment: (lineId) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.id === lineId ? { ...l, quantity: l.quantity + 1 } : l)),
          lastAddedId: lineId,
        })),

      decrement: (lineId) =>
        set((s) => ({
          lines: s.lines.flatMap((l) =>
            l.id === lineId ? (l.quantity > 1 ? [{ ...l, quantity: l.quantity - 1 }] : []) : [l],
          ),
        })),

      setQuantity: (lineId, quantity) =>
        set((s) => ({
          lines:
            quantity <= 0
              ? s.lines.filter((l) => l.id !== lineId)
              : s.lines.map((l) => (l.id === lineId ? { ...l, quantity } : l)),
        })),

      updateLine: (lineId, patch) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)),
        })),

      removeLine: (lineId) => set((s) => ({ lines: s.lines.filter((l) => l.id !== lineId) })),

      clear: () =>
        set({ lines: [], couponCode: null, pointsRedeemed: 0, tip: 0, lastAddedId: null }),

      setCoupon: (code) => set({ couponCode: code }),
      setPoints: (points) => set({ pointsRedeemed: Math.max(0, points) }),
      setTip: (tip) => set({ tip: Math.max(0, tip) }),
      setDeliveryMode: (mode) => set({ deliveryMode: mode }),
      loadLines: (lines) => set({ lines, couponCode: null, pointsRedeemed: 0, tip: 0 }),
    }),
    {
      name: 'elparche-cart-v1',
      storage: createJSONStorage(() => safeStorage),
    },
  ),
)
