import { create } from 'zustand'
import type { LeaderboardEntry } from '../types'

interface LeaderboardStore {
  entries: LeaderboardEntry[]
  loading: boolean
  load: () => Promise<void>
}

export const useLeaderboardStore = create<LeaderboardStore>()((set) => ({
  entries: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const entries = await window.api.data.loadLeaderboard()
      set({ entries, loading: false })
    } catch {
      set({ loading: false })
    }
  }
}))
