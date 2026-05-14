import React from 'react'
import type { RiderState } from '../../types'

const RIDER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#00d4ff', '#a855f7', '#ec4899', '#ffffff'
]

interface Props {
  rider: RiderState
  xPx: number
  isLeader: boolean
  finishDistanceM: number
}

export function RiderAvatar({ rider, xPx, isLeader, finishDistanceM }: Props): React.ReactElement {
  const color = RIDER_COLORS[rider.avatarIndex % RIDER_COLORS.length]
  const pct = Math.min(100, (rider.positionMeters / finishDistanceM) * 100)
  const finished = rider.finishTimeMs !== null

  return (
    <div
      style={{
        ...styles.wrapper,
        transform: `translateX(${xPx}px)`,
        transition: 'transform 80ms linear'
      }}
    >
      {/* Rank badge */}
      {rider.rank !== null && (
        <div style={{ ...styles.rankBadge, background: color }}>
          {rider.rank}
        </div>
      )}

      {/* Bike icon */}
      <div style={{ ...styles.bikeIcon, background: color, opacity: finished ? 0.6 : 1 }}>
        <svg viewBox="0 0 32 24" width="32" height="24" fill="none">
          {/* Simple bike silhouette */}
          <circle cx="7" cy="17" r="5" stroke="white" strokeWidth="2" />
          <circle cx="25" cy="17" r="5" stroke="white" strokeWidth="2" />
          <path d="M7 17 L16 7 L25 17" stroke="white" strokeWidth="2" strokeLinejoin="round" />
          <path d="M16 7 L20 17" stroke="white" strokeWidth="1.5" />
          <path d="M14 7 L18 7" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Name tag */}
      <div style={{ ...styles.nameTag, borderColor: color }}>
        <span style={{ ...styles.initials, color }}>{rider.initials || '??'}</span>
      </div>

      {/* Power indicator */}
      <div style={styles.powerWrap}>
        <div
          style={{
            ...styles.powerBar,
            width: `${Math.min(100, (rider.currentWatts / 600) * 100)}%`,
            background: color
          }}
        />
        <span style={styles.powerText}>{Math.round(rider.currentWatts)}W</span>
      </div>

      {/* Progress arc */}
      <div style={styles.progress}>
        <span style={styles.progressText}>{pct.toFixed(0)}%</span>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'absolute',
    bottom: 140,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    width: 80,
    marginLeft: -40,
    willChange: 'transform'
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 900,
    color: '#000',
    position: 'absolute',
    top: -28,
    right: 4
  },
  bikeIcon: {
    width: 56,
    height: 42,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4
  },
  nameTag: {
    padding: '2px 10px',
    background: 'rgba(0,0,0,0.7)',
    border: '1px solid',
    borderRadius: 20,
    backdropFilter: 'blur(4px)'
  },
  initials: {
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: 3
  },
  powerWrap: {
    width: 72,
    height: 6,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative'
  },
  powerBar: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 300ms ease'
  },
  powerText: {
    position: 'absolute',
    right: -36,
    top: -5,
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    whiteSpace: 'nowrap'
  },
  progress: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)'
  },
  progressText: {}
}
