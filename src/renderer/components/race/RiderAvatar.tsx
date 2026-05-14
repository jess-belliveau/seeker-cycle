import React from 'react'
import type { RiderState } from '../../types'
import { C } from '../../theme'

const RIDER_COLORS = [
  C.pink, C.orange, C.yellow, C.green,
  C.cyan, C.purple, '#ff8c00', C.white,
]

interface Props {
  rider: RiderState
  xPx: number
  isLeader: boolean
  finishDistanceM: number
}

export function RiderAvatar({ rider, xPx, finishDistanceM }: Props): React.ReactElement {
  const color    = RIDER_COLORS[rider.avatarIndex % RIDER_COLORS.length]
  const finished = rider.finishTimeMs !== null
  const wPct     = Math.min(100, (rider.currentWatts / 600) * 100)

  return (
    <div
      style={{
        ...styles.wrapper,
        transform: `translateX(${xPx}px)`,
        transition: 'transform 80ms linear',
        opacity: finished ? 0.7 : 1,
      }}
    >
      {/* Rank badge */}
      {rider.rank !== null && (
        <div style={{ ...styles.rankBadge, background: color, color: C.black }}>
          {rider.rank}
        </div>
      )}

      {/* Pixel bike sprite */}
      <PixelBike color={color} />

      {/* Name tag */}
      <div style={{ ...styles.nameTag, background: color, color: C.black }}>
        {rider.initials || '??'}
      </div>

      {/* Power bar — pixel blocks */}
      <div style={styles.powerWrap}>
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            style={{
              ...styles.powerBlock,
              background: i < Math.round(wPct / 10) ? color : C.bgDark,
              border: `1px solid ${C.black}`,
            }}
          />
        ))}
      </div>
      <div style={{ ...styles.powerLabel, color }}>
        {Math.round(rider.currentWatts)}W
      </div>
    </div>
  )
}

// Simple pixel art bike as SVG with hard pixel edges
function PixelBike({ color }: { color: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 40 28" width={56} height={40} style={{ imageRendering: 'pixelated' }}>
      {/* Wheels */}
      <rect x="1"  y="16" width="14" height="2" fill={color} />
      <rect x="3"  y="14" width="10" height="2" fill={color} />
      <rect x="3"  y="20" width="10" height="2" fill={color} />
      <rect x="1"  y="18" width="2"  height="2" fill={color} />
      <rect x="13" y="18" width="2"  height="2" fill={color} />

      <rect x="25" y="16" width="14" height="2" fill={color} />
      <rect x="27" y="14" width="10" height="2" fill={color} />
      <rect x="27" y="20" width="10" height="2" fill={color} />
      <rect x="25" y="18" width="2"  height="2" fill={color} />
      <rect x="37" y="18" width="2"  height="2" fill={color} />

      {/* Frame */}
      <rect x="8"  y="12" width="2"  height="6" fill={color} />
      <rect x="18" y="6"  width="2"  height="12" fill={color} />
      <rect x="10" y="10" width="8"  height="2"  fill={color} />
      <rect x="18" y="16" width="14" height="2"  fill={color} />
      <rect x="20" y="12" width="10" height="2"  fill={color} />

      {/* Handlebar + seat */}
      <rect x="16" y="4"  width="6"  height="2" fill={color} />
      <rect x="28" y="8"  width="2"  height="4" fill={color} />
      <rect x="26" y="6"  width="6"  height="2" fill={color} />
    </svg>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'absolute',
    bottom: 148,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    width: 80, marginLeft: -40,
    willChange: 'transform',
  },
  rankBadge: {
    fontSize: 9, fontFamily: "'Press Start 2P', monospace",
    padding: '3px 5px',
    position: 'absolute', top: -22, right: 0,
    boxShadow: `2px 2px 0 #000`,
  },
  nameTag: {
    fontSize: 9, letterSpacing: 2,
    padding: '3px 8px',
    fontFamily: "'Press Start 2P', monospace",
    boxShadow: `2px 2px 0 #000`,
  },
  powerWrap: {
    display: 'flex', gap: 2,
  },
  powerBlock: { width: 6, height: 6 },
  powerLabel: {
    fontSize: 7, fontFamily: "'Press Start 2P', monospace",
    textShadow: '1px 1px 0 #000',
  },
}
