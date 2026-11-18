import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from '@/lib/safeStorage'
import { uid } from '@/lib/utils'
import type { ID } from '@/types'

export interface Toast {
  id: string
  title: string
  description?: string
  emoji?: string
  tone?: 'default' | 'success' | 'error' | 'reward'
}

interface UiState {
  cartOpen: boolean
  searchOpen: boolean
  notificationsOpen: boolean
  addressPickerOpen: boolean
  online: boolean
  toasts: Toast[]
  activeAddressId: ID | null
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  setSearchOpen: (open: boolean) => void
  setNotificationsOpen: (open: boolean) => void
  setAddressPickerOpen: (open: boolean) => void
  setOnline: (online: boolean) => void
  toast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
  setActiveAddress: (id: ID | null) => void
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      cartOpen: false,
      searchOpen: false,
      notificationsOpen: false,
      addressPickerOpen: false,
      online: typeof navigator === 'undefined' ? true : navigator.onLine,
      toasts: [],
      activeAddressId: null,

      openCart: () => set({ cartOpen: true }),
      closeCart: () => set({ cartOpen: false }),
      toggleCart: () => set((s) => ({ cartOpen: !s.cartOpen })),
      setSearchOpen: (open) => set({ searchOpen: open }),
      setNotificationsOpen: (open) => set({ notificationsOpen: open }),
      setAddressPickerOpen: (open) => set({ addressPickerOpen: open }),
      setOnline: (online) => set({ online }),
      toast: (toast) => {
        const id = uid('toast')
        set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
        setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200)
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      setActiveAddress: (id) => set({ activeAddressId: id }),
    }),
    {
      name: 'elparche-ui-v1',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ activeAddressId: s.activeAddressId }) as UiState,
    },
  ),
)

export const toast = (toast: Omit<Toast, 'id'>) => useUi.getState().toast(toast)
