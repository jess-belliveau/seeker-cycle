import React from 'react'
import type { DiscoveredDevice, ConnectedDevice } from '../../types'

const PROFILE_LABELS: Record<string, string> = {
  ftms: 'FTMS',
  csc: 'CSC',
  'cycling-power': 'POWER',
  unknown: '?'
}

const PROFILE_COLORS: Record<string, string> = {
  ftms: '#00d4ff',
  csc: '#a855f7',
  'cycling-power': '#22c55e',
  unknown: '#6b7280'
}

const STATUS_COLORS: Record<string, string> = {
  discovered: '#6b7280',
  connecting: '#f59e0b',
  connected: '#22c55e',
  error: '#ef4444',
  disconnected: '#6b7280'
}

interface Props {
  device: DiscoveredDevice
  connected?: ConnectedDevice
  onConnect: (id: string) => void
  onDisconnect: (id: string) => void
}

export function DeviceCard({ device, connected, onConnect, onDisconnect }: Props): React.ReactElement {
  const isConnected = connected?.status === 'connected'
  const isConnecting = connected?.status === 'connecting'
  const profileColor = PROFILE_COLORS[device.profile] ?? '#6b7280'
  const statusColor = connected ? (STATUS_COLORS[connected.status] ?? '#6b7280') : '#6b7280'
  const signalBars = Math.min(4, Math.max(1, Math.round((device.rssi + 100) / 15)))

  return (
    <div style={styles.card}>
      <div style={styles.topRow}>
        <div style={styles.nameRow}>
          <span style={{ ...styles.profileBadge, color: profileColor, borderColor: profileColor }}>
            {PROFILE_LABELS[device.profile] ?? '?'}
          </span>
          <span style={styles.name}>{device.name}</span>
        </div>
        <div style={styles.rightSide}>
          <SignalBars bars={signalBars} />
          {connected && (
            <span style={{ ...styles.statusDot, background: statusColor }} />
          )}
        </div>
      </div>

      <div style={styles.actions}>
        {!connected ? (
          <button style={styles.connectBtn} onClick={() => onConnect(device.id)}>
            CONNECT
          </button>
        ) : isConnecting ? (
          <button style={{ ...styles.connectBtn, ...styles.connectingBtn }} disabled>
            CONNECTING…
          </button>
        ) : isConnected ? (
          <button style={{ ...styles.connectBtn, ...styles.disconnectBtn }}
            onClick={() => onDisconnect(device.id)}>
            DISCONNECT
          </button>
        ) : (
          <button style={styles.connectBtn} onClick={() => onConnect(device.id)}>
            RETRY
          </button>
        )}
      </div>
    </div>
  )
}

function SignalBars({ bars }: { bars: number }): React.ReactElement {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 16 }}>
      {[1, 2, 3, 4].map((b) => (
        <div
          key={b}
          style={{
            width: 4,
            height: 4 + (b * 3),
            borderRadius: 1,
            background: b <= bars ? '#00d4ff' : 'rgba(255,255,255,0.15)'
          }}
        />
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  name: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e0e0e0'
  },
  profileBadge: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1,
    border: '1px solid',
    borderRadius: 4,
    padding: '2px 6px'
  },
  rightSide: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  connectBtn: {
    padding: '6px 16px',
    background: 'rgba(0,212,255,0.15)',
    border: '1px solid rgba(0,212,255,0.4)',
    borderRadius: 6,
    color: '#00d4ff',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 2,
    cursor: 'pointer'
  },
  connectingBtn: {
    opacity: 0.6,
    cursor: 'default'
  },
  disconnectBtn: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#ef4444'
  }
}
