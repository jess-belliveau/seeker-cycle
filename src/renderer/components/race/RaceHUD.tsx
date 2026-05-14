import React from 'react'
import type { RaceState, RiderState } from '../../types'
import { C, pixelBtn } from '../../theme'

const RIDER_COLORS = [
  C.pink, C.orange, C.yellow, C.green,
  C.cyan, C.purple, '#ff8c00', C.white,
]

function fmt(ms: number): string {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${String(s).padStart(2, '0')}`
}

interface Props {
  race:   RaceState
  onStop: () => void
}

function RiderPanel({ rider, align }: { rider: RiderState; align: 'left' | 'right' }): React.ReactElement {
  const color   = RIDER_COLORS[rider.avatarIndex % RIDER_COLORS.length]
  const watts   = Math.round(rider.currentWatts)
  const kmh     = (rider.velocityMs * 3.6).toFixed(1)
  const finished = rider.finishTimeMs !== null

  return (
    <div style={{ ...styles.panel, ...(align === 'right' ? styles.panelRight : styles.panelLeft) }}>
      {/* Rank + initials row */}
      <div style={styles.panelHeader}>
        {rider.rank !== null && (
          <div style={{ ...styles.rankBadge, background: color }}>
            #{rider.rank}
          </div>
        )}
        <div style={{ ...styles.initials, color }}>
          {rider.initials || '??'}
        </div>
        {finished && <div style={styles.finishedTag}>✓ FIN</div>}
      </div>

      {/* Watts — huge */}
      <div style={styles.wattsRow}>
        <span style={{ ...styles.wattsNum, color: finished ? C.dim : color }}>
          {watts}
        </span>
        <span style={{ ...styles.wattsUnit, color: finished ? C.dim : color }}>W</span>
      </div>

      {/* Speed */}
      <div style={styles.speedRow}>
        <span style={{ ...styles.speedNum, color: C.white }}>{kmh}</span>
        <span style={styles.speedUnit}>km/h</span>
      </div>
    </div>
  )
}

export function RaceHUD({ race, onStop }: Props): React.ReactElement {
  const riders   = Object.values(race.riders)
  const sorted   = [...riders].sort((a, b) => b.positionMeters - a.positionMeters)
  const leader   = sorted[0]
  const distLeft = Math.max(0, Math.round(race.config.distanceMeters - (leader?.positionMeters ?? 0)))

  // Split riders: even indices → left, odd → right
  const leftRiders  = sorted.filter((_, i) => i % 2 === 0)
  const rightRiders = sorted.filter((_, i) => i % 2 === 1)

  return (
    <>
      {/* Top bar — timer + stop */}
      <div style={styles.topBar}>
        <div style={styles.timerBlock}>
          <div style={styles.timerLabel}>TIME</div>
          <div style={styles.timerVal}>{fmt(race.elapsedMs)}</div>
        </div>
        <button style={{ ...pixelBtn(C.pink), ...styles.stopBtn }} onClick={onStop}>
          ■ END
        </button>
      </div>

      {/* Left rider panels */}
      <div style={styles.leftStack}>
        {leftRiders.map((r) => (
          <RiderPanel key={r.deviceId} rider={r} align="left" />
        ))}
      </div>

      {/* Right rider panels */}
      {rightRiders.length > 0 && (
        <div style={styles.rightStack}>
          {rightRiders.map((r) => (
            <RiderPanel key={r.deviceId} rider={r} align="right" />
          ))}
        </div>
      )}

      {/* Center bottom — distance to finish */}
      <div style={styles.distCenter}>
        <div style={styles.distNum}>{distLeft}</div>
        <div style={styles.distLabel}>M TO FINISH</div>
      </div>
    </>
  )
}

const PANEL_BG = 'rgba(0,0,0,0.72)'

const styles: Record<string, React.CSSProperties> = {
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 52,
    background: 'rgba(0,0,0,0.80)',
    borderBottom: `3px solid ${C.orange}`,
    display: 'flex', alignItems: 'center',
    padding: '0 18px',
    zIndex: 20,
  },
  timerBlock: { display: 'flex', flexDirection: 'column', gap: 2 },
  timerLabel: { fontSize: 6, color: C.dim, letterSpacing: 2 },
  timerVal: {
    fontSize: 18, color: C.yellow,
    textShadow: `2px 2px 0 ${C.black}`,
    fontVariantNumeric: 'tabular-nums',
  },
  stopBtn: { padding: '8px 14px', fontSize: 8, letterSpacing: 1, marginLeft: 'auto' },

  // Stacks
  leftStack: {
    position: 'absolute', bottom: 24, left: 16,
    display: 'flex', flexDirection: 'column', gap: 12,
    zIndex: 20,
  },
  rightStack: {
    position: 'absolute', bottom: 24, right: 16,
    display: 'flex', flexDirection: 'column', gap: 12,
    zIndex: 20,
  },

  // Rider panel
  panel: {
    background: PANEL_BG,
    border: `3px solid ${C.borderDim}`,
    boxShadow: `4px 4px 0 ${C.black}`,
    padding: '10px 16px',
    minWidth: 160,
  },
  panelLeft:  {},
  panelRight: { alignItems: 'flex-end' },

  panelHeader: {
    display: 'flex', alignItems: 'center', gap: 8,
    marginBottom: 4,
  },
  rankBadge: {
    fontSize: 8, color: C.black,
    fontFamily: "'Press Start 2P', monospace",
    padding: '2px 5px',
    boxShadow: '2px 2px 0 #000',
    lineHeight: 1.4,
  },
  initials: {
    fontSize: 13, letterSpacing: 2,
    textShadow: `2px 2px 0 ${C.black}`,
  },
  finishedTag: {
    fontSize: 7, color: C.green,
    marginLeft: 4, letterSpacing: 1,
  },

  wattsRow: { display: 'flex', alignItems: 'baseline', gap: 4 },
  wattsNum: {
    fontSize: 64, lineHeight: 1,
    textShadow: `4px 4px 0 ${C.black}`,
  },
  wattsUnit: {
    fontSize: 24,
    textShadow: `2px 2px 0 ${C.black}`,
  },

  speedRow: { display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 },
  speedNum: {
    fontSize: 28, lineHeight: 1,
    textShadow: `2px 2px 0 ${C.black}`,
    fontVariantNumeric: 'tabular-nums',
  },
  speedUnit: { fontSize: 9, color: C.dim, letterSpacing: 1 },

  // Center bottom distance
  distCenter: {
    position: 'absolute', bottom: 24,
    left: '50%', transform: 'translateX(-50%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    zIndex: 20,
    pointerEvents: 'none',
  },
  distNum: {
    fontSize: 80, lineHeight: 1, color: C.white,
    textShadow: `6px 6px 0 ${C.black}, 0 0 30px rgba(255,238,16,0.4)`,
    fontVariantNumeric: 'tabular-nums',
  },
  distLabel: {
    fontSize: 10, color: C.yellow, letterSpacing: 4,
    textShadow: `2px 2px 0 ${C.black}`,
    marginTop: 4,
  },
}
