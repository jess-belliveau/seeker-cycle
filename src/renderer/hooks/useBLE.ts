import { useEffect } from 'react'
import { useDeviceStore } from '../store/deviceStore'
import { useRaceStore } from '../store/raceStore'
import { onDemoReading } from '../demoBus'
import type { TrainerReading } from '../types'

function handleReading(reading: TrainerReading): void {
  useDeviceStore.getState().updateLiveReading(reading)
  useRaceStore.getState().applyReading(reading)
}

export function useBLEDeviceSync(): void {
  useEffect(() => {
    const unsubDiscover = window.api.ble.onDeviceDiscovered((device) => {
      useDeviceStore.getState().addDiscovered(device)
    })

    const unsubStatus = window.api.ble.onDeviceStatusChanged((deviceId, status) => {
      const { promoteToConnected, updateDeviceStatus } = useDeviceStore.getState()
      if (status === 'connecting') promoteToConnected(deviceId)
      updateDeviceStatus(deviceId, status)
    })

    const unsubReading = window.api.ble.onTrainerReading(handleReading)
    const unsubDemo    = onDemoReading(handleReading)

    return () => {
      unsubDiscover()
      unsubStatus()
      unsubReading()
      unsubDemo()
    }
  }, [])
}
