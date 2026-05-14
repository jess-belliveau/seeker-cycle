import { useEffect } from 'react'
import { useDeviceStore } from '../store/deviceStore'
import { useRaceStore } from '../store/raceStore'
import type { TrainerReading } from '../types'

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

    const unsubReading = window.api.ble.onTrainerReading((reading: TrainerReading) => {
      useDeviceStore.getState().updateLiveReading(reading)
      useRaceStore.getState().applyReading(reading)
    })

    return () => {
      unsubDiscover()
      unsubStatus()
      unsubReading()
    }
  }, [])
}
