import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { DiscoveredDevice, ConnectedDevice, DeviceStatus, TrainerReading } from '../types'

interface DeviceStore {
  discovered: DiscoveredDevice[]
  connected: Record<string, ConnectedDevice>
  liveReadings: Record<string, TrainerReading>
  isScanning: boolean

  setScanning: (v: boolean) => void
  addDiscovered: (device: DiscoveredDevice) => void
  updateDeviceStatus: (deviceId: string, status: DeviceStatus) => void
  updateLiveReading: (reading: TrainerReading) => void
  promoteToConnected: (deviceId: string) => void
  assignInitials: (deviceId: string, initials: string) => void
  assignAvatar: (deviceId: string, index: number) => void
  assignWeight: (deviceId: string, weightKg: number) => void
  removeDevice: (deviceId: string) => void
  clearAll: () => void
  addDemoDevice: () => void
}

export const useDeviceStore = create<DeviceStore>()(
  immer((set) => ({
    discovered: [],
    connected: {},
    liveReadings: {},
    isScanning: false,

    setScanning: (v) =>
      set((s) => {
        s.isScanning = v
      }),

    addDiscovered: (device) =>
      set((s) => {
        const idx = s.discovered.findIndex((d) => d.id === device.id)
        if (idx === -1) {
          s.discovered.push(device)
        } else {
          s.discovered[idx] = device
        }
      }),

    updateDeviceStatus: (deviceId, status) =>
      set((s) => {
        if (s.connected[deviceId]) {
          s.connected[deviceId].status = status
        }
      }),

    updateLiveReading: (reading) =>
      set((s) => {
        s.liveReadings[reading.deviceId] = reading
      }),

    promoteToConnected: (deviceId) =>
      set((s) => {
        const disc = s.discovered.find((d) => d.id === deviceId)
        if (!disc || s.connected[deviceId]) return
        const avatarIndex = Object.keys(s.connected).length % 8
        s.connected[deviceId] = {
          ...disc,
          status: 'connecting',
          initials: '',
          avatarIndex
        }
      }),

    assignInitials: (deviceId, initials) =>
      set((s) => {
        if (s.connected[deviceId]) {
          s.connected[deviceId].initials = initials.toUpperCase().slice(0, 3)
        }
      }),

    assignAvatar: (deviceId, index) =>
      set((s) => {
        if (s.connected[deviceId]) {
          s.connected[deviceId].avatarIndex = index
        }
      }),

    assignWeight: (deviceId, weightKg) =>
      set((s) => {
        if (s.connected[deviceId]) {
          s.connected[deviceId].weightKg = weightKg
        }
      }),

    removeDevice: (deviceId) =>
      set((s) => {
        delete s.connected[deviceId]
        s.discovered = s.discovered.filter((d) => d.id !== deviceId)
      }),

    clearAll: () =>
      set((s) => {
        s.discovered = []
        s.connected = {}
        s.liveReadings = {}
        s.isScanning = false
      }),

    addDemoDevice: () =>
      set((s) => {
        const demoCount = Object.keys(s.connected).filter((id) => id.startsWith('demo-')).length
        const n = demoCount + 1
        const id = `demo-${n}`
        const disc: DiscoveredDevice = {
          id,
          name: `DEMO RIDER ${n}`,
          rssi: -50,
          profile: 'ftms',
          serviceUUIDs: [],
        }
        const avatarIndex = Object.keys(s.connected).length % 8
        s.discovered.push(disc)
        s.connected[id] = { ...disc, status: 'connected', initials: '', avatarIndex }
      }),
  }))
)
