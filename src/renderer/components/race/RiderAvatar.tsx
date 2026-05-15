import React from 'react'
import type { RiderState } from '../../types'
import { C } from '../../theme'

const RIDER_COLORS = [
  C.pink, C.orange, C.yellow, C.green,
  C.cyan, C.purple, '#ff8c00', C.white,
]

interface Props {
  rider: RiderState
  x:     number   // screen X of centre
  y:     number   // screen Y of feet
  scale: number   // 0..1
}

export function RiderAvatar({ rider, x, y, scale }: Props): React.ReactElement {
  const color    = RIDER_COLORS[rider.avatarIndex % RIDER_COLORS.length]
  const finished = rider.finishTimeMs !== null

  const BASE_W  = 80
  const BASE_H  = 100
  const w       = BASE_W * scale
  const h       = BASE_H * scale
  const fnt     = Math.max(5, Math.round(scale * 9))
  const fntSm   = Math.max(4, Math.round(scale * 7))

  return (
    <div
      style={{
        position: 'absolute',
        left: 0, top: 0,
        transform: `translate(${x - w / 2}px, ${y - h}px)`,
        transition: 'transform 80ms linear',
        willChange: 'transform',
        width: w,
        opacity: finished ? 0.72 : 1,
        pointerEvents: 'none',
        zIndex: Math.round(scale * 100),
      }}
    >
      {/* Rank badge */}
      {rider.rank !== null && (
        <div style={{
          position: 'absolute', top: -fnt * 1.8, right: 0,
          background: color, color: C.black,
          fontSize: fnt * 0.85,
          fontFamily: "'Press Start 2P', monospace",
          padding: '2px 4px',
          boxShadow: '2px 2px 0 #000',
          lineHeight: 1.3, whiteSpace: 'nowrap',
        }}>
          {rider.rank}
        </div>
      )}

      {/* Back-view sprite */}
      <BackViewRider color={color} w={w} h={h} />

      {/* Name tag */}
      <div style={{
        position: 'absolute',
        bottom: -fnt * 2.2,
        left: '50%', transform: 'translateX(-50%)',
        background: color, color: C.black,
        fontSize: fnt,
        fontFamily: "'Press Start 2P', monospace",
        padding: `1px ${Math.round(fnt * 0.5)}px`,
        boxShadow: '2px 2px 0 #000',
        whiteSpace: 'nowrap', letterSpacing: 1,
      }}>
        {rider.initials || '??'}
      </div>

    </div>
  )
}

// ─── Back-view cyclist sprite ─────────────────────────────────────────────────

function BackViewRider({ color, w, h }: { color: string; w: number; h: number }): React.ReactElement {
  return (
    <svg
      viewBox="0 0 46 58"
      width={w}
      height={h}
      style={{ display: 'block', imageRendering: 'pixelated' }}
    >
      {/* Helmet */}
      <rect x="9"  y="1"  width="28" height="18" rx="9" fill={color} />
      <rect x="11" y="0"  width="24" height="12" rx="7" fill={color} />
      {/* Helmet shine */}
      <rect x="12" y="2"  width="13" height="5"  rx="3" fill="rgba(255,255,255,0.28)" />
      {/* Helmet vents */}
      <rect x="11" y="9"  width="5"  height="2"  rx="1" fill="rgba(0,0,0,0.22)" />
      <rect x="20" y="9"  width="6"  height="2"  rx="1" fill="rgba(0,0,0,0.22)" />
      <rect x="30" y="9"  width="5"  height="2"  rx="1" fill="rgba(0,0,0,0.22)" />
      {/* Helmet base rim */}
      <rect x="9"  y="16" width="28" height="4"  rx="1" fill="rgba(0,0,0,0.3)" />

      {/* Jersey — hunched over, wide at shoulders */}
      <rect x="5"  y="19" width="36" height="24" rx="3" fill={color} />
      {/* Jersey stripe */}
      <rect x="5"  y="25" width="36" height="5"  fill="rgba(255,255,255,0.18)" />
      {/* Centre seam */}
      <rect x="21" y="19" width="4"  height="24" fill="rgba(0,0,0,0.1)" />

      {/* Arms reaching forward */}
      <rect x="0"  y="19" width="5"  height="15" rx="2" fill={color} />
      <rect x="41" y="19" width="5"  height="15" rx="2" fill={color} />
      {/* Gloves */}
      <rect x="0"  y="31" width="5"  height="5"  rx="1" fill="#111" />
      <rect x="41" y="31" width="5"  height="5"  rx="1" fill="#111" />

      {/* Saddle */}
      <rect x="15" y="43" width="16" height="4" rx="2" fill="#222" />
      <rect x="16" y="43" width="14" height="2" rx="1" fill="#333" />

      {/* Legs / shorts — slightly offset to suggest pedalling */}
      <rect x="11" y="45" width="8"  height="11" rx="2" fill="#111" />
      <rect x="27" y="48" width="8"  height="9"  rx="2" fill="#111" />

      {/* Rear wheel arc — just the top visible below rider */}
      <ellipse cx="23" cy="57" rx="17" ry="5" fill="none" stroke="#2a2a2a" strokeWidth="5" />
      <ellipse cx="23" cy="57" rx="16" ry="4.5" fill="none" stroke={color} strokeWidth="2" opacity="0.6" />
      {/* Hub */}
      <circle cx="23" cy="57" r="2.5" fill={color} opacity="0.8" />
    </svg>
  )
}
