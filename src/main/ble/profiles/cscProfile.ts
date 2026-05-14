import { EventEmitter } from 'events'
import { hasBit, readUInt16LE, readUInt32LE } from '../bleUtils'
import type { TrainerReading } from '../../../shared/types'

// CSC Measurement (0x2A5B)
// Flags byte:
//   bit 0: Wheel Revolution Data present
//   bit 1: Crank Revolution Data present
// Wheel data: UInt32 cumulative revs + UInt16 last event time (1/1024s)
// Crank data: UInt16 cumulative revs + UInt16 last event time (1/1024s)

const WHEEL_CIRCUMFERENCE_MM = 2096 // 700c x 25mm default

export class CSCProfile extends EventEmitter {
  static readonly SERVICE_UUID = '1816'
  static readonly CSC_MEASUREMENT_UUID = '2a5b'

  private lastWheelRevs = 0
  private lastWheelEventTime = 0
  private lastCrankRevs = 0
  private lastCrankEventTime = 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribe(characteristics: any[]): void {
    const char = characteristics.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) =>
        c.uuid.replace(/-/g, '').toLowerCase() === CSCProfile.CSC_MEASUREMENT_UUID
    )
    if (!char) return

    char.on('data', (data: Buffer) => {
      const reading = this.parseCSCMeasurement(data)
      if (reading) this.emit('reading', reading)
    })
    char.subscribe(() => {})
  }

  parseCSCMeasurement(buf: Buffer): Partial<TrainerReading> | null {
    if (buf.length < 1) return null

    const flags = buf.readUInt8(0)
    let offset = 1
    let speedKmh = 0
    let rpm = 0

    // Wheel Revolution Data (bit 0)
    if (hasBit(flags, 0) && offset + 6 <= buf.length) {
      const wheelRevs = readUInt32LE(buf, offset)
      const wheelEventTime = readUInt16LE(buf, offset + 4)
      offset += 6

      if (this.lastWheelEventTime !== 0) {
        let deltaRevs = wheelRevs - this.lastWheelRevs
        let deltaTime = wheelEventTime - this.lastWheelEventTime
        if (deltaRevs < 0) deltaRevs += 4294967296
        if (deltaTime < 0) deltaTime += 65536

        if (deltaTime > 0) {
          const distanceM = (deltaRevs * WHEEL_CIRCUMFERENCE_MM) / 1000
          const timeS = deltaTime / 1024
          speedKmh = (distanceM / timeS) * 3.6
        }
      }

      this.lastWheelRevs = wheelRevs
      this.lastWheelEventTime = wheelEventTime
    }

    // Crank Revolution Data (bit 1)
    if (hasBit(flags, 1) && offset + 4 <= buf.length) {
      const crankRevs = readUInt16LE(buf, offset)
      const crankEventTime = readUInt16LE(buf, offset + 2)

      if (this.lastCrankEventTime !== 0) {
        let deltaRevs = crankRevs - this.lastCrankRevs
        let deltaTime = crankEventTime - this.lastCrankEventTime
        if (deltaRevs < 0) deltaRevs += 65536
        if (deltaTime < 0) deltaTime += 65536

        if (deltaTime > 0) {
          rpm = (deltaRevs / deltaTime) * 1024 * 60
        }
      }

      this.lastCrankRevs = crankRevs
      this.lastCrankEventTime = crankEventTime
    }

    // CSC has no power data
    return { watts: 0, rpm, speedKmh }
  }
}
