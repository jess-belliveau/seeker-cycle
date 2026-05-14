import { EventEmitter } from 'events'
import { detectProfile } from './profiles'
import { TrainerDevice } from './trainerDevice'
import type { DiscoveredDevice, TrainerReading, DeviceStatus } from '../../shared/types'

export class BLEManager extends EventEmitter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private noble: any = null
  private scanning = false
  private devices = new Map<string, TrainerDevice>()

  async startScan(): Promise<void> {
    if (!this.noble) {
      // Lazy require — noble starts BLE on load, must be deferred
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      this.noble = require('@abandonware/noble')
    }

    const noble = this.noble

    const doScan = (): void => {
      if (this.scanning) return
      noble.startScanning([], true, (err: Error | null) => {
        if (err) console.error('[BLE] scan error:', err)
        else this.scanning = true
      })
    }

    noble.on('discover', (peripheral: unknown) => {
      this.onDiscover(peripheral)
    })

    if (noble.state === 'poweredOn') {
      doScan()
    } else {
      noble.once('stateChange', (state: string) => {
        if (state === 'poweredOn') doScan()
      })
    }
  }

  async stopScan(): Promise<void> {
    if (!this.noble || !this.scanning) return
    await new Promise<void>((resolve) => {
      this.noble.stopScanning(() => {
        this.scanning = false
        resolve()
      })
    })
  }

  async connectDevice(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId)
    if (!device) throw new Error(`Device ${deviceId} not found`)

    device.on('statusChanged', (id: string, status: DeviceStatus) => {
      this.emit('deviceStatusChanged', id, status)
    })
    device.on('reading', (reading: TrainerReading) => {
      this.emit('trainerReading', reading)
    })

    await device.connect()
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId)
    if (!device) return
    await device.disconnect()
  }

  async destroy(): Promise<void> {
    await this.stopScan().catch(() => {})
    for (const id of this.devices.keys()) {
      await this.disconnectDevice(id).catch(() => {})
    }
    this.devices.clear()
    this.removeAllListeners()
  }

  private onDiscover(peripheral: unknown): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = peripheral as any
    const id: string = p.id
    const name: string = p.advertisement?.localName || id
    const rssi: number = p.rssi || 0
    const serviceUUIDs: string[] = p.advertisement?.serviceUuids || []
    const profile = detectProfile(serviceUUIDs)

    console.log(`[BLE] discovered: ${name} | profile: ${profile} | services: ${serviceUUIDs.join(', ')}`)

    if (!this.devices.has(id)) {
      const device = new TrainerDevice(p)
      this.devices.set(id, device)
    }

    const discovered: DiscoveredDevice = { id, name, rssi, profile, serviceUUIDs }
    this.emit('deviceDiscovered', discovered)
  }
}
