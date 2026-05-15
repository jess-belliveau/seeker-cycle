import React from 'react'
import type { RaceState } from '../../types'
import { C } from '../../theme'
import { RiderAvatar } from './RiderAvatar'

const RIDER_COLORS = [
  C.pink, C.orange, C.yellow, C.green,
  C.cyan, C.purple, '#ff8c00', C.white,
]

// ─── Perspective constants ────────────────────────────────────────────────────

const VY_PCT         = 0.38
const LEADER_DEPTH   = 0.20
const MAX_GAP_M      = 80
const ROAD_H_HALF    = 30
const ROAD_B_HALF_F  = 0.43

const VIEW_AHEAD_M   = 90
const VIEW_BEHIND_M  = 35
const STRIPE_GAP_M   = 11

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

  const stripes: number[] = []
  const minI = Math.floor((leaderPos - VIEW_BEHIND_M) / STRIPE_GAP_M)
  const maxI = Math.ceil ((leaderPos + VIEW_AHEAD_M)  / STRIPE_GAP_M)

  for (let i = minI; i <= maxI; i++) {
    const rel = i * STRIPE_GAP_M - leaderPos
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

  const distToFinish = race.config.distanceMeters - leaderPos
  const showFinish   = distToFinish >= 0 && distToFinish <= VIEW_AHEAD_M
  const finishDepth  = showFinish ? LEADER_DEPTH * (1 - distToFinish / VIEW_AHEAD_M) : 0

  // ── Road geometry ──────────────────────────────────────────────────────────

  const rl_h = VX - ROAD_H_HALF,  rr_h = VX + ROAD_H_HALF
  const rl_b = VX - ROAD_B_HALF,  rr_b = VX + ROAD_B_HALF
  const SHOULDER = 100
  const sl_b = rl_b - SHOULDER,   sr_b = rr_b + SHOULDER

  // ── Rider z-order ─────────────────────────────────────────────────────────

  const ridersBackFirst = [...sorted].reverse()

  // ── Finish banner helpers ──────────────────────────────────────────────────

  const finishY  = depthToY(finishDepth)
  const finishHw = roadHalf(finishDepth)
  // Poles reach from the finish line y up to the very top of the screen (plus some off-screen)
  const poleTopY  = Math.max(-40, finishY - finishHw * 3.2)
  const poleW     = Math.max(4, finishDepth * 18)
  const checkerHt = Math.max(6, finishDepth * 80)
  const FINISH_SQUARES = 14

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

          {/* Finish line pole glow filter */}
          <filter id="poleGlow" x="-100%" y="-20%" width="300%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="finishTextGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="horizGlow" x="-20%" y="-400%" width="140%" height="900%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id="groundGlow" x="-60%" y="-200%" width="220%" height="600%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* Sky */}
        <rect x={0} y={0} width={windowWidth} height={windowHeight} fill="url(#sky)" />

        {/* Stars */}
        {Array.from({ length: 32 }, (_, i) => {
          const sx = ((i * 137 + 23) % 97) / 97 * windowWidth
          const sy = ((i * 71  + 11) % 89) / 89 * VY * 0.88
          const r  = 0.7 + (i % 3) * 0.65
          return <circle key={`star-${i}`} cx={sx} cy={sy} r={r} fill="#fff" opacity={0.35 + (i % 5) * 0.13} />
        })}

        {/* Sun */}
        <circle cx={VX} cy={VY} r={130} fill="url(#sun)" />
        <circle cx={VX} cy={VY} r={48}  fill="#fff8c0" />
        <circle cx={VX} cy={VY} r={38}  fill="#ffee44" />

        {/* Mountains — far */}
        <polygon fill="#1c0730" opacity="0.9" points={[
          [0,                   VY * 1.55],
          [windowWidth * 0.08,  VY * 0.60],
          [windowWidth * 0.22,  VY * 1.10],
          [windowWidth * 0.36,  VY * 0.52],
          [windowWidth * 0.50,  VY * 1.00],
          [windowWidth * 0.64,  VY * 0.68],
          [windowWidth * 0.78,  VY * 1.20],
          [windowWidth * 0.90,  VY * 0.58],
          [windowWidth,         VY * 1.05],
          [windowWidth,         VY * 1.7],
          [0,                   VY * 1.7],
        ].map(p => p.join(',')).join(' ')} />

        {/* Mountains — near */}
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
          [0,                   VY * 1.7],
        ].map(p => p.join(',')).join(' ')} />

        {/* City skyline silhouette — behind mountains */}
        {Array.from({ length: 22 }, (_, i) => {
          const bw = 18 + (i * 47) % 38
          const bh = 30 + (i * 31) % 70
          const bx = (i / 22) * windowWidth * 1.1 - windowWidth * 0.05 + ((i * 53) % 40) - 20
          const by = VY - bh + 4
          const hasWindow = i % 3 !== 0
          return (
            <g key={`bld-${i}`}>
              <rect x={bx} y={by} width={bw} height={bh + 8} fill="#110822" opacity={0.85} />
              {hasWindow && Array.from({ length: Math.floor(bh / 14) }, (_, j) => (
                <rect key={j}
                  x={bx + 5} y={by + 6 + j * 14}
                  width={bw - 10} height={5}
                  fill={i % 4 === 0 ? C.cyan : i % 4 === 1 ? C.purple : C.orange}
                  opacity={0.25 + (j % 2) * 0.15}
                />
              ))}
            </g>
          )
        })}

        {/* Horizon neon glow */}
        <rect x={0} y={VY - 3} width={windowWidth} height={6}
          fill={C.orange} opacity={0.55} filter="url(#horizGlow)" />
        <rect x={0} y={VY - 1} width={windowWidth} height={2}
          fill="#fff" opacity={0.7} />

        {/* Grass */}
        <polygon fill="#1f5800" points={`${rl_h},${VY} ${sl_b},${windowHeight} ${rl_b},${windowHeight}`} />
        <polygon fill="#1f5800" points={`${rr_h},${VY} ${rr_b},${windowHeight} ${sr_b},${windowHeight}`} />
        <line x1={rl_h} y1={VY} x2={sl_b} y2={windowHeight} stroke="#2e7a00" strokeWidth="3" />
        <line x1={rr_h} y1={VY} x2={sr_b} y2={windowHeight} stroke="#2e7a00" strokeWidth="3" />

        {/* Crowd — world-space positioned + animated cheer */}
        {(() => {
          const CROWD_GAP_M = 5
          const minCI = Math.floor((leaderPos - VIEW_BEHIND_M) / CROWD_GAP_M)
          const maxCI = Math.ceil((leaderPos + VIEW_AHEAD_M)  / CROWD_GAP_M)
          const now   = Date.now()
          const CROWD_COLORS = [C.pink, C.cyan, C.yellow, C.orange, C.purple, C.green]
          const figs: React.ReactElement[] = []

          for (let i = minCI; i <= maxCI; i++) {
            const rel = i * CROWD_GAP_M - leaderPos
            let depth: number
            if      (rel >= 0 && rel <=  VIEW_AHEAD_M)  depth = LEADER_DEPTH * (1 - rel / VIEW_AHEAD_M)
            else if (rel <  0 && rel >= -VIEW_BEHIND_M)  depth = LEADER_DEPTH + (-rel / VIEW_BEHIND_M) * (1 - LEADER_DEPTH) * 0.65
            else continue

            const fy      = depthToY(depth)
            const rw2     = roadHalf(depth)
            const scl     = 0.12 + depth * 0.88
            const figH    = scl * 26
            const figW    = scl * 7
            const headR   = figW * 0.6
            const armLen  = figH * 0.42
            const col     = CROWD_COLORS[((i * 3 + 7) % CROWD_COLORS.length + CROWD_COLORS.length) % CROWD_COLORS.length]
            const phase   = i * 2.31
            const wave    = Math.sin(now / 360 + phase)
            const sideOff = (Math.abs(i) % 3) * scl * 10

            const sides: Array<[string, number]> = [
              ['l', VX - rw2 - SHOULDER * 0.28 - sideOff],
              ['r', VX + rw2 + SHOULDER * 0.28 + sideOff],
            ]
            for (const [side, fx] of sides) {
              const shoulderY = fy - figH * 0.42
              const ax = fx + wave * armLen * 0.4
              const ay = shoulderY - (0.25 + wave * 0.35) * armLen
              figs.push(
                <g key={`crowd-${i}-${side}`} opacity={0.55 + depth * 0.38}>
                  <rect x={fx - figW / 2} y={fy - figH} width={figW} height={figH * 0.62} fill={col} />
                  <circle cx={fx} cy={fy - figH - headR * 0.5} r={headR} fill={col} />
                  <line x1={fx} y1={shoulderY} x2={ax} y2={ay}
                    stroke={col} strokeWidth={figW * 0.5} strokeLinecap="round" />
                </g>
              )
            }
          }
          return figs
        })()}

        {/* Road */}
        <polygon
          fill="url(#road)"
          points={`${rl_h},${VY} ${rr_h},${VY} ${rr_b},${windowHeight} ${rl_b},${windowHeight}`}
        />
        <line x1={rl_h} y1={VY} x2={rl_b} y2={windowHeight} stroke="#eee" strokeWidth="4" opacity="0.65" />
        <line x1={rr_h} y1={VY} x2={rr_b} y2={windowHeight} stroke="#eee" strokeWidth="4" opacity="0.65" />

        {/* Neon road edge glow strips */}
        <line x1={rl_h} y1={VY} x2={rl_b} y2={windowHeight}
          stroke={C.cyan} strokeWidth="6" opacity="0.18" filter="url(#horizGlow)" />
        <line x1={rr_h} y1={VY} x2={rr_b} y2={windowHeight}
          stroke={C.cyan} strokeWidth="6" opacity="0.18" filter="url(#horizGlow)" />

        {/* Per-rider ground glow */}
        {sorted.map((rider) => {
          const depth  = riderDepth(rider.positionMeters)
          const ry     = depthToY(depth)
          const scale  = 0.18 + depth * 0.82
          const riderSortedIdx  = sorted.indexOf(rider)
          const totalRiders     = sorted.length
          const laneIdxCentered = riderSortedIdx - (totalRiders - 1) / 2
          const rw              = roadHalf(depth)
          const rx              = VX + laneIdxCentered * rw * (totalRiders > 1 ? 0.45 : 0)
          const color           = RIDER_COLORS[rider.avatarIndex % RIDER_COLORS.length]
          const glowSize        = 1 + Math.min(1, rider.currentWatts / 350)
          return (
            <ellipse key={`glow-${rider.deviceId}`}
              cx={rx} cy={ry}
              rx={38 * scale * glowSize}
              ry={10 * scale * glowSize}
              fill={color}
              opacity={0.18 + Math.min(0.28, rider.currentWatts / 1200)}
              filter="url(#groundGlow)"
            />
          )
        })}

        {/* Centre dashes */}
        {stripes.map((d, i) => {
          const y  = depthToY(d)
          const hw = roadHalf(d) * 0.028
          const ht = Math.max(2, d * 14)
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

        {/* ── Finish line + banner ───────────────────────────────────────── */}
        {showFinish && finishDepth > 0.01 && (() => {
          const sw = (finishHw * 2) / FINISH_SQUARES

          return (
            <>
              {/* Ground checkerboard strip */}
              {Array.from({ length: FINISH_SQUARES }, (_, j) => (
                <rect key={`ch-${j}`}
                  x={VX - finishHw + j * sw} y={finishY - checkerHt / 2}
                  width={sw} height={checkerHt}
                  fill={j % 2 === 0 ? '#fff' : '#111'}
                  opacity={0.9}
                />
              ))}

              {/* Left pole */}
              <rect
                x={VX - finishHw - poleW / 2} y={poleTopY}
                width={poleW} height={finishY - poleTopY + checkerHt / 2}
                fill="#f0f0f0"
                filter="url(#poleGlow)"
              />
              {/* Right pole */}
              <rect
                x={VX + finishHw - poleW / 2} y={poleTopY}
                width={poleW} height={finishY - poleTopY + checkerHt / 2}
                fill="#f0f0f0"
                filter="url(#poleGlow)"
              />

              {/* Overhead banner beam — checkered */}
              {(() => {
                const bannerH  = Math.max(10, finishDepth * 48)
                const bannerY  = poleTopY
                const bannerW  = finishHw * 2 + poleW
                const bSqW     = bannerW / 16
                return Array.from({ length: 16 }, (_, j) => (
                  <rect key={`bch-${j}`}
                    x={VX - finishHw - poleW / 2 + j * bSqW}
                    y={bannerY}
                    width={bSqW} height={bannerH}
                    fill={j % 2 === 0 ? '#fff' : '#111'}
                    opacity={0.9}
                  />
                ))
              })()}

              {/* Neon "FINISH!" text — grows as you approach */}
              <text
                x={VX}
                y={poleTopY - 10}
                textAnchor="middle"
                dominantBaseline="auto"
                fill={C.pink}
                fontSize={Math.max(14, finishDepth * 90)}
                fontFamily="'Press Start 2P', monospace"
                filter="url(#finishTextGlow)"
                style={{ letterSpacing: Math.max(2, finishDepth * 12) } as React.CSSProperties}
              >
                FINISH!
              </text>

              {/* Extra glow halo behind text */}
              <text
                x={VX}
                y={poleTopY - 10}
                textAnchor="middle"
                dominantBaseline="auto"
                fill={C.pink}
                fontSize={Math.max(14, finishDepth * 90)}
                fontFamily="'Press Start 2P', monospace"
                opacity={0.25 * finishDepth}
                style={{ letterSpacing: Math.max(2, finishDepth * 12), filter: 'blur(18px)' } as React.CSSProperties}
              >
                FINISH!
              </text>
            </>
          )
        })()}
      </svg>

      {/* ── Rider sprites ─────────────────────────────────────────────────────── */}
      {ridersBackFirst.map((rider) => {
        const depth = riderDepth(rider.positionMeters)
        const y     = depthToY(depth)
        const scale = 0.18 + depth * 0.82

        const riderSortedIdx  = sorted.indexOf(rider)
        const totalRiders     = sorted.length
        const laneIdxCentered = riderSortedIdx - (totalRiders - 1) / 2
        const rw              = roadHalf(depth)
        const x               = VX + laneIdxCentered * rw * (totalRiders > 1 ? 0.45 : 0)

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
