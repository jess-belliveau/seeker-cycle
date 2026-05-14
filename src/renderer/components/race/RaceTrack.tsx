import React from 'react'
import type { RaceState } from '../../types'
import { C } from '../../theme'
import { RiderAvatar } from './RiderAvatar'

// ─── Perspective constants ────────────────────────────────────────────────────

const VY_PCT         = 0.38   // vanishing point height (fraction of screen)
const LEADER_DEPTH   = 0.20   // leader sits this far from horizon (0=horizon, 1=camera)
const MAX_GAP_M      = 80     // gap in metres that maps follower to camera level
const ROAD_H_HALF    = 30     // road half-width at horizon, px
const ROAD_B_HALF_F  = 0.43   // road half-width at bottom, fraction of windowWidth

// Road-marking scrolling
const VIEW_AHEAD_M   = 90     // metres visible ahead of leader
const VIEW_BEHIND_M  = 35     // metres visible behind leader
const STRIPE_GAP_M   = 11     // metres between centre-line dashes

interface Props {
  race:         RaceState
  windowWidth:  number
  windowHeight: number
}

export function RaceTrack({ race, windowWidth, windowHeight }: Props): React.ReactElement {
  const riders     = Object.values(race.riders)
  const sorted     = [...riders].sort((a, b) => b.positionMeters - a.positionMeters)
  const leaderPos  = sorted[0]?.positionMeters ?? 0

  const VX          = windowWidth  * 0.5
  const VY          = windowHeight * VY_PCT
  const ROAD_B_HALF = windowWidth  * ROAD_B_HALF_F

  // ── Helpers ────────────────────────────────────────────────────────────────

  function depthToY(d: number): number {
    return VY + d * (windowHeight - VY)
  }

  function roadHalf(d: number): number {
    return ROAD_H_HALF + d * (ROAD_B_HALF - ROAD_H_HALF)
  }

  function riderDepth(positionMeters: number): number {
    const gap = Math.max(0, leaderPos - positionMeters)
    return LEADER_DEPTH + Math.min(1, gap / MAX_GAP_M) * (1 - LEADER_DEPTH)
  }

  // ── Centre-line dashes ─────────────────────────────────────────────────────
  // One dash every STRIPE_GAP_M world-metres; scroll via leaderPos.

  const stripes: number[] = []  // depth values
  const minI = Math.floor((leaderPos - VIEW_BEHIND_M) / STRIPE_GAP_M)
  const maxI = Math.ceil ((leaderPos + VIEW_AHEAD_M)  / STRIPE_GAP_M)

  for (let i = minI; i <= maxI; i++) {
    const rel = i * STRIPE_GAP_M - leaderPos   // +ve = ahead, -ve = behind
    let depth: number
    if (rel >= 0 && rel <= VIEW_AHEAD_M) {
      depth = LEADER_DEPTH * (1 - rel / VIEW_AHEAD_M)
    } else if (rel < 0 && rel >= -VIEW_BEHIND_M) {
      depth = LEADER_DEPTH + (-rel / VIEW_BEHIND_M) * (1 - LEADER_DEPTH) * 0.65
    } else {
      continue
    }
    stripes.push(depth)
  }

  // ── Finish line ────────────────────────────────────────────────────────────

  const distToFinish  = race.config.distanceMeters - leaderPos
  const showFinish    = distToFinish >= 0 && distToFinish <= VIEW_AHEAD_M
  const finishDepth   = showFinish ? LEADER_DEPTH * (1 - distToFinish / VIEW_AHEAD_M) : 0

  // ── Road geometry ──────────────────────────────────────────────────────────

  const rl_h = VX - ROAD_H_HALF,  rr_h = VX + ROAD_H_HALF
  const rl_b = VX - ROAD_B_HALF,  rr_b = VX + ROAD_B_HALF
  const SHOULDER = 100
  const sl_b = rl_b - SHOULDER,   sr_b = rr_b + SHOULDER

  // ── Rider z-order: furthest from camera first (leader last → on top) ───────

  const ridersBackFirst = [...sorted].reverse()

  return (
    <div style={S.container}>
      {/* ── Background SVG ──────────────────────────────────────────────────── */}
      <svg width={windowWidth} height={windowHeight} style={S.svg}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#060118" />
            <stop offset="32%"  stopColor="#1a0a2e" />
            <stop offset="60%"  stopColor="#6e1a42" />
            <stop offset="78%"  stopColor="#c94718" />
            <stop offset="90%"  stopColor="#ef7a1e" />
            <stop offset="100%" stopColor="#ffcc38" />
          </linearGradient>

          <radialGradient id="sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#fffbd0" stopOpacity="1" />
            <stop offset="28%"  stopColor="#ffee44" stopOpacity="1" />
            <stop offset="55%"  stopColor="#ff9922" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ff3300" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#221a10" />
            <stop offset="100%" stopColor="#342a1c" />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect x={0} y={0} width={windowWidth} height={windowHeight} fill="url(#sky)" />

        {/* Sun halo + disc */}
        <circle cx={VX} cy={VY} r={130} fill="url(#sun)" />
        <circle cx={VX} cy={VY} r={48}  fill="#fff8c0" />
        <circle cx={VX} cy={VY} r={38}  fill="#ffee44" />

        {/* Pixel mountains — far layer */}
        <polygon fill="#1c0730" opacity="0.9" points={[
          [0,              VY * 1.55],
          [windowWidth * 0.08,  VY * 0.60],
          [windowWidth * 0.22,  VY * 1.10],
          [windowWidth * 0.36,  VY * 0.52],
          [windowWidth * 0.50,  VY * 1.00],
          [windowWidth * 0.64,  VY * 0.68],
          [windowWidth * 0.78,  VY * 1.20],
          [windowWidth * 0.90,  VY * 0.58],
          [windowWidth,         VY * 1.05],
          [windowWidth,         VY * 1.7],
          [0,              VY * 1.7],
        ].map(p => p.join(',')).join(' ')} />

        {/* Pixel mountains — near layer */}
        <polygon fill="#2a1048" opacity="0.75" points={[
          [0,                   VY * 1.40],
          [windowWidth * 0.15,  VY * 0.80],
          [windowWidth * 0.30,  VY * 1.18],
          [windowWidth * 0.48,  VY * 0.76],
          [windowWidth * 0.60,  VY * 1.12],
          [windowWidth * 0.75,  VY * 0.85],
          [windowWidth * 0.88,  VY * 1.22],
          [windowWidth,         VY * 1.00],
          [windowWidth,         VY * 1.7],
          [0,              VY * 1.7],
        ].map(p => p.join(',')).join(' ')} />

        {/* Left grass shoulder */}
        <polygon
          fill="#1f5800"
          points={`${rl_h},${VY} ${sl_b},${windowHeight} ${rl_b},${windowHeight}`}
        />
        {/* Right grass shoulder */}
        <polygon
          fill="#1f5800"
          points={`${rr_h},${VY} ${rr_b},${windowHeight} ${sr_b},${windowHeight}`}
        />
        {/* Grass highlight edges */}
        <line x1={rl_h} y1={VY} x2={sl_b} y2={windowHeight} stroke="#2e7a00" strokeWidth="3" />
        <line x1={rr_h} y1={VY} x2={sr_b} y2={windowHeight} stroke="#2e7a00" strokeWidth="3" />

        {/* Road surface */}
        <polygon
          fill="url(#road)"
          points={`${rl_h},${VY} ${rr_h},${VY} ${rr_b},${windowHeight} ${rl_b},${windowHeight}`}
        />

        {/* Road kerb / edge lines */}
        <line x1={rl_h} y1={VY} x2={rl_b} y2={windowHeight} stroke="#eee" strokeWidth="4" opacity="0.65" />
        <line x1={rr_h} y1={VY} x2={rr_b} y2={windowHeight} stroke="#eee" strokeWidth="4" opacity="0.65" />

        {/* Scrolling centre dashes */}
        {stripes.map((d, i) => {
          const y   = depthToY(d)
          const hw  = roadHalf(d) * 0.028
          const ht  = Math.max(2, d * 14)
          return (
            <rect
              key={i}
              x={VX - hw} y={y - ht / 2}
              width={hw * 2} height={ht}
              fill={C.yellow}
              opacity={0.5 + d * 0.5}
            />
          )
        })}

        {/* Finish line */}
        {showFinish && finishDepth > 0.01 && (() => {
          const y  = depthToY(finishDepth)
          const hw = roadHalf(finishDepth)
          const ht = Math.max(4, finishDepth * 20)
          const n  = 10
          const sw = (hw * 2) / n
          return (
            <>
              {Array.from({ length: n }, (_, j) => (
                <rect key={j}
                  x={VX - hw + j * sw} y={y - ht / 2}
                  width={sw} height={ht}
                  fill={j % 2 === 0 ? '#fff' : '#000'}
                />
              ))}
              <text
                x={VX} y={y - ht / 2 - 6}
                textAnchor="middle"
                fill={C.pink}
                fontSize={Math.max(8, finishDepth * 26)}
                fontFamily="'Press Start 2P', monospace"
                style={{ imageRendering: 'pixelated' } as React.CSSProperties}
              >
                FINISH!
              </text>
            </>
          )
        })()}
      </svg>

      {/* ── Rider sprites — sorted back-to-front for correct z-order ────────── */}
      {ridersBackFirst.map((rider) => {
        const depth      = riderDepth(rider.positionMeters)
        const y          = depthToY(depth)
        const scale      = 0.18 + depth * 0.82

        const riderSortedIdx   = sorted.indexOf(rider)
        const totalRiders      = sorted.length
        const laneIdxCentered  = riderSortedIdx - (totalRiders - 1) / 2
        const rw               = roadHalf(depth)
        const x                = VX + laneIdxCentered * rw * (totalRiders > 1 ? 0.45 : 0)

        return (
          <RiderAvatar
            key={rider.deviceId}
            rider={rider}
            x={x}
            y={y}
            scale={scale}
          />
        )
      })}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  container: { position: 'absolute', inset: 0, overflow: 'hidden' },
  svg:       { position: 'absolute', inset: 0, display: 'block' },
}
