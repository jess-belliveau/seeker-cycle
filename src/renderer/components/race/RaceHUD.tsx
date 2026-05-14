import React from 'react'
import type { RaceState } from '../../types'
import { C, pixelBtn } from '../../theme'

function fmt(ms: number): string {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${String(s).padStart(2, '0')}`
}

interface Props {
  race: RaceState
  onStop: () => void
}

export function RaceHUD({ race, onStop }: Props): React.ReactElement {
  const riders  = Object.values(race.riders)
  const sorted  = [...riders].sort((a, b) => b.positionMeters - a.positionMeters)
  const leader  = sorted[0]
  const distLeft = Math.max(0, Math.round(race.config.distanceMeters - (leader?.positionMeters ?? 0)))

  return (
    <>
      {/* Top HUD bar */}
      <div style={styles.bar}>
        <div style={styles.timerBox}>
          <div style={styles.timerLabel}>TIME</div>
          <div style={styles.timer}>{fmt(race.elapsedMs)}</div>
        </div>

        <div style={styles.distBox}>
          <div style={styles.timerLabel}>TO FINISH</div>
          <div style={styles.timer}>{distLeft}M</div>
        </div>

        <button style={{ ...pixelBtn(C.pink), ...styles.stopBtn }} onClick={onStop}>
          ■ END
        </button>
      </div>

      {/* Standings panel */}
      <div style={styles.standings}>
        <div style={styles.standTitle}>STANDINGS</div>
        {sorted.map((r, i) => (
          <div key={r.deviceId} style={{
            ...styles.standRow,
            background: i === 0 ? 'rgba(255,238,16,0.1)' : 'transparent',
          }}>
            <span style={{ ...styles.standRank, color: i === 0 ? C.yellow : C.dim }}>
              {i + 1}.
            </span>
            <span style={styles.standInitials}>{r.initials || '??'}</span>
            <div style={styles.standRight}>
              <span style={{ fontSize: 8, color: C.cyan }}>{Math.round(r.currentWatts)}W</span>
              {r.finishTimeMs !== null && (
                <span style={{ fontSize: 7, color: C.green }}>✓{fmt(r.finishTimeMs)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 60,
    background: '#000',
    borderBottom: `4px solid ${C.orange}`,
    display: 'flex', alignItems: 'center', gap: 24,
    padding: '0 20px',
    zIndex: 20,
  },
  timerBox:  { display: 'flex', flexDirection: 'column', gap: 2 },
  distBox:   { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 },
  timerLabel:{ fontSize: 6, color: C.dim, letterSpacing: 2 },
  timer:     {
    fontSize: 20, color: C.yellow,
    textShadow: `2px 2px 0 ${C.black}`,
    fontVariantNumeric: 'tabular-nums',
  },
  stopBtn:   { padding: '8px 14px', fontSize: 8, letterSpacing: 1, marginLeft: 'auto' },

  standings: {
    position: 'absolute', top: 76, right: 16,
    width: 190,
    background: '#000',
    border: `3px solid ${C.orange}`,
    boxShadow: `4px 4px 0 ${C.black}`,
    zIndex: 20,
    padding: '8px 0',
  },
  standTitle: {
    fontSize: 7, color: C.orange, letterSpacing: 3,
    padding: '0 12px 6px',
    borderBottom: `2px solid ${C.borderDim}`,
  },
  standRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 12px',
  },
  standRank:     { fontSize: 9, width: 16, flexShrink: 0 },
  standInitials: {
    fontSize: 11, color: C.white, letterSpacing: 2,
    flex: 1,
    textShadow: `1px 1px 0 ${C.black}`,
  },
  standRight: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
  },
}
