import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  mascotMessageTone,
  mascotMessages,
  mascotPersonalities,
  pickMascotMessage,
  type MascotMessageKey,
} from '@/data/mascot'
import { safeStorage } from '@/lib/safeStorage'

interface MascotState {
  /** Personalidad actual (0-5). */
  index: number
  /** Frase que se está mostrando (de la actitud o una reacción). */
  line: string
  /** `true` cuando la frase viene de una acción del usuario. */
  isReaction: boolean
  tone: string
  /** Cambia en cada frase para poder re-animar el bocadillo. */
  messageKey: number
  /** Cambia en cada toque para relanzar las partículas. */
  burst: number
  /** Últimas frases usadas, para no repetir seguido. */
  recent: string[]

  next: () => void
  select: (index: number) => void
  say: (key: MascotMessageKey) => void
  clearMessage: () => void
  pop: () => void
}

const personalityAt = (index: number) =>
  mascotPersonalities[((index % mascotPersonalities.length) + mascotPersonalities.length) % mascotPersonalities.length]

export const useMascot = create<MascotState>()(
  persist(
    (set, get) => ({
      index: 0,
      line: mascotPersonalities[0].messages[0],
      isReaction: false,
      tone: mascotPersonalities[0].color,
      messageKey: 0,
      burst: 0,
      recent: [],

      next: () => {
        const nextIndex = (get().index + 1) % mascotPersonalities.length
        const personality = personalityAt(nextIndex)
        const line = pickMascotMessage(personality.messages, get().recent)
        set((s) => ({
          index: nextIndex,
          line,
          isReaction: false,
          tone: personality.color,
          messageKey: s.messageKey + 1,
          burst: s.burst + 1,
          recent: [line, ...s.recent].slice(0, 6),
        }))
      },

      select: (index) => {
        const personality = personalityAt(index)
        const line = pickMascotMessage(personality.messages, get().recent)
        set((s) => ({
          index: mascotPersonalities.indexOf(personality),
          line,
          isReaction: false,
          tone: personality.color,
          messageKey: s.messageKey + 1,
          burst: s.burst + 1,
          recent: [line, ...s.recent].slice(0, 6),
        }))
      },

      say: (key) => {
        const line = pickMascotMessage(mascotMessages[key], get().recent)
        set((s) => ({
          line,
          isReaction: true,
          tone: mascotMessageTone[key],
          messageKey: s.messageKey + 1,
          recent: [line, ...s.recent].slice(0, 6),
        }))
      },

      // Vuelve a su propia frase (una distinta a la anterior).
      clearMessage: () => {
        const personality = personalityAt(get().index)
        const line = pickMascotMessage(personality.messages, get().recent)
        set((s) => ({
          line,
          isReaction: false,
          tone: personality.color,
          messageKey: s.messageKey + 1,
          recent: [line, ...s.recent].slice(0, 6),
        }))
      },

      pop: () => set((s) => ({ burst: s.burst + 1 })),
    }),
    {
      name: 'elparche-mascot-v1',
      version: 2,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ index: s.index, line: s.line }) as MascotState,
      // v2 reordena las actitudes: En Llamas pasa a ser la primera (predeterminada).
      migrate: () => ({ index: 0 }) as MascotState,
      merge: (persisted, current) => {
        const saved = persisted as { index?: number; line?: string } | undefined
        const index = typeof saved?.index === 'number' ? saved.index : 0
        const personality = personalityAt(index)
        return {
          ...current,
          index: mascotPersonalities.indexOf(personality),
          line:
            typeof saved?.line === 'string' && saved.line
              ? saved.line
              : personality.messages[0],
          tone: personality.color,
        }
      },
    },
  ),
)

/** Actitud actual y frase que se está mostrando. */
export const useMascotLine = () => {
  const index = useMascot((s) => s.index)
  const line = useMascot((s) => s.line)
  const isReaction = useMascot((s) => s.isReaction)
  const personality = mascotPersonalities[index] ?? mascotPersonalities[0]
  return { personality, line, isReaction }
}
