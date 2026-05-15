import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeviceStore } from '../store/deviceStore'
import { useRaceStore } from '../store/raceStore'
import { useGameLoop } from '../hooks/useGameLoop'
import { PLAYER_COLORS, PowerBar } from './WattsBattleScreen'
import { C, pixelBtn } from '../theme'
import type { SessionResult } from '../types'

// ── Constants ──────────────────────────────────────────────────────────────────

const DISTANCE_OPTIONS = [250, 500, 1000, 2000]
const COUNTDOWN_START  = 5
const CX = 300
const CY = 300
const R  = 215
const STROKE_W    = 20
const CIRCUMFERENCE = 2 * Math.PI * R

type ScreenStatus = 'setup' | 'countdown' | 'racing' | 'finished'

function fmtTime(ms: number): string {
  const m  = Math.floor(ms / 60000)
  const s  = Math.floor((ms % 60000) / 1000)
  const cs = Math.floor((ms % 1000) / 10)
  return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}

// ── Rider stat card ────────────────────────────────────────────────────────────

const MEDAL_COLORS = ['#ffd700', '#b8c4cc', '#cd7f32']

function RiderCard({ initials, color, watts, speedKmh, rank, finishTimeMs, flip }: {
  initials:    string
  color:       string
  watts:       number
  speedKmh:    number
  rank:        number | null
  finishTimeMs: number | null
  flip:        boolean
}): React.ReactElement {
  const rankColor = rank !== null && rank <= 3 ? MEDAL_COLORS[rank - 1] : C.dim
  return (
    <div style={{ ...S.card, borderColor: color, flexDirection: flip ? 'column' : 'column' }}>
      <div style={S.cardHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ ...S.colorSquare, background: color, boxShadow: `0 0 8px ${color}` }} />
          <span style={{ ...S.cardInitials, color }}>{initials}</span>
        </div>
        {rank !== null && (
          <span style={{ ...S.rankBadge, color: rankColor, borderColor: rankColor }}>
            #{rank}
          </span>
        )}
      </div>

      <div style={S.cardStats}>
        <span style={{ ...S.cardWatts, color }}>{Math.round(watts)}</span>
        <span style={S.cardWattsUnit}>W</span>
        <span style={S.cardSpeed}>{speedKmh.toFixed(1)}</span>
        <span style={S.cardSpeedUnit}>km/h</span>
      </div>

      <PowerBar watts={watts} color={color} />

      {finishTimeMs !== null && (
        <div style={{ ...S.finishBadge, color: rankColor, borderColor: rankColor }}>
          FINISHED {fmtTime(finishTimeMs)}
        </div>
      )}
    </div>
  )
}

// ── Main screen ────────────────────────────────────────────────────────────────

export function TronScreen(): React.ReactElement {
  const navigate      = useNavigate()
  const { connected } = useDeviceStore()
  const { race, initRace, startCountdown, startRacing, tickPhysics, resetRace } = useRaceStore()

  const [screenStatus, setScreenStatus] = useState<ScreenStatus>('setup')
  const [distance, setDistance]         = useState(500)
  const [countdown, setCountdown]       = useState(COUNTDOWN_START)
  const [showGo, setShowGo]             = useState(false)
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const savedRef  = useRef(false)

  // ── Init: redirect if no connected riders ──────────────────────────────────
  useEffect(() => {
    const riders = Object.values(connected).filter(
      (d) => d.status === 'connected' && d.initials.length > 0
    )
    if (riders.length === 0) {
      navigate('/character-select', { state: { destination: '/tron' } })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    resetRace()
  }, [resetRace])

  // ── Game loop (only while racing via raceStore) ────────────────────────────
  useGameLoop(screenStatus === 'racing', useCallback((deltaMs: number) => {
    tickPhysics(deltaMs)
  }, [tickPhysics]))

  // ── Detect race finish ─────────────────────────────────────────────────────
  useEffect(() => {
    if (race.status === 'finished' && screenStatus === 'racing') {
      setScreenStatus('finished')
    }
  }, [race.status, screenStatus])

  // ── Save session + auto-navigate after finish ──────────────────────────────
  useEffect(() => {
    if (screenStatus !== 'finished' || savedRef.current) return
    savedRef.current = true

    const riders = Object.values(race.riders)
    const result: SessionResult = {
      id:   crypto.randomUUID(),
      date: new Date().toISOString(),
      config: race.config,
      riders: [...race.finishOrder, ...riders
        .filter((r) => !race.finishOrder.includes(r.deviceId))
        .map((r) => r.deviceId)
      ].map((deviceId, i) => {
        const r = race.riders[deviceId]
        return {
          initials:    r.initials,
          avatarIndex: r.avatarIndex,
          rank:        i + 1,
          finishTimeMs: r.finishTimeMs,
          distanceMeters: race.config.distanceMeters,
          avgWatts:    r.readingCount > 0 ? r.totalWatts / r.readingCount : 0,
          maxWatts:    r.maxWatts,
          avgRpm:      r.readingCount > 0 ? r.totalRpm   / r.readingCount : 0,
        }
      }),
    }

    window.api.data.saveSession(result).catch(() => {})

    const t = setTimeout(() => {
      navigate('/results', { state: { result } })
    }, 6000)
    return () => clearTimeout(t)
  }, [screenStatus, race, navigate])

  // ── Countdown logic ────────────────────────────────────────────────────────
  useEffect(() => {
    if (screenStatus !== 'countdown') return

    setCountdown(COUNTDOWN_START)
    setShowGo(false)

    timerRef.current = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(timerRef.current!)
          setShowGo(true)
          setTimeout(() => {
            setShowGo(false)
            setScreenStatus('racing')
            startRacing()
          }, 700)
          return 0
        }
        return n - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [screenStatus, startRacing])

  // ── Start handler ──────────────────────────────────────────────────────────
  function handleStart(): void {
    const riders = Object.values(connected).filter(
      (d) => d.status === 'connected' && d.initials.length > 0
    )
    initRace(riders, {
      distanceMeters:  distance,
      countdownSeconds: COUNTDOWN_START,
      physicsMode:     'flat-watts',
      modeId:          'tron',
    })
    startCountdown()
    setScreenStatus('countdown')
  }

  // ── Derived display data ───────────────────────────────────────────────────
  const riderList = Object.values(race.riders)
  const sorted    = [...riderList].sort((a, b) => b.positionMeters - a.positionMeters)

  // Left panel: indices 0, 2, 4, 6 (by display order = sorted rank)
  // Right panel: indices 1, 3, 5, 7
  const leftRiders  = sorted.filter((_, i) => i % 2 === 0)
  const rightRiders = sorted.filter((_, i) => i % 2 === 1)

  const leader = sorted[0]
  const leaderPct = leader
    ? Math.min(100, Math.round((leader.positionMeters / (race.config.distanceMeters || distance)) * 100))
    : 0

  // Elapsed timer
  const displayElapsed = screenStatus === 'racing' || screenStatus === 'finished'
    ? fmtTime(race.elapsedMs)
    : '0:00.00'

  // Arc rendering — sorted descending by progress so leader is bottom layer
  // Result: each rider's "leading section" appears in their colour on top
  const arcRiders = [...sorted].reverse()  // smallest progress first = rendered on top

  const currentDistance = race.config.distanceMeters || distance

  function getColor(r: { initials: string }): string {
    const idx = riderList.findIndex((x) => x.initials === r.initials)
    return PLAYER_COLORS[idx % PLAYER_COLORS.length]
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={S.container}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div style={S.topBar}>
        <button style={{ ...pixelBtn(C.purple), ...S.backBtn }} onClick={() => navigate('/menu')}>
          ◀ MENU
        </button>
        <span style={S.modeName}>⬡ TRON</span>
        <span style={S.elapsed}>{displayElapsed}</span>
        <span style={S.distLabel}>{currentDistance} M LAP</span>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div style={S.body}>

        {/* Left panel */}
        <div style={S.sidePanel}>
          {leftRiders.map((r) => {
            const color = getColor(r)
            const rank  = sorted.indexOf(r) + 1
            return (
              <RiderCard
                key={r.deviceId}
                initials={r.initials}
                color={color}
                watts={r.currentWatts}
                speedKmh={r.velocityMs * 3.6}
                rank={r.rank ?? (screenStatus === 'racing' ? rank : null)}
                finishTimeMs={r.finishTimeMs}
                flip={false}
              />
            )
          })}
        </div>

        {/* Circle */}
        <div style={S.circleWrap}>
          <svg viewBox="0 0 600 600" style={S.svg}>
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Track guide */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke={C.muted} strokeWidth={STROKE_W + 4} opacity={0.2} />
            <circle cx={CX} cy={CY} r={R} fill="none" stroke={C.bgLight} strokeWidth={STROKE_W - 6} opacity={0.4} />

            {/* 12 o'clock start marker */}
            <line x1={CX} y1={CY - R - 16} x2={CX} y2={CY - R + 6} stroke={C.white} strokeWidth={3} opacity={0.7} />

            {/* Per-rider arcs (largest progress = bottom layer, rendered first) */}
            {arcRiders.map((r) => {
              const color    = getColor(r)
              const progress = Math.min(1, r.positionMeters / currentDistance)
              const offset   = CIRCUMFERENCE * (1 - progress)
              const angle    = progress * 2 * Math.PI - Math.PI / 2
              const hx       = CX + R * Math.cos(angle)
              const hy       = CY + R * Math.sin(angle)

              return (
                <g key={r.deviceId}>
                  {/* Arc */}
                  <circle
                    cx={CX} cy={CY} r={R}
                    fill="none"
                    stroke={color}
                    strokeWidth={STROKE_W}
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={offset}
                    strokeLinecap="butt"
                    transform={`rotate(-90 ${CX} ${CY})`}
                    style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                  />
                  {/* Head dot */}
                  {progress > 0 && (
                    <circle
                      cx={hx} cy={hy} r={12}
                      fill={color}
                      filter="url(#glow)"
                      style={{ filter: `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 4px #fff)` }}
                    />
                  )}
                </g>
              )
            })}

            {/* Center text */}
            <text x={CX} y={CY - 14} textAnchor="middle" style={S.centerInitials}>
              {leader ? leader.initials : '???'}
            </text>
            <text x={CX} y={CY + 14} textAnchor="middle" style={S.centerPct}>
              {leaderPct}%
            </text>
            <text x={CX} y={CY + 36} textAnchor="middle" style={S.centerSub}>
              COMPLETE
            </text>
          </svg>
        </div>

        {/* Right panel */}
        <div style={S.sidePanel}>
          {rightRiders.map((r) => {
            const color = getColor(r)
            const rank  = sorted.indexOf(r) + 1
            return (
              <RiderCard
                key={r.deviceId}
                initials={r.initials}
                color={color}
                watts={r.currentWatts}
                speedKmh={r.velocityMs * 3.6}
                rank={r.rank ?? (screenStatus === 'racing' ? rank : null)}
                finishTimeMs={r.finishTimeMs}
                flip
              />
            )
          })}
        </div>
      </div>

      {/* ── Setup overlay ───────────────────────────────────────────────── */}
      {screenStatus === 'setup' && (
        <div style={S.setupBar}>
          <span style={S.setupLabel}>CHOOSE DISTANCE</span>
          <div style={S.distBtns}>
            {DISTANCE_OPTIONS.map((d) => (
              <button
                key={d}
                style={{
                  ...pixelBtn(distance === d ? C.cyan : C.muted),
                  ...S.distBtn,
                  ...(distance === d ? S.distBtnActive : {}),
                }}
                onClick={() => setDistance(d)}
              >
                {d}M
              </button>
            ))}
          </div>
          <button style={{ ...pixelBtn(C.green), ...S.startBtn }} onClick={handleStart}>
            START ▶
          </button>
        </div>
      )}

      {/* ── Countdown overlay ───────────────────────────────────────────── */}
      {(screenStatus === 'countdown') && (
        <div style={S.overlay}>
          <span
            key={showGo ? 'go' : countdown}
            style={{
              ...S.countNum,
              color: showGo ? C.green : C.cyan,
              textShadow: showGo
                ? `0 0 40px ${C.green}, 0 0 80px ${C.green}`
                : `0 0 40px ${C.cyan}, 0 0 80px ${C.cyan}`,
              animation: 'tronPulse 0.8s ease-out',
            }}
          >
            {showGo ? 'GO!' : countdown}
          </span>
          <span style={S.countSub}>GET READY</span>
        </div>
      )}

      {/* ── Finish overlay ───────────────────────────────────────────────── */}
      {screenStatus === 'finished' && (
        <div style={S.overlay}>
          {race.finishOrder.length > 0 && (() => {
            const winner = race.riders[race.finishOrder[0]]
            const winColor = winner ? getColor(winner) : C.green
            return (
              <>
                <span style={{ ...S.winnerName, color: winColor, textShadow: `0 0 40px ${winColor}, 0 0 80px ${winColor}` }}>
                  {winner?.initials ?? '???'}
                </span>
                <span style={{ ...S.winsLabel, color: winColor }}>WINS!</span>
              </>
            )
          })()}
          <div style={S.finishList}>
            {race.finishOrder.map((id, i) => {
              const r     = race.riders[id]
              const color = getColor(r)
              return (
                <div key={id} style={S.finishRow}>
                  <span style={{ ...S.finishRank, color: MEDAL_COLORS[i] ?? C.dim }}>
                    #{i + 1}
                  </span>
                  <span style={{ ...S.finishInitials, color }}>{r.initials}</span>
                  <span style={S.finishTime}>
                    {r.finishTimeMs !== null ? fmtTime(r.finishTimeMs) : '—'}
                  </span>
                </div>
              )
            })}
          </div>
          <span style={S.finishHint}>RESULTS IN 6s…</span>
        </div>
      )}

      <style>{CSS}</style>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const CSS = `
@keyframes tronPulse {
  0%   { transform: scale(1.4); opacity: 0.6; }
  100% { transform: scale(1);   opacity: 1;   }
}
@keyframes tronBlink {
  0%,49% { opacity: 1; } 50%,100% { opacity: 0; }
}
`

const S: Record<string, React.CSSProperties> = {
  container: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    background: C.bgDark,
    backgroundImage: `
      linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
    fontFamily: "'Press Start 2P', monospace",
    overflow: 'hidden',
  },

  // ── Top bar ──
  topBar: {
    display: 'flex', alignItems: 'center',
    height: 50, flexShrink: 0,
    padding: '0 20px', gap: 20,
    background: '#000',
    borderBottom: `4px solid ${C.cyan}`,
  },
  backBtn:  { padding: '5px 12px', fontSize: 7 },
  modeName: { fontSize: 14, color: C.cyan, letterSpacing: 4, textShadow: `0 0 16px ${C.cyan}` },
  elapsed:  { flex: 1, textAlign: 'center', fontSize: 18, color: C.white, letterSpacing: 4, fontVariantNumeric: 'tabular-nums' },
  distLabel:{ fontSize: 9, color: C.dim, letterSpacing: 2 },

  // ── Body ──
  body: {
    flex: 1, display: 'flex', flexDirection: 'row',
    gap: 0, overflow: 'hidden', minHeight: 0,
  },

  // ── Side panels ──
  sidePanel: {
    width: 220, flexShrink: 0,
    display: 'flex', flexDirection: 'column',
    gap: 8, padding: 12,
    overflowY: 'auto',
    background: 'rgba(0,0,0,0.4)',
  },

  // ── Rider card ──
  card: {
    display: 'flex', flexDirection: 'column', gap: 6,
    padding: '10px 12px',
    background: 'rgba(0,0,0,0.6)',
    border: '3px solid',
    boxShadow: '3px 3px 0 #000',
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  colorSquare: { width: 14, height: 14, flexShrink: 0 },
  cardInitials: { fontSize: 16, letterSpacing: 3, textShadow: '2px 2px 0 #000' },
  rankBadge: {
    fontSize: 9, letterSpacing: 1,
    border: '2px solid', padding: '2px 6px',
  },
  cardStats: {
    display: 'flex', alignItems: 'baseline', gap: 4,
  },
  cardWatts:     { fontSize: 32, fontVariantNumeric: 'tabular-nums', textShadow: '2px 2px 0 #000' },
  cardWattsUnit: { fontSize: 9, color: C.dim },
  cardSpeed:     { fontSize: 16, color: C.white, marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' },
  cardSpeedUnit: { fontSize: 7, color: C.dim },
  finishBadge: {
    fontSize: 7, letterSpacing: 1, textAlign: 'center',
    border: '2px solid', padding: '3px 6px',
    marginTop: 2,
  },

  // ── SVG circle ──
  circleWrap: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 8,
  },
  svg: {
    width: '100%', height: '100%',
    maxWidth: 580, maxHeight: 580,
  },
  centerInitials: {
    fontSize: '42px',
    fontFamily: "'Press Start 2P', monospace",
    fill: C.white,
    textShadow: `0 0 20px ${C.cyan}`,
  } as React.CSSProperties,
  centerPct: {
    fontSize: '28px',
    fontFamily: "'Press Start 2P', monospace",
    fill: C.cyan,
  } as React.CSSProperties,
  centerSub: {
    fontSize: '10px',
    fontFamily: "'Press Start 2P', monospace",
    fill: C.dim,
    letterSpacing: '3px',
  } as React.CSSProperties,

  // ── Setup bar ──
  setupBar: {
    display: 'flex', alignItems: 'center',
    height: 72, flexShrink: 0,
    padding: '0 24px', gap: 20,
    background: '#000',
    borderTop: `4px solid ${C.cyan}`,
  },
  setupLabel: { fontSize: 9, color: C.cyan, letterSpacing: 2, flexShrink: 0 },
  distBtns:   { display: 'flex', gap: 10, flex: 1, justifyContent: 'center' },
  distBtn:    { padding: '8px 18px', fontSize: 9, letterSpacing: 1 },
  distBtnActive: { boxShadow: `0 0 12px ${C.cyan}, 4px 4px 0 #000` },
  startBtn:   { padding: '10px 28px', fontSize: 11, letterSpacing: 2, flexShrink: 0 },

  // ── Countdown & finish overlays ──
  overlay: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.78)',
    gap: 8,
    zIndex: 10,
  },
  countNum: {
    fontSize: '22vw',
    fontFamily: "'Press Start 2P', monospace",
    lineHeight: 1,
    textShadow: `0 0 40px ${C.cyan}`,
  },
  countSub: {
    fontSize: 12, color: C.dim, letterSpacing: 6, marginTop: 12,
  },

  // ── Finish overlay ──
  winnerName: {
    fontSize: '18vw',
    fontFamily: "'Press Start 2P', monospace",
    lineHeight: 1,
    animation: 'tronPulse 0.6s ease-out',
  },
  winsLabel: {
    fontSize: '8vw',
    fontFamily: "'Press Start 2P', monospace",
    letterSpacing: 8,
    marginBottom: 24,
  },
  finishList: {
    display: 'flex', flexDirection: 'column', gap: 10,
    background: 'rgba(0,0,0,0.6)',
    border: `3px solid ${C.cyan}`,
    padding: '16px 28px',
    boxShadow: `6px 6px 0 #000`,
  },
  finishRow: {
    display: 'flex', alignItems: 'center', gap: 20,
  },
  finishRank:    { fontSize: 14, width: 36, flexShrink: 0 },
  finishInitials:{ fontSize: 20, letterSpacing: 4, width: 80 },
  finishTime:    { fontSize: 16, color: C.white, fontVariantNumeric: 'tabular-nums' },
  finishHint:    { fontSize: 7, color: C.muted, letterSpacing: 2, marginTop: 16, animation: 'tronBlink 1s step-end infinite' },
}
