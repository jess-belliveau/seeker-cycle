import { EventEmitter } from 'events'
import { hasBit, readUInt16LE, readInt16LE } from '../bleUtils'
import { log, warn } from '../../logger'
import type { TrainerReading } from '../../../shared/types'

// FTMS Indoor Bike Data characteristic (0x2AD2)
// Flags word layout (16 bits, little-endian):
//   bit 0: More Data (inverse presence of instantaneous speed)
//   bit 1: Average Speed present
//   bit 2: Instantaneous Cadence present
//   bit 3: Average Cadence present
//   bit 4: Total Distance present
//   bit 5: Resistance Level present
//   bit 6: Instantaneous Power present
//   bit 7: Average Power present
//   bit 8: Expended Energy present
//   bit 9: Heart Rate present
//   bit 10: Metabolic Equivalent present
//   bit 11: Elapsed Time present
//   bit 12: Remaining Time present

export class FTMSProfile extends EventEmitter {
  static readonly SERVICE_UUID = '1826'
  static readonly INDOOR_BIKE_DATA_UUID = '2ad2'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribe(characteristics: any[]): void {
    const char = characteristics.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => c.uuid.replace(/-/g, '').toLowerCase() === FTMSProfile.INDOOR_BIKE_DATA_UUID
    )
    if (!char) {
      warn('[FTMS] Indoor Bike Data characteristic (2ad2) not found')
      return
    }
    log('[FTMS] subscribed to Indoor Bike Data')

    char.on('data', (data: Buffer) => {
      log('[FTMS] raw data:', data.toString('hex'), '| length:', data.length)
      const reading = this.parseIndoorBikeData(data)
      log('[FTMS] parsed:', reading)
      if (reading) this.emit('reading', reading)
    })
    char.subscribe(() => {})
  }

  parseIndoorBikeData(buf: Buffer): Partial<TrainerReading> | null {
    if (buf.length < 3) return null

    const flags = readUInt16LE(buf, 0)
    let offset = 2

    let speedKmh = 0
    let rpm = 0
    let watts = 0

    // Instantaneous Speed — present when bit 0 is NOT set (More Data = inverse)
    if (!hasBit(flags, 0)) {
      speedKmh = readUInt16LE(buf, offset) * 0.01
      offset += 2
    }

    // Average Speed (bit 1)
    if (hasBit(flags, 1)) offset += 2

    // Instantaneous Cadence (bit 2) — unit: 0.5 rpm per unit
    if (hasBit(flags, 2)) {
      rpm = readUInt16LE(buf, offset) * 0.5
      offset += 2
    }

    // Average Cadence (bit 3)
    if (hasBit(flags, 3)) offset += 2

    // Total Distance (bit 4) — 3 bytes
    if (hasBit(flags, 4)) offset += 3

    // Resistance Level (bit 5)
    if (hasBit(flags, 5)) offset += 2

    // Instantaneous Power (bit 6) — Int16LE, signed watts
    if (hasBit(flags, 6)) {
      if (offset + 2 <= buf.length) {
        watts = Math.max(0, readInt16LE(buf, offset))
        offset += 2
      }
    }

    return { watts, rpm, speedKmh }
  }
}
