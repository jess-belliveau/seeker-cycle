import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { RaceState, RaceConfig, RiderState, TrainerReading, ConnectedDevice } from '../types'

const DEFAULT_CONFIG: RaceConfig = {
  distanceMeters: 2000,
  countdownSeconds: 3,
  physicsMode: 'flat-watts'
}

// Watts → m/s via simplified flat-road cycling drag model
// P = Crr·m·g·v + 0.5·CdA·ρ·v³
// Crr=0.004, m=75kg, g=9.81, CdA=0.32, ρ=1.2
// => 2.943·v + 0.192·v³ = P
// Solved via Newton-Raphson, pre-computed at module init

const velocityTable = ((): Float32Array => {
  const table = new Float32Array(801) // 0..800 watts
  for (let w = 0; w <= 800; w++) {
    let v = 5 // initial guess m/s
    for (let i = 0; i < 10; i++) {
      const f = 2.943 * v + 0.192 * v * v * v - w
      const df = 2.943 + 0.576 * v * v
      v = v - f / df
      if (v < 0) v = 0
    }
    table[w] = v
  }
  return table
})()

export function wattsToVelocity(watts: number): number {
  const w = Math.max(0, Math.min(800, Math.round(watts)))
  return velocityTable[w]
}

function makeRider(device: ConnectedDevice): RiderState {
  return {
    deviceId: device.id,
    initials: device.initials,
    avatarIndex: device.avatarIndex,
    positionMeters: 0,
    velocityMs: 0,
    currentWatts: 0,
    currentRpm: 0,
    totalWatts: 0,
    maxWatts: 0,
    totalRpm: 0,
    readingCount: 0,
    finishTimeMs: null,
    rank: null
  }
}

interface RaceStore {
  race: RaceState

  initRace: (riders: ConnectedDevice[], config?: Partial<RaceConfig>) => void
  startCountdown: () => void
  startRacing: () => void
  applyReading: (reading: TrainerReading) => void
  tickPhysics: (deltaMs: number) => void
  endRace: () => void
  resetRace: () => void
}

const initialRace: RaceState = {
  status: 'idle',
  config: DEFAULT_CONFIG,
  startTimeMs: null,
  elapsedMs: 0,
  riders: {},
  finishOrder: []
}

export const useRaceStore = create<RaceStore>()(
  immer((set, get) => ({
    race: initialRace,

    initRace: (riders, config) =>
      set((s) => {
        s.race = {
          ...initialRace,
          config: { ...DEFAULT_CONFIG, ...config },
          riders: Object.fromEntries(riders.map((d) => [d.id, makeRider(d)]))
        }
      }),

    startCountdown: () =>
      set((s) => {
        s.race.status = 'countdown'
      }),

    startRacing: () =>
      set((s) => {
        s.race.status = 'racing'
        s.race.startTimeMs = Date.now()
      }),

    applyReading: (reading) =>
      set((s) => {
        const rider = s.race.riders[reading.deviceId]
        if (!rider || s.race.status !== 'racing') return
        rider.currentWatts = reading.watts
        rider.currentRpm = reading.rpm
        rider.totalWatts += reading.watts
        rider.totalRpm += reading.rpm
        rider.readingCount += 1
        if (reading.watts > rider.maxWatts) rider.maxWatts = reading.watts
      }),

    tickPhysics: (deltaMs) => {
      const { race } = get()
      if (race.status !== 'racing' || !race.startTimeMs) return

      set((s) => {
        const dt = Math.min(deltaMs, 100) / 1000
        const now = Date.now()
        s.race.elapsedMs = now - (s.race.startTimeMs ?? now)

        let finishCount = s.race.finishOrder.length

        for (const rider of Object.values(s.race.riders)) {
          if (rider.finishTimeMs !== null) continue

          const targetV = wattsToVelocity(rider.currentWatts)
          rider.velocityMs = rider.velocityMs * 0.85 + targetV * 0.15
          rider.positionMeters += rider.velocityMs * dt

          if (rider.positionMeters >= s.race.config.distanceMeters) {
            rider.positionMeters = s.race.config.distanceMeters
            rider.finishTimeMs = s.race.elapsedMs
            finishCount += 1
            rider.rank = finishCount
            s.race.finishOrder.push(rider.deviceId)
          }
        }

        // All riders finished
        if (s.race.finishOrder.length === Object.keys(s.race.riders).length) {
          s.race.status = 'finished'
        }
      })
    },

    endRace: () =>
      set((s) => {
        s.race.status = 'finished'
        // Assign ranks to any unfinished riders
        let rank = s.race.finishOrder.length + 1
        for (const rider of Object.values(s.race.riders)) {
          if (rider.rank === null) {
            rider.rank = rank++
          }
        }
      }),

    resetRace: () =>
      set((s) => {
        s.race = initialRace
      })
  }))
)
