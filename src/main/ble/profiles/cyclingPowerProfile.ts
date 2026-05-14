import { EventEmitter } from 'events'
import { hasBit, readInt16LE, readUInt16LE } from '../bleUtils'
import type { TrainerReading } from '../../../shared/types'

// Cycling Power Measurement (0x2A63)
// Flags word layout (16 bits):
//   bit 0: Pedal Power Balance present
//   bit 1: Pedal Power Balance Reference
//   bit 2: Accumulated Torque present
//   bit 3: Accumulated Torque Source
//   bit 4: Wheel Revolution Data present
//   bit 5: Crank Revolution Data present
//   ...
// Bytes 2-3: Int16LE instantaneous power (always present)

export class CyclingPowerProfile extends EventEmitter {
  static readonly SERVICE_UUID = '1818'
  static readonly POWER_MEASUREMENT_UUID = '2a63'

  private lastCrankRevs = 0
  private lastCrankEventTime = 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribe(characteristics: any[]): void {
    const char = characteristics.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) =>
        c.uuid.replace(/-/g, '').toLowerCase() === CyclingPowerProfile.POWER_MEASUREMENT_UUID
    )
    if (!char) return

    char.on('data', (data: Buffer) => {
      const reading = this.parsePowerMeasurement(data)
      if (reading) this.emit('reading', reading)
    })
    char.subscribe(() => {})
  }

  parsePowerMeasurement(buf: Buffer): Partial<TrainerReading> | null {
    if (buf.length < 4) return null

    const flags = readUInt16LE(buf, 0)
    const watts = Math.max(0, readInt16LE(buf, 2))
    let offset = 4
    let rpm = 0

    // Pedal Power Balance (bit 0) — 1 byte
    if (hasBit(flags, 0)) offset += 1

    // Accumulated Torque (bit 2) — 2 bytes
    if (hasBit(flags, 2)) offset += 2

    // Wheel Revolution Data (bit 4) — 6 bytes
    if (hasBit(flags, 4)) offset += 6

    // Crank Revolution Data (bit 5) — 4 bytes: UInt16 revs + UInt16 event time (1/1024s)
    if (hasBit(flags, 5) && offset + 4 <= buf.length) {
      const crankRevs = readUInt16LE(buf, offset)
      const crankEventTime = readUInt16LE(buf, offset + 2)
      offset += 4

      if (this.lastCrankEventTime !== 0) {
        let deltaRevs = crankRevs - this.lastCrankRevs
        let deltaTime = crankEventTime - this.lastCrankEventTime

        // Handle rollover
        if (deltaRevs < 0) deltaRevs += 65536
        if (deltaTime < 0) deltaTime += 65536

        if (deltaTime > 0) {
          rpm = (deltaRevs / deltaTime) * 1024 * 60
        }
      }

      this.lastCrankRevs = crankRevs
      this.lastCrankEventTime = crankEventTime
    }

    return { watts, rpm, speedKmh: 0 }
  }
}
