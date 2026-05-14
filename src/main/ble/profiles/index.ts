import { normalizeUUID } from '../bleUtils'
import type { BLEProfile } from '../../../shared/types'
import { FTMSProfile } from './ftmsProfile'
import { CyclingPowerProfile } from './cyclingPowerProfile'
import { CSCProfile } from './cscProfile'

export const PROFILE_SERVICE_UUIDS: Record<string, BLEProfile> = {
  '1826': 'ftms',
  '1818': 'cycling-power',
  '1816': 'csc'
}

export function detectProfile(serviceUUIDs: string[]): BLEProfile {
  const normalized = serviceUUIDs.map(normalizeUUID)
  // Check in priority order: FTMS > cycling-power > CSC
  if (normalized.includes('1826')) return 'ftms'
  if (normalized.includes('1818')) return 'cycling-power'
  if (normalized.includes('1816')) return 'csc'
  return 'unknown'
}

export { FTMSProfile, CyclingPowerProfile, CSCProfile }
