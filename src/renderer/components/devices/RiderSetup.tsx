import React, { useState, useRef } from 'react'
import type { ConnectedDevice } from '../../types'
import { useDeviceStore } from '../../store/deviceStore'
import { SlotInitialsInput } from './SlotInitialsInput'
import { C } from '../../theme'

const AVATAR_COLORS = [
  C.pink, C.orange, C.yellow, C.green,
  C.cyan, C.purple, '#ff8c00', C.white,
]

type EntryMode = 'type' | 'slot'

interface Props { device: ConnectedDevice }

export function RiderSetup({ device }: Props): React.ReactElement {
  const assignInitials = useDeviceStore((s) => s.assignInitials)
  const assignAvatar   = useDeviceStore((s) => s.assignAvatar)
  const [mode, setMode] = useState<EntryMode>('type')

  function switchMode(next: EntryMode): void {
    if (next === mode) return
    assignInitials(device.id, '')
    setMode(next)
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.name}>{device.name.slice(0, 16)}</span>
        <span style={styles.connected}>■ CONNECTED</span>
      </div>

      <div style={styles.fields}>
        <div style={styles.field}>
          <div style={styles.labelRow}>
            <span style={styles.label}>INITIALS</span>
            {device.initials.length < 3 && (
              <div style={styles.toggle}>
                <button
                  style={{ ...styles.toggleBtn, ...(mode === 'type' ? styles.toggleBtnActive : {}) }}
                  onClick={() => switchMode('type')}
                >TYPE</button>
                <button
                  style={{ ...styles.toggleBtn, ...(mode === 'slot' ? styles.toggleBtnActive : {}) }}
                  onClick={() => switchMode('slot')}
                >BIKE</button>
              </div>
            )}
          </div>

          {device.initials.length === 3 ? (
            <div style={styles.initialsLocked}>
              <span style={styles.initialsDisplay}>{device.initials}</span>
              <button
                style={styles.resetBtn}
                onClick={() => assignInitials(device.id, '')}
              >
                ↺
              </button>
            </div>
          ) : mode === 'slot' ? (
            <SlotInitialsInput
              deviceId={device.id}
              onComplete={(initials) => assignInitials(device.id, initials)}
            />
          ) : (
            <TypeInitialsInput
              onComplete={(initials) => assignInitials(device.id, initials)}
            />
          )}
        </div>

        <div style={styles.field}>
          <div style={styles.labelRow}>
            <span style={styles.label}>COLOUR</span>
          </div>
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

function TypeInitialsInput({ onComplete }: { onComplete: (v: string) => void }): React.ReactElement {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
    setValue(v)
    if (v.length === 3) onComplete(v)
  }

  return (
    <input
      ref={inputRef}
      autoFocus
      value={value}
      onChange={handleChange}
      maxLength={3}
      placeholder="ABC"
      style={styles.typeInput}
      spellCheck={false}
    />
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
  labelRow:  { display: 'flex', alignItems: 'center', gap: 10 },
  label:     { fontSize: 7, color: C.dim, letterSpacing: 2 },

  toggle: { display: 'flex' },
  toggleBtn: {
    padding: '3px 8px', fontSize: 6, letterSpacing: 1,
    background: 'transparent', border: `2px solid ${C.borderDim}`,
    color: C.dim, cursor: 'pointer',
    fontFamily: "'Press Start 2P', monospace",
  },
  toggleBtnActive: {
    background: C.bgMid, color: C.yellow,
    borderColor: C.orange,
  },

  typeInput: {
    width: 80,
    background: C.bgDark,
    border: `3px solid ${C.orange}`,
    color: C.white,
    fontSize: 22,
    letterSpacing: 10,
    padding: '6px 10px',
    fontFamily: "'Press Start 2P', monospace",
    outline: 'none',
    boxShadow: `3px 3px 0 ${C.black}`,
    textTransform: 'uppercase' as const,
  },
  swatches: { display: 'flex', gap: 6 },
  swatch: {
    width: 22, height: 22,
    cursor: 'pointer', outline: 'none',
  },

  initialsLocked: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  initialsDisplay: {
    fontSize: 28, color: C.green, letterSpacing: 10,
    textShadow: `3px 3px 0 #000, 0 0 16px rgba(57,255,20,0.4)`,
  },
  resetBtn: {
    background: 'transparent',
    border: `2px solid ${C.muted}`,
    color: C.muted,
    fontSize: 14, cursor: 'pointer',
    padding: '4px 8px',
    boxShadow: `2px 2px 0 #000`,
  },
}
