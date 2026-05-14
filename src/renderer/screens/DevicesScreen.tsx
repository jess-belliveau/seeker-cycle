import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeviceStore } from '../store/deviceStore'
import { DeviceCard } from '../components/devices/DeviceCard'
import { RiderSetup } from '../components/devices/RiderSetup'
import { C, pixelBtn, sunsetBg } from '../theme'

export function DevicesScreen(): React.ReactElement {
  const navigate = useNavigate()
  const { discovered, connected, isScanning, setScanning } = useDeviceStore()

  const connectedList = Object.values(connected)
  const readyRiders   = connectedList.filter((d) => d.status === 'connected' && d.initials.length > 0)
  const canStart      = readyRiders.length >= 1

  useEffect(() => {
    setScanning(true)
    window.api.ble.startScan().catch(console.error)
    return () => {
      window.api.ble.stopScan().catch(console.error)
      setScanning(false)
    }
  }, [setScanning])

  return (
    <div style={{ ...styles.container, ...sunsetBg }}>
      {/* Header */}
      <div style={styles.header}>
        <button
          style={{ ...pixelBtn(C.dim), ...styles.backBtn }}
          onClick={() => navigate('/menu')}
        >
          ◀ BACK
        </button>
        <div style={styles.title}>DEVICE SETUP</div>
        <div style={styles.scanStatus}>
          {isScanning
            ? <><span style={styles.scanDot} /> SCANNING</>
            : 'IDLE'}
        </div>
      </div>

      {/* Body */}
      <div style={styles.body}>
        {/* Left — discovered devices */}
        <div style={styles.panel}>
          <div style={styles.panelTitle}>
            DEVICES FOUND ({discovered.length})
          </div>
          {discovered.length === 0 ? (
            <div style={styles.empty}>
              {isScanning ? 'SEARCHING...' : 'NO DEVICES FOUND'}
            </div>
          ) : (
            <div style={styles.list}>
              {discovered.map((d) => (
                <DeviceCard
                  key={d.id}
                  device={d}
                  connected={connected[d.id]}
                  onConnect={(id) => window.api.ble.connect(id).catch(console.error)}
                  onDisconnect={(id) => window.api.ble.disconnect(id).catch(console.error)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Right — rider setup */}
        <div style={styles.panel}>
          <div style={styles.panelTitle}>
            RIDERS ({connectedList.length})
          </div>
          {connectedList.length === 0 ? (
            <div style={styles.empty}>CONNECT A DEVICE{'\n'}TO ADD A RIDER</div>
          ) : (
            <div style={styles.list}>
              {connectedList.map((d) => (
                <RiderSetup key={d.id} device={d} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.hint}>
          {canStart
            ? `${readyRiders.length} RIDER${readyRiders.length > 1 ? 'S' : ''} READY — LETS RACE!`
            : 'CONNECT A DEVICE AND ENTER INITIALS TO START'}
        </div>
        <button
          style={{
            ...pixelBtn(canStart ? C.green : C.muted),
            ...styles.startBtn,
            ...(canStart ? {} : styles.startBtnOff),
          }}
          onClick={() => canStart && navigate('/race')}
          disabled={!canStart}
        >
          START RACE ▶▶
        </button>
      </div>

      <style>{scanAnim}</style>
    </div>
  )
}

const scanAnim = `
@keyframes scanPulse {
  0%,100% { opacity:1; } 50% { opacity:0.2; }
}
`

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 24px',
    background: '#000',
    borderBottom: `4px solid ${C.orange}`,
    flexShrink: 0,
  },
  backBtn: { padding: '8px 14px', fontSize: 8, letterSpacing: 1 },
  title:   { fontSize: 12, color: C.yellow, textShadow: `2px 2px 0 ${C.black}`, letterSpacing: 4 },
  scanStatus: {
    fontSize: 8, color: C.cyan, letterSpacing: 2,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  scanDot: {
    display: 'inline-block', width: 10, height: 10,
    background: C.cyan,
    animation: 'scanPulse 1s step-end infinite',
  },
  body: {
    flex: 1, display: 'grid', gridTemplateColumns: '1fr 4px 1fr',
    gap: 0, overflow: 'hidden', padding: 20,
  },
  panel: {
    display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto',
    paddingRight: 12,
  },
  divider: { background: C.borderDim, margin: '0 12px' },
  panelTitle: {
    fontSize: 8, color: C.orange, letterSpacing: 3,
    textShadow: `1px 1px 0 ${C.black}`,
    borderBottom: `2px solid ${C.borderDim}`,
    paddingBottom: 8,
  },
  list:  { display: 'flex', flexDirection: 'column', gap: 10 },
  empty: {
    fontSize: 8, color: C.muted, textAlign: 'center',
    padding: '32px 0', lineHeight: 2.5, whiteSpace: 'pre',
  },
  footer: {
    padding: '14px 24px',
    background: '#000',
    borderTop: `4px solid ${C.orange}`,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexShrink: 0,
  },
  hint:    { fontSize: 8, color: C.dim },
  startBtn: { padding: '12px 28px', fontSize: 9, letterSpacing: 2 },
  startBtnOff: { opacity: 0.35, cursor: 'default' },
}
