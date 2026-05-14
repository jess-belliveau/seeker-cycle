import React from 'react'
import type { RaceState } from '../../types'

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

interface Props {
  race: RaceState
  onStop: () => void
}

export function RaceHUD({ race, onStop }: Props): React.ReactElement {
  const riders = Object.values(race.riders)
  const sorted = [...riders].sort((a, b) => b.positionMeters - a.positionMeters)
  const leaderPos = sorted[0]?.positionMeters ?? 0

  return (
    <>
      {/* Top bar */}
      <div style={styles.topBar}>
        <div style={styles.timer}>{formatTime(race.elapsedMs)}</div>
        <div style={styles.distanceLeft}>
          {Math.max(0, Math.round(race.config.distanceMeters - leaderPos))}m to finish
        </div>
        <button style={styles.stopBtn} onClick={onStop}>■ END RACE</button>
      </div>

      {/* Leaderboard sidebar */}
      <div style={styles.leaderboard}>
        <div style={styles.lbHeader}>STANDINGS</div>
        {sorted.map((rider, i) => (
          <div key={rider.deviceId} style={styles.lbRow}>
            <span style={styles.lbRank}>{i + 1}</span>
            <span style={styles.lbInitials}>{rider.initials || '??'}</span>
            <div style={styles.lbRight}>
              <span style={styles.lbWatts}>{Math.round(rider.currentWatts)}W</span>
              {rider.finishTimeMs !== null && (
                <span style={styles.lbFinish}>✓ {formatTime(rider.finishTimeMs)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    zIndex: 10
  },
  timer: {
    fontSize: 36,
    fontWeight: 900,
    color: '#ffffff',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: 2
  },
  distanceLeft: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2
  },
  stopBtn: {
    padding: '8px 20px',
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: 6,
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 2,
    cursor: 'pointer'
  },
  leaderboard: {
    position: 'absolute',
    top: 80,
    right: 24,
    width: 200,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '12px 0',
    zIndex: 10
  },
  lbHeader: {
    fontSize: 10,
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: 700,
    padding: '0 16px 8px',
    borderBottom: '1px solid rgba(255,255,255,0.07)'
  },
  lbRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 16px'
  },
  lbRank: {
    width: 18,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 700
  },
  lbInitials: {
    flex: 1,
    fontSize: 16,
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: 2
  },
  lbRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2
  },
  lbWatts: {
    fontSize: 12,
    color: '#00d4ff',
    fontWeight: 700
  },
  lbFinish: {
    fontSize: 10,
    color: '#22c55e',
    fontWeight: 600
  }
}
