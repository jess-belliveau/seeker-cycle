import { useEffect } from 'react'
import { useDeviceStore } from '../store/deviceStore'
import { emitDemoReading } from '../demoBus'

// Runs a 4 Hz interval that generates plausible trainer readings for every
// connected demo device. Each rider gets a slightly different wattage profile
// so races look interesting without real hardware.
export function useDemoSimulator(): void {
  useEffect(() => {
    const id = setInterval(() => {
      const { connected } = useDeviceStore.getState()
      const now = Date.now()

      for (const [deviceId, device] of Object.entries(connected)) {
        if (!deviceId.startsWith('demo-') || device.status !== 'connected') continue

        const n = parseInt(deviceId.replace('demo-', ''), 10) || 1
        // Each rider has a different base power and phase so they spread out naturally
        const baseW  = 160 + n * 40
        const watts  = Math.max(60, Math.round(
          baseW
          + 50 * Math.sin(now / 4500 + n * 1.9)
          + (Math.random() - 0.5) * 28
        ))
        const rpm = Math.round(
          88
          + 9 * Math.sin(now / 5500 + n * 0.8)
          + (Math.random() - 0.5) * 6
        )

        emitDemoReading({
          deviceId,
          timestamp: now,
          watts,
          rpm,
          speedKmh: parseFloat((watts / 25).toFixed(1)),
        })
      }
    }, 250)

    return () => clearInterval(id)
  }, []) // reads latest store state each tick — no dependency needed
}
