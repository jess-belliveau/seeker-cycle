import React from 'react'
import type { ConnectedDevice } from '../../types'
import { useDeviceStore } from '../../store/deviceStore'
import { C } from '../../theme'

const AVATAR_COLORS = [
  C.pink, C.orange, C.yellow, C.green,
  C.cyan, C.purple, '#ff8c00', C.white,
]

interface Props { device: ConnectedDevice }

export function RiderSetup({ device }: Props): React.ReactElement {
  const assignInitials = useDeviceStore((s) => s.assignInitials)
  const assignAvatar   = useDeviceStore((s) => s.assignAvatar)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.name}>{device.name.slice(0, 16)}</span>
        <span style={styles.connected}>■ CONNECTED</span>
      </div>

      <div style={styles.fields}>
        <div style={styles.field}>
          <div style={styles.label}>INITIALS</div>
          <input
            style={styles.input}
            maxLength={3}
            value={device.initials}
            placeholder="AAA"
            onChange={(e) => assignInitials(device.id, e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <div style={styles.label}>COLOUR</div>
          <div style={styles.swatches}>
            {AVATAR_COLORS.map((color, i) => (
              <button
                key={i}
                style={{
                  ...styles.swatch,
                  background: color,
                  border: device.avatarIndex === i
                    ? `3px solid ${C.white}`
                    : `3px solid ${C.black}`,
                  boxShadow: device.avatarIndex === i
                    ? `2px 2px 0 ${C.black}`
                    : 'none',
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
    background: '#0d2a1a',
    border: `3px solid ${C.green}`,
    boxShadow: `4px 4px 0 ${C.black}`,
    padding: '12px 14px',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  name:      { fontSize: 8, color: C.white },
  connected: { fontSize: 7, color: C.green, letterSpacing: 1 },
  fields:    { display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' },
  field:     { display: 'flex', flexDirection: 'column', gap: 8 },
  label:     { fontSize: 7, color: C.dim, letterSpacing: 2 },
  input: {
    width: 90, padding: '8px 10px',
    background: '#000',
    border: `3px solid ${C.orange}`,
    boxShadow: `inset 2px 2px 0 rgba(0,0,0,0.5)`,
    color: C.yellow,
    fontSize: 18, letterSpacing: 10, textAlign: 'center',
    textTransform: 'uppercase', outline: 'none',
  },
  swatches: { display: 'flex', gap: 6 },
  swatch: {
    width: 22, height: 22,
    cursor: 'pointer', outline: 'none',
  },
}
