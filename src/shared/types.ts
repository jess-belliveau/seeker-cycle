// ─── BLE / Device ────────────────────────────────────────────────────────────

export type BLEProfile = 'ftms' | 'csc' | 'cycling-power' | 'unknown'

export type DeviceStatus =
  | 'discovered'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'disconnected'

export interface DiscoveredDevice {
  id: string
  name: string
  rssi: number
  profile: BLEProfile
  serviceUUIDs: string[]
}

export interface ConnectedDevice extends DiscoveredDevice {
  status: DeviceStatus
  initials: string
  avatarIndex: number
  weightKg?: number
}

export interface TrainerReading {
  deviceId: string
  timestamp: number
  watts: number
  rpm: number
  speedKmh: number
}

// ─── Race ─────────────────────────────────────────────────────────────────────

export type RaceStatus = 'idle' | 'countdown' | 'racing' | 'finished'

export interface RiderState {
  deviceId: string
  initials: string
  avatarIndex: number
  positionMeters: number
  velocityMs: number
  currentWatts: number
  currentRpm: number
  totalWatts: number
  maxWatts: number
  totalRpm: number
  readingCount: number
  finishTimeMs: number | null
  rank: number | null
}

export interface RaceConfig {
  distanceMeters: number
  countdownSeconds: number
  physicsMode: 'flat-watts' | 'w-per-kg'
  modeId?: 'race' | 'tron' | 'watts-battle'
}

export interface RaceState {
  status: RaceStatus
  config: RaceConfig
  startTimeMs: number | null
  elapsedMs: number
  riders: Record<string, RiderState>
  finishOrder: string[]
}

// ─── Results / Persistence ────────────────────────────────────────────────────

export interface RiderSessionResult {
  initials: string
  avatarIndex: number
  rank: number
  finishTimeMs: number | null
  distanceMeters: number
  avgWatts: number
  maxWatts: number
  avgRpm: number
}

export interface SessionResult {
  id: string
  date: string
  config: RaceConfig
  riders: RiderSessionResult[]
}

export interface LeaderboardEntry {
  initials: string
  bestFinishTimeMs: number | null
  totalRaces: number
  avgWatts: number
  date: string
}

// ─── IPC API surface ──────────────────────────────────────────────────────────

export interface BLEAPI {
  startScan: () => Promise<void>
  stopScan: () => Promise<void>
  connect: (deviceId: string) => Promise<void>
  disconnect: (deviceId: string) => Promise<void>
  onDeviceDiscovered: (cb: (device: DiscoveredDevice) => void) => () => void
  onDeviceStatusChanged: (
    cb: (deviceId: string, status: DeviceStatus) => void
  ) => () => void
  onTrainerReading: (cb: (reading: TrainerReading) => void) => () => void
}

export interface DataAPI {
  saveSession: (result: SessionResult) => Promise<void>
  loadSessions: () => Promise<SessionResult[]>
  loadLeaderboard: () => Promise<LeaderboardEntry[]>
}

export interface AppAPI {
  quit: () => void
}

export interface DebugAPI {
  setVerbose: (enabled: boolean) => void
}

export interface WindowAPI {
  ble: BLEAPI
  data: DataAPI
  app: AppAPI
  debug: DebugAPI
}

declare global {
  interface Window {
    api: WindowAPI
  }
}
