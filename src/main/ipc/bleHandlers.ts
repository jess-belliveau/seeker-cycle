import type { IpcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/channels'
import { BLEManager } from '../ble/bleManager'
import type { DiscoveredDevice, DeviceStatus, TrainerReading } from '../../shared/types'

export function registerBLEHandlers(ipcMain: IpcMain, getWindow: () => BrowserWindow | null): void {
  const manager = new BLEManager()

  const send = (channel: string, ...args: unknown[]): void => {
    getWindow()?.webContents.send(channel, ...args)
  }

  manager.on('deviceDiscovered', (device: DiscoveredDevice) => {
    send(IPC_CHANNELS.BLE_DEVICE_DISCOVERED, device)
  })

  manager.on('deviceStatusChanged', (deviceId: string, status: DeviceStatus) => {
    send(IPC_CHANNELS.BLE_DEVICE_STATUS_CHANGED, deviceId, status)
  })

  manager.on('trainerReading', (reading: TrainerReading) => {
    send(IPC_CHANNELS.BLE_TRAINER_READING, reading)
  })

  ipcMain.handle(IPC_CHANNELS.BLE_START_SCAN, () => manager.startScan())
  ipcMain.handle(IPC_CHANNELS.BLE_STOP_SCAN, () => manager.stopScan())
  ipcMain.handle(IPC_CHANNELS.BLE_CONNECT, (_event, deviceId: string) =>
    manager.connectDevice(deviceId)
  )
  ipcMain.handle(IPC_CHANNELS.BLE_DISCONNECT, (_event, deviceId: string) =>
    manager.disconnectDevice(deviceId)
  )
}
