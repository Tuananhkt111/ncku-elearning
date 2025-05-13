import { create } from 'zustand'

interface SessionOrderState {
  sessionOrder: number[]
  generateRandomOrder: () => void
  getNextSession: (currentSession: number | null) => number | null
  resetOrder: () => void
}

export const useSessionOrderStore = create<SessionOrderState>((set, get) => ({
  sessionOrder: [1, 2, 3, 4], // Added session 4

  generateRandomOrder: () => {
    const order = [1, 2, 3, 4] // Added session 4
    // Fisher-Yates shuffle algorithm
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]]
    }
    set({ sessionOrder: order })
  },

  getNextSession: (currentSession: number | null) => {
    const { sessionOrder } = get()
    if (currentSession === null) {
      return sessionOrder[0]
    }
    const currentIndex = sessionOrder.indexOf(currentSession)
    if (currentIndex === -1 || currentIndex === sessionOrder.length - 1) {
      return null
    }
    return sessionOrder[currentIndex + 1]
  },

  resetOrder: () => {
    set({ sessionOrder: [1, 2, 3, 4] }) // Added session 4
  }
})) 