import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeviceStore } from '../store/deviceStore'
import { DeviceCard } from '../components/devices/DeviceCard'
import { RiderSetup } from '../components/devices/RiderSetup'

export function DevicesScreen(): React.ReactElement {
  const navigate = useNavigate()
  const { discovered, connected, isScanning, setScanning, clearAll } = useDeviceStore()

  const connectedList = Object.values(connected)
  const readyRiders = connectedList.filter(
    (d) => d.status === 'connected' && d.initials.length > 0
  )
  const canStart = readyRiders.length >= 1

  useEffect(() => {
    setScanning(true)
    window.api.ble.startScan().catch(console.error)
    return () => {
      window.api.ble.stopScan().catch(console.error)
      setScanning(false)
    }
  }, [setScanning])

  const handleConnect = (deviceId: string): void => {
    window.api.ble.connect(deviceId).catch(console.error)
  }

  const handleDisconnect = (deviceId: string): void => {
    window.api.ble.disconnect(deviceId).catch(console.error)
  }

  const handleStartRace = (): void => {
    if (!canStart) return
    navigate('/race')
  }

  const handleBack = (): void => {
    clearAll()
    navigate('/menu')
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={handleBack}>← MENU</button>
        <div style={styles.title}>DEVICE SETUP</div>
        <div style={styles.scanStatus}>
          {isScanning ? (
            <><span style={styles.scanDot} />SCANNING</>
          ) : (
            'IDLE'
          )}
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.leftPanel}>
          <div style={styles.panelHeader}>AVAILABLE DEVICES ({discovered.length})</div>
          {discovered.length === 0 ? (
            <div style={styles.empty}>
              {isScanning ? 'Searching for trainers…' : 'No devices found'}
            </div>
          ) : (
            <div style={styles.deviceList}>
              {discovered.map((d) => (
                <DeviceCard
                  key={d.id}
                  device={d}
                  connected={connected[d.id]}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                />
              ))}
            </div>
          )}
        </div>

        <div style={styles.rightPanel}>
          <div style={styles.panelHeader}>RIDERS ({connectedList.length})</div>
          {connectedList.length === 0 ? (
            <div style={styles.empty}>Connect a trainer to add a rider</div>
          ) : (
            <div style={styles.riderList}>
              {connectedList.map((d) => (
                <RiderSetup key={d.id} device={d} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={styles.footer}>
        <div style={styles.footerHint}>
          {canStart
            ? `${readyRiders.length} rider${readyRiders.length > 1 ? 's' : ''} ready`
            : 'Connect at least one trainer and enter initials to start'}
        </div>
        <button
          style={{ ...styles.startBtn, ...(canStart ? {} : styles.startBtnDisabled) }}
          onClick={handleStartRace}
          disabled={!canStart}
        >
          START RACE ▶
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(160deg, #0d1117 0%, #0a0a0f 100%)',
    padding: '0 0 0 0'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 40px',
    borderBottom: '1px solid rgba(255,255,255,0.07)'
  },
  backBtn: {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.6)',
    padding: '8px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: 600
  },
  title: {
    fontSize: 16,
    letterSpacing: 8,
    fontWeight: 800,
    color: '#ffffff'
  },
  scanStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 600
  },
  scanDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#00d4ff',
    display: 'inline-block',
    animation: 'pulse 1.2s ease-in-out infinite'
  },
  body: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 0,
    overflow: 'hidden'
  },
  leftPanel: {
    padding: '24px 32px',
    borderRight: '1px solid rgba(255,255,255,0.07)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    overflowY: 'auto'
  },
  rightPanel: {
    padding: '24px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    overflowY: 'auto'
  },
  panelHeader: {
    fontSize: 11,
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: 700,
    marginBottom: 4
  },
  deviceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  riderList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  empty: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 13,
    textAlign: 'center',
    padding: '40px 0'
  },
  footer: {
    padding: '20px 40px',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)'
  },
  startBtn: {
    padding: '14px 48px',
    background: 'rgba(0,212,255,0.15)',
    border: '1px solid rgba(0,212,255,0.5)',
    borderRadius: 8,
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: 4,
    cursor: 'pointer'
  },
  startBtnDisabled: {
    opacity: 0.3,
    cursor: 'default',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.3)',
    background: 'transparent'
  }
}
