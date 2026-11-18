import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from '@/lib/safeStorage'
import { api } from '@/services/api'
import { tokenStore } from '@/services/http'
import { useDb } from '@/store/db'
import type { User } from '@/types'

export const GUEST_ID = 'guest'

interface AuthState {
  user: User | null
  status: 'idle' | 'loading'
  error: string | null
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (input: { name: string; email: string; password: string; phone?: string }) => Promise<boolean>
  signInWithProvider: (provider: 'google' | 'apple') => Promise<boolean>
  recover: (email: string) => Promise<boolean>
  signOut: () => void
  clearError: () => void
  isAdmin: () => boolean
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      status: 'idle',
      error: null,

      async signIn(email, password) {
        set({ status: 'loading', error: null })
        try {
          const user = await api.auth.signIn({ email, password })
          useDb.getState().ensureAccount(user.id)
          set({ user, status: 'idle' })
          return true
        } catch (error) {
          set({ status: 'idle', error: (error as Error).message })
          return false
        }
      },

      async signUp(input) {
        set({ status: 'loading', error: null })
        try {
          const user = await api.auth.signUp(input)
          useDb.getState().ensureAccount(user.id)
          useDb.getState().pushNotification({
            type: 'promo',
            title: '¡Bienvenido al parche!',
            body: 'Usa el código WELCOME y ahorra $8.000 en tu primer pedido.',
            emoji: '🎁',
            actionUrl: '/profile/coupons',
          })
          set({ user, status: 'idle' })
          return true
        } catch (error) {
          set({ status: 'idle', error: (error as Error).message })
          return false
        }
      },

      async signInWithProvider(provider) {
        set({ status: 'loading', error: null })
        try {
          const user = await api.auth.signInWithProvider(provider)
          useDb.getState().ensureAccount(user.id)
          set({ user, status: 'idle' })
          return true
        } catch (error) {
          set({ status: 'idle', error: (error as Error).message })
          return false
        }
      },

      async recover(email) {
        set({ status: 'loading', error: null })
        try {
          await api.auth.requestPasswordReset(email)
          set({ status: 'idle' })
          return true
        } catch (error) {
          set({ status: 'idle', error: (error as Error).message })
          return false
        }
      },

      signOut() {
        api.auth.signOut()
        set({ user: null, error: null })
      },

      clearError: () => set({ error: null }),

      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'elparche-auth-v1',
      storage: createJSONStorage(() => safeStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.user && !tokenStore.get()) {
          tokenStore.set(`local.${state.user.id}`)
        }
      },
    },
  ),
)

export const currentUserId = () => useAuth.getState().user?.id ?? GUEST_ID
