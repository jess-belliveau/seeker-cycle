import { useEffect } from 'react'
import { useDeviceStore } from '../store/deviceStore'
import { useRaceStore } from '../store/raceStore'
import type { TrainerReading } from '../types'

export function useBLEDeviceSync(): void {
  const addDiscovered = useDeviceStore((s) => s.addDiscovered)
  const updateDeviceStatus = useDeviceStore((s) => s.updateDeviceStatus)
  const promoteToConnected = useDeviceStore((s) => s.promoteToConnected)
  const updateLiveReading = useDeviceStore((s) => s.updateLiveReading)
  const applyReading = useRaceStore((s) => s.applyReading)

  useEffect(() => {
    const unsubDiscover = window.api.ble.onDeviceDiscovered(addDiscovered)

    const unsubStatus = window.api.ble.onDeviceStatusChanged((deviceId, status) => {
      if (status === 'connecting') {
        promoteToConnected(deviceId)
      }
      updateDeviceStatus(deviceId, status)
    })

    const unsubReading = window.api.ble.onTrainerReading((reading: TrainerReading) => {
      // Always track live readings regardless of race state
      updateLiveReading(reading)
      // Also feed into race physics when a race is active
      applyReading(reading)
    })

    return () => {
      unsubDiscover()
      unsubStatus()
      unsubReading()
    }
  }, [addDiscovered, updateDeviceStatus, promoteToConnected, updateLiveReading, applyReading])
}
