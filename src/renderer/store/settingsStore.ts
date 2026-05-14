import { create } from 'zustand'

interface SettingsStore {
  adminMode: boolean
  toggleAdminMode: () => void
}

export const useSettingsStore = create<SettingsStore>()((set, get) => ({
  adminMode: false,
  toggleAdminMode: () => {
    const next = !get().adminMode
    set({ adminMode: next })
    window.api.debug.setVerbose(next)
  },
}))
