import { EventEmitter } from 'events'
import { detectProfile, FTMSProfile, CyclingPowerProfile, CSCProfile } from './profiles'
import type { BLEProfile, TrainerReading, DeviceStatus } from '../../shared/types'

type AnyProfile = FTMSProfile | CyclingPowerProfile | CSCProfile

export class TrainerDevice extends EventEmitter {
  readonly id: string
  readonly name: string
  readonly detectedProfile: BLEProfile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly peripheral: any

  private profile: AnyProfile | null = null
  private _status: DeviceStatus = 'discovered'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(peripheral: any) {
    super()
    this.peripheral = peripheral
    this.id = peripheral.id
    this.name = peripheral.advertisement?.localName || peripheral.id
    this.detectedProfile = detectProfile(
      (peripheral.advertisement?.serviceUuids || []) as string[]
    )
  }

  get status(): DeviceStatus {
    return this._status
  }

  async connect(): Promise<void> {
    this.setStatus('connecting')
    await new Promise<void>((resolve, reject) => {
      this.peripheral.connect((err: Error | null) => {
        if (err) reject(err)
        else resolve()
      })
    })

    const { services, characteristics } = await new Promise<{
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      services: any[]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      characteristics: any[]
    }>((resolve, reject) => {
      this.peripheral.discoverAllServicesAndCharacteristics(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err: Error | null, svcs: any[], chars: any[]) => {
          if (err) reject(err)
          else resolve({ services: svcs, characteristics: chars })
        }
      )
    })

    void services

    this.profile = this.createProfile(characteristics)
    if (this.profile) {
      this.profile.on('reading', (partial: Partial<TrainerReading>) => {
        const reading: TrainerReading = {
          deviceId: this.id,
          timestamp: Date.now(),
          watts: partial.watts ?? 0,
          rpm: partial.rpm ?? 0,
          speedKmh: partial.speedKmh ?? 0
        }
        this.emit('reading', reading)
      })
    }

    this.peripheral.once('disconnect', () => {
      this.setStatus('disconnected')
      this.emit('disconnected', this.id)
    })

    this.setStatus('connected')
  }

  async disconnect(): Promise<void> {
    await new Promise<void>((resolve) => {
      this.peripheral.disconnect(() => resolve())
    })
  }

  private setStatus(status: DeviceStatus): void {
    this._status = status
    this.emit('statusChanged', this.id, status)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createProfile(characteristics: any[]): AnyProfile | null {
    switch (this.detectedProfile) {
      case 'ftms': {
        const p = new FTMSProfile()
        p.subscribe(characteristics)
        return p
      }
      case 'cycling-power': {
        const p = new CyclingPowerProfile()
        p.subscribe(characteristics)
        return p
      }
      case 'csc': {
        const p = new CSCProfile()
        p.subscribe(characteristics)
        return p
      }
      default:
        return null
    }
  }
}
