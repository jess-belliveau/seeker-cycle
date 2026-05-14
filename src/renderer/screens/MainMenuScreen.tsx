import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeaderboardStore } from '../store/leaderboardStore'
import { useDeviceStore } from '../store/deviceStore'
import { useSettingsStore } from '../store/settingsStore'
import { C, pixelBox, pixelBtn, sunsetBg } from '../theme'

const css2 = `
@keyframes scanPulse {
  0%,100% { opacity:1; } 50% { opacity:0.2; }
}
`

interface GameMode {
  id: string
  label: string
  description: string
  enabled: boolean
}

const GAME_MODES: GameMode[] = [
  { id: 'race',      label: 'RACE',             description: 'FIRST TO FINISH WINS',  enabled: true  },
  { id: 'endurance', label: 'ENDURANCE',         description: 'HOLD TARGET POWER',     enabled: false },
  { id: 'sprint',    label: 'SPRINT',            description: 'MAX EFFORT INTERVALS',  enabled: false },
  { id: 'team',      label: 'TEAM RELAY',        description: 'TAG-TEAM RACING',       enabled: false },
]

function formatTime(ms: number | null): string {
  if (ms === null) return '  -:--.--'
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  const cs = Math.floor((ms % 1000) / 10)
  return `${m}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`
}

export function MainMenuScreen(): React.ReactElement {
  const navigate = useNavigate()
  const { entries, loading, load } = useLeaderboardStore()
  const { connected, isScanning } = useDeviceStore()
  const { adminMode, toggleAdminMode } = useSettingsStore()
  const connectedDevices = Object.values(connected).filter((d) => d.status === 'connected')
  const top5 = entries.slice(0, 5)

  useEffect(() => { load() }, [load])

  return (
    <div style={{ ...styles.container, ...sunsetBg }}>
      {/* Header bar */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoSeeker}>SEEKER</span>
          <span style={styles.logoCycle}>CYCLE</span>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.ticker}>
            ★ CALIFORNIA GAMES EDITION ★ PEDAL HARD ★ RIDE FAST ★ &nbsp;
          </div>
        </div>
        <div style={styles.headerBtns}>
          <button
            style={{ ...pixelBtn(C.purple), ...styles.quitBtn }}
            onClick={() => navigate('/splash')}
          >
            ◀ INTRO
          </button>
          <button
            style={{ ...pixelBtn(C.pink), ...styles.quitBtn }}
            onClick={() => window.api.app.quit()}
          >
            ■ QUIT
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={styles.body}>

        {/* Left — game modes */}
        <div style={styles.leftPanel}>

          {/* Connect Devices status card */}
          <button
            style={styles.devicesCard}
            onClick={() => navigate('/devices')}
          >
            <div style={styles.devicesCardTop}>
              <span style={styles.devicesCardLabel}>CONNECT DEVICES</span>
              {isScanning && (
                <span style={styles.scanDot} />
              )}
            </div>
            {connectedDevices.length > 0 ? (
              <span style={{ ...styles.devicesCardStatus, color: C.green }}>
                ■ {connectedDevices.length} CONNECTED
              </span>
            ) : (
              <span style={{ ...styles.devicesCardStatus, color: C.muted }}>
                ○ NO DEVICES
              </span>
            )}
          </button>

          <div style={styles.sectionLabel}>▶ SELECT MODE</div>

          <div style={styles.modeList}>
            {GAME_MODES.map((mode) => {
              const needsDevice = mode.id === 'race'
              const hasDevice = connectedDevices.length > 0
              const isClickable = mode.enabled && (!needsDevice || hasDevice)
              return (
                <button
                  key={mode.id}
                  style={{
                    ...styles.modeBtn,
                    ...(mode.enabled
                      ? (needsDevice && !hasDevice ? styles.modeBtnNeedsDevice : styles.modeBtnOn)
                      : styles.modeBtnOff),
                  }}
                  onClick={() => {
                    if (!isClickable) return
                    navigate('/character-select')
                  }}
                  disabled={!mode.enabled}
                >
                  <span style={styles.modeBtnLabel}>{mode.label}</span>
                  <span style={styles.modeBtnDesc}>{mode.description}</span>
                  {!mode.enabled && <span style={styles.comingSoon}>LOCKED</span>}
                  {mode.enabled && needsDevice && !hasDevice && (
                    <span style={styles.comingSoon}>CONNECT DEVICES FIRST</span>
                  )}
                </button>
              )
            })}
          </div>

          <button
            style={{ ...styles.adminToggle, ...(adminMode ? styles.adminToggleOn : {}) }}
            onClick={toggleAdminMode}
          >
            <span style={styles.adminDot} />
            ADMIN MODE {adminMode ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Right — leaderboard + live debug */}
        <div style={styles.rightPanel}>
          <div style={{ ...pixelBox(C.amber), ...styles.lbBox }}>
            <div style={styles.lbTitle}>🏆 HIGH SCORES</div>

            {loading && <div style={styles.lbEmpty}>LOADING...</div>}

            {!loading && top5.length === 0 && (
              <div style={styles.lbEmpty}>
                NO RECORDS YET{'\n'}RACE TO SET ONE!
              </div>
            )}

            {!loading && top5.length > 0 && (
              <div style={styles.lbList}>
                {top5.map((entry, i) => (
                  <div key={entry.initials} style={{
                    ...styles.lbRow,
                    background: i === 0 ? 'rgba(255,238,16,0.12)' : 'transparent'
                  }}>
                    <span style={{
                      ...styles.lbRank,
                      color: i === 0 ? C.yellow : i === 1 ? C.dim : i === 2 ? C.amber : C.muted
                    }}>
                      {i + 1}.
                    </span>
                    <span style={styles.lbInitials}>{entry.initials}</span>
                    <div style={styles.lbScoreCol}>
                      <span style={styles.lbTime}>{formatTime(entry.bestFinishTimeMs)}</span>
                      <span style={styles.lbMeta}>
                        {entry.totalRaces}x · {Math.round(entry.avgWatts)}W
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live device debug panel */}
          {connectedDevices.length > 0 && (
            <div style={{ ...pixelBox(C.green), ...styles.debugBox }}>
              <div style={{ ...styles.lbTitle, color: C.green }}>◉ LIVE DEVICES</div>
              {connectedDevices.map((d) => (
                <DeviceDebugRow
                  key={d.id}
                  deviceId={d.id}
                  name={d.name}
                  onDisconnect={() => window.api.ble.disconnect(d.id).catch(console.error)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{css}</style>
      <style>{css2}</style>
    </div>
  )
}

function DeviceDebugRow({
  deviceId, name, onDisconnect
}: {
  deviceId: string
  name: string
  onDisconnect: () => void
}): React.ReactElement {
  const reading = useDeviceStore((s) => s.liveReadings[deviceId])
  const w = reading ? Math.round(reading.watts) : 0
  const rpm = reading ? Math.round(reading.rpm) : 0

  return (
    <div style={styles.debugRow}>
      <span style={styles.debugName}>{name.slice(0, 14)}</span>
      <span style={{ ...styles.debugVal, color: C.cyan }}>{String(w).padStart(3,'0')}W</span>
      <span style={{ ...styles.debugVal, color: C.pink }}>{String(rpm).padStart(3,'0')}rpm</span>
      <button
        style={{ ...pixelBtn(C.muted), ...styles.disconnectBtn }}
        onClick={onDisconnect}
      >
        ✕
      </button>
    </div>
  )
}

const css = `
@keyframes tickerScroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
`

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px',
    height: 56,
    background: '#000',
    borderBottom: `4px solid ${C.orange}`,
    boxShadow: `0 4px 0 ${C.black}`,
    flexShrink: 0,
  },
  logo: { display: 'flex', alignItems: 'baseline', gap: 12 },
  logoSeeker: {
    fontSize: 20, color: C.yellow,
    textShadow: `2px 2px 0 ${C.black}`,
    letterSpacing: 4,
  },
  logoCycle: {
    fontSize: 12, color: C.orange,
    textShadow: `2px 2px 0 ${C.black}`,
    letterSpacing: 6,
  },
  headerRight: {
    flex: 1, overflow: 'hidden', marginLeft: 24,
    height: '100%', display: 'flex', alignItems: 'center',
  },
  ticker: {
    fontSize: 8, color: C.pink,
    textShadow: `1px 1px 0 ${C.black}`,
    whiteSpace: 'nowrap',
    animation: 'tickerScroll 12s linear infinite',
  },
  body: {
    flex: 1, display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 0,
    overflow: 'hidden',
    padding: 24, gap2: 24,
  } as React.CSSProperties,
  leftPanel: {
    paddingRight: 16,
    display: 'flex', flexDirection: 'column', gap: 12,
    borderRight: `3px solid ${C.borderDim}`,
  },
  rightPanel: {
    paddingLeft: 16,
    display: 'flex', flexDirection: 'column', gap: 16,
    overflowY: 'auto',
  },
  sectionLabel: {
    fontSize: 8, color: C.orange, letterSpacing: 2,
    marginBottom: 4,
    textShadow: `1px 1px 0 ${C.black}`,
  },
  modeList: { display: 'flex', flexDirection: 'column', gap: 8, flex: 1 },
  modeBtn: {
    display: 'flex', flexDirection: 'column', gap: 6,
    padding: '14px 16px',
    textAlign: 'left', cursor: 'pointer',
    position: 'relative',
  },
  modeBtnOn: {
    background: C.bgMid,
    border: `3px solid ${C.orange}`,
    boxShadow: `4px 4px 0 ${C.black}`,
    color: C.white,
  },
  modeBtnOff: {
    background: '#0d0221',
    border: `3px solid ${C.muted}`,
    boxShadow: `4px 4px 0 ${C.black}`,
    color: C.muted,
    opacity: 0.6,
    cursor: 'default',
  },
  modeBtnNeedsDevice: {
    background: '#0d0221',
    border: `3px solid ${C.borderDim}`,
    boxShadow: `4px 4px 0 ${C.black}`,
    color: C.dim,
    opacity: 0.7,
    cursor: 'default',
  },
  modeBtnLabel: { fontSize: 11, letterSpacing: 2 },
  modeBtnDesc:  { fontSize: 7,  color: C.dim, letterSpacing: 1 },
  comingSoon: {
    position: 'absolute', top: 8, right: 10,
    fontSize: 6, color: C.purple, letterSpacing: 1,
    border: `2px solid ${C.purple}`, padding: '2px 4px',
  },
  devicesCard: {
    display: 'flex', flexDirection: 'column', gap: 6,
    padding: '12px 14px',
    background: C.bgDark,
    border: `3px solid ${C.cyan}`,
    boxShadow: `4px 4px 0 ${C.black}`,
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontFamily: "'Press Start 2P', monospace",
  },
  devicesCardTop: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  devicesCardLabel: {
    fontSize: 8, color: C.cyan, letterSpacing: 2,
  },
  devicesCardStatus: {
    fontSize: 7, letterSpacing: 1,
  },
  scanDot: {
    display: 'inline-block', width: 8, height: 8,
    background: C.cyan,
    animation: 'scanPulse 1s step-end infinite',
  },
  devicesBtn: {
    padding: '14px 16px',
    fontSize: 9, letterSpacing: 2,
    textAlign: 'left',
  },
  lbBox: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  lbTitle: {
    fontSize: 9, color: C.amber, letterSpacing: 2,
    textShadow: `2px 2px 0 ${C.black}`,
    borderBottom: `2px solid ${C.borderDim}`,
    paddingBottom: 8, marginBottom: 4,
  },
  lbEmpty: {
    fontSize: 8, color: C.muted, textAlign: 'center',
    padding: '16px 0', lineHeight: 2, whiteSpace: 'pre',
  },
  lbList: { display: 'flex', flexDirection: 'column', gap: 2 },
  lbRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 6px',
  },
  lbRank: { fontSize: 10, width: 20, textAlign: 'right', flexShrink: 0 },
  lbInitials: {
    fontSize: 12, color: C.white, letterSpacing: 3,
    width: 52, flexShrink: 0,
    textShadow: `2px 2px 0 ${C.black}`,
  },
  lbScoreCol: { flex: 1, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' },
  lbTime: {
    fontSize: 11, color: C.cyan,
    fontVariantNumeric: 'tabular-nums',
    textShadow: `1px 1px 0 ${C.black}`,
  },
  lbMeta: { fontSize: 6, color: C.muted },
  debugBox: { padding: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  debugRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    borderBottom: `2px solid ${C.borderDim}`, paddingBottom: 6,
  },
  debugName: { fontSize: 7, color: C.dim, flex: 1 },
  debugVal: { fontSize: 11, textShadow: `1px 1px 0 ${C.black}` },
  disconnectBtn: { padding: '4px 8px', fontSize: 8 },

  headerBtns: { display: 'flex', gap: 8, flexShrink: 0 },
  quitBtn: { padding: '8px 14px', fontSize: 8, letterSpacing: 1 },

  adminToggle: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 12px',
    background: 'transparent',
    border: `2px solid ${C.muted}`,
    boxShadow: `3px 3px 0 ${C.black}`,
    color: C.muted,
    fontSize: 7, letterSpacing: 2,
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  adminToggleOn: {
    border: `2px solid ${C.green}`,
    color: C.green,
  },
  adminDot: {
    display: 'inline-block', width: 8, height: 8,
    background: 'currentColor',
    flexShrink: 0,
  },
}
