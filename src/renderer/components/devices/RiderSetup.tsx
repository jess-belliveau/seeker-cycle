import React from 'react'
import type { ConnectedDevice } from '../../types'
import { useDeviceStore } from '../../store/deviceStore'

const AVATAR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#00d4ff', '#a855f7', '#ec4899', '#ffffff'
]

interface Props {
  device: ConnectedDevice
}

export function RiderSetup({ device }: Props): React.ReactElement {
  const assignInitials = useDeviceStore((s) => s.assignInitials)
  const assignAvatar = useDeviceStore((s) => s.assignAvatar)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.deviceName}>{device.name}</span>
        <span style={styles.connected}>● CONNECTED</span>
      </div>

      <div style={styles.fields}>
        <div style={styles.field}>
          <label style={styles.label}>INITIALS</label>
          <input
            style={styles.initialsInput}
            maxLength={3}
            value={device.initials}
            placeholder="AAA"
            onChange={(e) => assignInitials(device.id, e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>COLOUR</label>
          <div style={styles.avatarRow}>
            {AVATAR_COLORS.map((color, i) => (
              <button
                key={i}
                style={{
                  ...styles.colorSwatch,
                  background: color,
                  outline: device.avatarIndex === i
                    ? `2px solid #fff`
                    : '2px solid transparent'
                }}
                onClick={() => assignAvatar(device.id, i)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'rgba(34,197,94,0.06)',
    border: '1px solid rgba(34,197,94,0.25)',
    borderRadius: 8,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  deviceName: {
    fontSize: 13,
    fontWeight: 700,
    color: '#e0e0e0'
  },
  connected: {
    fontSize: 10,
    color: '#22c55e',
    letterSpacing: 2,
    fontWeight: 700
  },
  fields: {
    display: 'flex',
    gap: 24,
    alignItems: 'flex-end'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  label: {
    fontSize: 10,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 600
  },
  initialsInput: {
    width: 80,
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 6,
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
    outline: 'none'
  },
  avatarRow: {
    display: 'flex',
    gap: 8
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    outlineOffset: 2
  }
}
