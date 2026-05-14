import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/channels'
import type { WindowAPI, DiscoveredDevice, DeviceStatus, TrainerReading, SessionResult } from '../shared/types'

contextBridge.exposeInMainWorld('api', {
  ble: {
    startScan: () => ipcRenderer.invoke(IPC_CHANNELS.BLE_START_SCAN),
    stopScan: () => ipcRenderer.invoke(IPC_CHANNELS.BLE_STOP_SCAN),
    connect: (deviceId: string) => ipcRenderer.invoke(IPC_CHANNELS.BLE_CONNECT, deviceId),
    disconnect: (deviceId: string) => ipcRenderer.invoke(IPC_CHANNELS.BLE_DISCONNECT, deviceId),

    onDeviceDiscovered: (cb: (device: DiscoveredDevice) => void) => {
      const handler = (_: unknown, device: DiscoveredDevice) => cb(device)
      ipcRenderer.on(IPC_CHANNELS.BLE_DEVICE_DISCOVERED, handler)
      return () => ipcRenderer.off(IPC_CHANNELS.BLE_DEVICE_DISCOVERED, handler)
    },

    onDeviceStatusChanged: (cb: (deviceId: string, status: DeviceStatus) => void) => {
      const handler = (_: unknown, deviceId: string, status: DeviceStatus) =>
        cb(deviceId, status)
      ipcRenderer.on(IPC_CHANNELS.BLE_DEVICE_STATUS_CHANGED, handler)
      return () => ipcRenderer.off(IPC_CHANNELS.BLE_DEVICE_STATUS_CHANGED, handler)
    },

    onTrainerReading: (cb: (reading: TrainerReading) => void) => {
      const handler = (_: unknown, reading: TrainerReading) => cb(reading)
      ipcRenderer.on(IPC_CHANNELS.BLE_TRAINER_READING, handler)
      return () => ipcRenderer.off(IPC_CHANNELS.BLE_TRAINER_READING, handler)
    }
  },

  data: {
    saveSession: (result: SessionResult) =>
      ipcRenderer.invoke(IPC_CHANNELS.DATA_SAVE_SESSION, result),
    loadSessions: () => ipcRenderer.invoke(IPC_CHANNELS.DATA_LOAD_SESSIONS),
    loadLeaderboard: () => ipcRenderer.invoke(IPC_CHANNELS.DATA_LOAD_LEADERBOARD)
  }
} satisfies WindowAPI)
