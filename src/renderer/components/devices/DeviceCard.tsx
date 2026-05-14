import React from 'react'
import type { DiscoveredDevice, ConnectedDevice } from '../../types'
import { C, pixelBtn } from '../../theme'

const PROFILE_COLORS: Record<string, string> = {
  ftms: C.cyan, csc: C.purple, 'cycling-power': C.green, unknown: C.muted
}

const STATUS_COLOR: Record<string, string> = {
  discovered: C.muted, connecting: C.amber, connected: C.green,
  error: C.pink, disconnected: C.muted,
}

interface Props {
  device: DiscoveredDevice
  connected?: ConnectedDevice
  onConnect: (id: string) => void
  onDisconnect: (id: string) => void
}

export function DeviceCard({ device, connected, onConnect, onDisconnect }: Props): React.ReactElement {
  const isConnected  = connected?.status === 'connected'
  const isConnecting = connected?.status === 'connecting'
  const profileColor = PROFILE_COLORS[device.profile] ?? C.muted
  const statusColor  = connected ? (STATUS_COLOR[connected.status] ?? C.muted) : C.muted
  const bars = Math.min(4, Math.max(1, Math.round((device.rssi + 100) / 15)))

  return (
    <div style={styles.card}>
      <div style={styles.topRow}>
        <span style={{ ...styles.profileTag, color: profileColor, borderColor: profileColor }}>
          {device.profile.toUpperCase()}
        </span>
        <span style={styles.name}>{device.name}</span>
        <div style={styles.rightSide}>
          <SignalBars bars={bars} />
          {connected && <div style={{ ...styles.statusDot, background: statusColor }} />}
        </div>
      </div>

      <div style={styles.actions}>
        {!connected ? (
          <button style={{ ...pixelBtn(C.cyan), ...styles.actionBtn }}
            onClick={() => onConnect(device.id)}>CONNECT</button>
        ) : isConnecting ? (
          <button style={{ ...pixelBtn(C.amber), ...styles.actionBtn }} disabled>
            CONNECTING<BlinkDots />
          </button>
        ) : isConnected ? (
          <button style={{ ...pixelBtn(C.pink), ...styles.actionBtn }}
            onClick={() => onDisconnect(device.id)}>DISCONNECT</button>
        ) : (
          <button style={{ ...pixelBtn(C.orange), ...styles.actionBtn }}
            onClick={() => onConnect(device.id)}>RETRY</button>
        )}
      </div>
    </div>
  )
}

function SignalBars({ bars }: { bars: number }): React.ReactElement {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 16 }}>
      {[1,2,3,4].map((b) => (
        <div key={b} style={{
          width: 5, height: 4 + b * 3,
          background: b <= bars ? C.cyan : C.muted,
        }} />
      ))}
    </div>
  )
}

function BlinkDots(): React.ReactElement {
  return <span style={{ animation: 'blink 0.8s step-end infinite' }}>...</span>
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: C.bgMid,
    border: `3px solid ${C.borderDim}`,
    boxShadow: `3px 3px 0 ${C.black}`,
    padding: '10px 12px',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  topRow: {
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
  },
  name: { fontSize: 9, color: C.white, flex: 1 },
  profileTag: {
    fontSize: 7, fontWeight: 700, letterSpacing: 1,
    border: '2px solid', padding: '2px 5px',
    flexShrink: 0,
  },
  rightSide: { display: 'flex', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, flexShrink: 0 },
  actions: { display: 'flex', justifyContent: 'flex-end' },
  actionBtn: { padding: '8px 14px', fontSize: 8, letterSpacing: 1 },
}
