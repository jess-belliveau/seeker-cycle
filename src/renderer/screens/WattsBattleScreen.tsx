import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeviceStore } from '../store/deviceStore'
import { onDemoReading } from '../demoBus'
import type { SessionResult, TrainerReading } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_DURATION_S = 15
const MIN_DURATION_S = 10
const MAX_DURATION_S = 120
const DURATION_STEP_S = 5
const COUNTDOWN_S = 3
const MAX_DISPLAY_WATTS = 500

export const PLAYER_COLORS = [
  '#00e5ff', '#ff4fa3', '#ffee10', '#39ff14',
  '#ff8c00', '#c800ff', '#ff6600', '#ffffff',
]

// ─── Types ────────────────────────────────────────────────────────────────────

type BattleStatus = 'setup' | 'countdown' | 'racing' | 'finished'
export type Expression = 'idle' | 'working' | 'maxing'

interface PlayerState {
  deviceId: string
  initials: string
  avatarIndex: number
  color: string
  currentWatts: number
  totalWatts: number
  maxWatts: number
  readingCount: number
  lastTimestamp: number
}

function getAvgWatts(p: PlayerState): number {
  return p.readingCount > 0 ? p.totalWatts / p.readingCount : 0
}

export function getExpression(watts: number): Expression {
  if (watts >= 250) return 'maxing'
  if (watts >= 100) return 'working'
  return 'idle'
}

// ─── WarioRider SVG ───────────────────────────────────────────────────────────

export function WarioRider({ color, expression, flip, width: w = 192 }: {
  color: string
  expression: Expression
  flip?: boolean
  width?: number
}): React.ReactElement {
  const h = Math.round(w * 80 / 64)
  return (
    <svg
      viewBox="0 0 64 80"
      width={w}
      height={h}
      style={{ imageRendering: 'pixelated', display: 'block', transform: flip ? 'scaleX(-1)' : undefined }}
    >
      {/* Helmet */}
      <rect x="10" y="2" width="44" height="22" rx="6" fill={color} stroke="#000" strokeWidth="2.5" />
      <rect x="14" y="4" width="36" height="6" rx="3" fill="rgba(255,255,255,0.32)" />
      {/* Visor */}
      <rect x="12" y="14" width="40" height="11" rx="2" fill="#080820" stroke="#000" strokeWidth="2" />
      <rect x="16" y="15" width="32" height="4" fill="rgba(60,180,255,0.4)" />
      {/* Face */}
      <rect x="14" y="24" width="36" height="18" rx="4" fill="#f5c068" stroke="#000" strokeWidth="2" />
      {/* Body (jersey) */}
      <rect x="16" y="42" width="32" height="26" rx="3" fill={color} stroke="#000" strokeWidth="2.5" />
      <rect x="16" y="48" width="32" height="5" fill="rgba(255,255,255,0.2)" />
      {/* Arms */}
      <rect x="2"  y="42" width="14" height="20" rx="4" fill={color} stroke="#000" strokeWidth="2" />
      <rect x="48" y="42" width="14" height="20" rx="4" fill={color} stroke="#000" strokeWidth="2" />
      {/* Gloves */}
      <rect x="1"  y="58" width="16" height="12" rx="5" fill="#111" stroke="#000" strokeWidth="1.5" />
      <rect x="47" y="58" width="16" height="12" rx="5" fill="#111" stroke="#000" strokeWidth="1.5" />
      {/* Legs */}
      <rect x="18" y="68" width="12" height="12" rx="2" fill="#111" stroke="#000" strokeWidth="1.5" />
      <rect x="34" y="68" width="12" height="12" rx="2" fill="#111" stroke="#000" strokeWidth="1.5" />

      {expression === 'idle' && (
        <>
          <rect x="18" y="28" width="10" height="7" rx="2" fill="#222" stroke="#000" strokeWidth="1" />
          <rect x="36" y="28" width="10" height="7" rx="2" fill="#222" stroke="#000" strokeWidth="1" />
          <rect x="18" y="28" width="10" height="4" rx="2" fill="#f5c068" />
          <rect x="36" y="28" width="10" height="4" rx="2" fill="#f5c068" />
          <rect x="24" y="37" width="16" height="3" rx="1" fill="#8b3a2a" />
        </>
      )}

      {expression === 'working' && (
        <>
          <rect x="17" y="26" width="12" height="10" rx="2" fill="#fff" stroke="#000" strokeWidth="1" />
          <rect x="37" y="26" width="12" height="10" rx="2" fill="#fff" stroke="#000" strokeWidth="1" />
          <rect x="19" y="27" width="8" height="8" rx="1" fill="#222" />
          <rect x="39" y="27" width="8" height="8" rx="1" fill="#222" />
          <rect x="21" y="28" width="3" height="3" fill="#fff" />
          <rect x="41" y="28" width="3" height="3" fill="#fff" />
          <rect x="20" y="35" width="24" height="6" rx="2" fill="#8b3a2a" stroke="#000" strokeWidth="1" />
          <rect x="20" y="35" width="24" height="3" rx="1" fill="#fff" />
          <line x1="25" y1="35" x2="25" y2="38" stroke="#ccc" strokeWidth="1.5" />
          <line x1="30" y1="35" x2="30" y2="38" stroke="#ccc" strokeWidth="1.5" />
          <line x1="35" y1="35" x2="35" y2="38" stroke="#ccc" strokeWidth="1.5" />
          <line x1="40" y1="35" x2="40" y2="38" stroke="#ccc" strokeWidth="1.5" />
        </>
      )}

      {expression === 'maxing' && (
        <>
          <ellipse cx="23" cy="31" rx="7" ry="8" fill="#fff" stroke="#000" strokeWidth="1.5" />
          <ellipse cx="41" cy="31" rx="7" ry="8" fill="#fff" stroke="#000" strokeWidth="1.5" />
          <circle cx="23" cy="32" r="4" fill="#111" />
          <circle cx="41" cy="32" r="4" fill="#111" />
          <circle cx="25" cy="30" r="1.5" fill="#fff" />
          <circle cx="43" cy="30" r="1.5" fill="#fff" />
          <ellipse cx="32" cy="38" rx="8" ry="5" fill="#8b3a2a" stroke="#000" strokeWidth="1.5" />
          <ellipse cx="32" cy="39.5" rx="5" ry="3" fill="#cc3333" />
          <ellipse cx="4"  cy="10" rx="3" ry="5" fill="#7ae8ff" stroke="#000" strokeWidth="1.5" transform="rotate(-15,4,10)" />
          <ellipse cx="60" cy="7"  rx="2.5" ry="4" fill="#7ae8ff" stroke="#000" strokeWidth="1.5" transform="rotate(15,60,7)" />
          <ellipse cx="2"  cy="22" rx="2" ry="3" fill="#7ae8ff" stroke="#000" strokeWidth="1" />
          <line x1="7"  y1="15" x2="12" y2="20" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          <line x1="57" y1="12" x2="52" y2="17" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          <line x1="5"  y1="26" x2="9"  y2="29" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

// ─── Power bar ────────────────────────────────────────────────────────────────

export function PowerBar({ watts, color }: { watts: number; color: string }): React.ReactElement {
  const segments = 10
  const filled = Math.round(Math.min(1, watts / MAX_DISPLAY_WATTS) * segments)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: segments }, (_, i) => (
        <div
          key={i}
          style={{
            width: 22, height: 36,
            background: i < filled ? color : 'rgba(0,0,0,0.18)',
            border: '2.5px solid #000',
            boxShadow: i < filled ? `0 0 6px ${color}` : 'none',
          }}
        />
      ))}
    </div>
  )
}

// ─── Player panel (during battle) ─────────────────────────────────────────────

function PlayerPanel({ player, flip }: {
  player: PlayerState
  flip: boolean
}): React.ReactElement {
  const expr = getExpression(player.currentWatts)
  const avg = Math.round(getAvgWatts(player))

  return (
    <div style={{ ...styles.playerPanel, ...(flip ? styles.panelRight : styles.panelLeft) }}>
      <div style={{ ...styles.playerName, color: player.color }}>
        {player.initials}
      </div>
      <div style={styles.riderWrap}>
        <WarioRider color={player.color} expression={expr} flip={flip} />
      </div>
      <div style={{ ...styles.wattsNum, color: player.color }}>
        {Math.round(player.currentWatts)}W
      </div>
      <PowerBar watts={player.currentWatts} color={player.color} />
      <div style={styles.avgLabel}>AVG: {avg}W</div>
    </div>
  )
}

// ─── Finished overlay ─────────────────────────────────────────────────────────

function FinishedOverlay({ players, onMenu }: {
  players: PlayerState[]
  onMenu: () => void
}): React.ReactElement {
  const sorted = [...players].sort((a, b) => getAvgWatts(b) - getAvgWatts(a))
  const winner = sorted[0]
  const others = sorted.slice(1)

  return (
    <div style={styles.finishedOverlay}>
      {/* Winner tile */}
      <div style={styles.winnerTile}>
        <div style={styles.winnerBadge}>★ WINNER! ★</div>
        <WarioRider color={winner.color} expression="maxing" width={200} />
        <div style={{ ...styles.winnerInitials, color: winner.color }}>
          {winner.initials}
        </div>
        <div style={styles.winnerWattsRow}>
          <span style={{ ...styles.winnerBigWatts, color: winner.color }}>
            {Math.round(getAvgWatts(winner))}
          </span>
          <span style={{ ...styles.winnerWUnit, color: winner.color }}>W</span>
        </div>
        <div style={styles.avgWattsLabel}>AVG WATTS</div>
      </div>

      {/* Other riders */}
      {others.length > 0 && (
        <div style={styles.othersRow}>
          {others.map((p, i) => (
            <div key={p.deviceId} style={styles.otherTile}>
              <span style={styles.otherRank}>{i + 2}nd</span>
              <WarioRider color={p.color} expression="idle" width={88} />
              <div style={{ ...styles.otherInitials, color: p.color }}>{p.initials}</div>
              <div style={styles.otherWatts}>{Math.round(getAvgWatts(p))}W</div>
              <div style={styles.otherAvgLabel}>AVG</div>
            </div>
          ))}
        </div>
      )}

      <button style={styles.finMenuBtn} onClick={onMenu}>MENU</button>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function WattsBattleScreen(): React.ReactElement {
  const navigate = useNavigate()
  const { connected } = useDeviceStore()

  const connectedList = Object.values(connected).filter((d) => d.status === 'connected')

  const [players, setPlayers] = useState<PlayerState[]>(() =>
    connectedList.map((d, i) => ({
      deviceId: d.id,
      initials: d.initials,
      avatarIndex: d.avatarIndex,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      currentWatts: 0,
      totalWatts: 0,
      maxWatts: 0,
      readingCount: 0,
      lastTimestamp: 0,
    }))
  )

  const [durationSecs, setDurationSecs] = useState(DEFAULT_DURATION_S)
  const [status, setStatus]             = useState<BattleStatus>('setup')
  const [countdown, setCountdown]       = useState(COUNTDOWN_S)
  const [remainingMs, setRemainingMs]   = useState(DEFAULT_DURATION_S * 1000)

  const statusRef = useRef<BattleStatus>('setup')
  useEffect(() => { statusRef.current = status }, [status])

  // Countdown → racing
  useEffect(() => {
    if (status !== 'countdown') return
    setCountdown(COUNTDOWN_S)
    const timers = [
      setTimeout(() => setCountdown(2), 1000),
      setTimeout(() => setCountdown(1), 2000),
      setTimeout(() => setCountdown(0), 3000),
      setTimeout(() => setStatus('racing'), 3500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [status])

  // Battle timer
  useEffect(() => {
    if (status !== 'racing') return
    const durationMs = durationSecs * 1000
    setRemainingMs(durationMs)
    const startMs = Date.now()
    const id = setInterval(() => {
      const remaining = Math.max(0, durationMs - (Date.now() - startMs))
      setRemainingMs(remaining)
      if (remaining <= 0) {
        clearInterval(id)
        setStatus('finished')
      }
    }, 100)
    return () => clearInterval(id)
  }, [status, durationSecs])

  // BLE reading accumulation (real + demo devices)
  useEffect(() => {
    const handleReading = (reading: TrainerReading): void => {
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.deviceId !== reading.deviceId) return p
          if (reading.timestamp <= p.lastTimestamp) return p
          const isRacing = statusRef.current === 'racing'
          return {
            ...p,
            currentWatts: reading.watts,
            totalWatts:   isRacing ? p.totalWatts + reading.watts : p.totalWatts,
            maxWatts:     isRacing ? Math.max(p.maxWatts, reading.watts) : p.maxWatts,
            readingCount: isRacing ? p.readingCount + 1 : p.readingCount,
            lastTimestamp: reading.timestamp,
          }
        })
      )
    }
    const unsub1 = window.api.ble.onTrainerReading(handleReading)
    const unsub2 = onDemoReading(handleReading)
    return () => { unsub1(); unsub2() }
  }, [])

  // Navigate to results 3s after finish
  useEffect(() => {
    if (status !== 'finished') return
    const timer = setTimeout(() => {
      const sorted = [...players].sort((a, b) => getAvgWatts(b) - getAvgWatts(a))
      const result: SessionResult = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        config: { distanceMeters: 0, countdownSeconds: COUNTDOWN_S, physicsMode: 'flat-watts' },
        riders: sorted.map((p, i) => ({
          initials:       p.initials,
          avatarIndex:    p.avatarIndex,
          rank:           i + 1,
          finishTimeMs:   null,
          distanceMeters: 0,
          avgWatts:       getAvgWatts(p),
          maxWatts:       p.maxWatts,
          avgRpm:         0,
        })),
      }
      navigate('/results', { state: { result } })
    }, 4000)
    return () => clearTimeout(timer)
  }, [status, players, navigate])

  const p0 = players[0]
  const p1 = players[1]
  const timerSecs = (remainingMs / 1000).toFixed(1)

  if (players.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.noDevices}>NO DEVICES CONNECTED</div>
        <button style={styles.backBtn} onClick={() => navigate('/menu')}>BACK</button>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.titleBar}>
        <span style={styles.titleText}>WATTS BATTLE!</span>
      </div>

      <div style={styles.battleArea}>
        {status === 'finished' ? (
          <FinishedOverlay players={players} onMenu={() => navigate('/menu')} />
        ) : (
          <>
            {p0 && <PlayerPanel player={p0} flip={false} />}

            <div style={{ ...styles.center, ...(status === 'setup' ? styles.centerSetup : {}) }}>
              {status === 'setup' && (
                <div style={styles.setupBox}>
                  <div style={styles.setupLabel}>BATTLE TIME</div>
                  <div style={styles.setupDuration}>{durationSecs}s</div>
                  <input
                    type="range"
                    className="wb-slider"
                    min={MIN_DURATION_S}
                    max={MAX_DURATION_S}
                    step={DURATION_STEP_S}
                    value={durationSecs}
                    onChange={(e) => {
                      const secs = Number(e.target.value)
                      setDurationSecs(secs)
                      setRemainingMs(secs * 1000)
                    }}
                    style={styles.slider}
                  />
                  <div style={styles.sliderRange}>
                    <span>{MIN_DURATION_S}s</span>
                    <span>{MAX_DURATION_S}s</span>
                  </div>
                  <button style={styles.startBtn} onClick={() => setStatus('countdown')}>
                    START!
                  </button>
                  <button style={styles.setupBackBtn} onClick={() => navigate('/menu')}>
                    ◀ MENU
                  </button>
                </div>
              )}

              {status === 'countdown' && (
                <div style={styles.countdownNum} key={countdown}>
                  {countdown === 0 ? 'GO!' : countdown}
                </div>
              )}

              {status === 'racing' && (
                <>
                  <div style={styles.timerNum}>{timerSecs}</div>
                  <div style={styles.vsText}>VS</div>
                  <div style={styles.timerLabel}>SEC</div>
                </>
              )}
            </div>

            {p1 && <PlayerPanel player={p1} flip={true} />}
          </>
        )}
      </div>

      <style>{css}</style>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    background: '#ffe000',
    overflow: 'hidden',
    fontFamily: "'Press Start 2P', monospace",
    color: '#000',
  },
  titleBar: {
    background: '#000',
    padding: '14px 24px',
    textAlign: 'center',
    flexShrink: 0,
    borderBottom: '4px solid #ff8800',
  },
  titleText: {
    fontSize: 22, color: '#ffe000',
    letterSpacing: 5,
    textShadow: '4px 4px 0 #ff4400',
  },

  battleArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'stretch',
    overflow: 'hidden',
  },

  // ── Active battle ────────────────────────────────────────────────────────────

  playerPanel: {
    flex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '12px 16px',
  },
  panelLeft:  { borderRight: '4px solid #000' },
  panelRight: { borderLeft: '4px solid #000' },

  playerName: {
    fontSize: 22, letterSpacing: 4,
    textShadow: '3px 3px 0 rgba(0,0,0,0.25)',
  },
  riderWrap: { display: 'flex', justifyContent: 'center' },
  wattsNum: {
    fontSize: 30,
    fontVariantNumeric: 'tabular-nums',
    textShadow: '3px 3px 0 rgba(0,0,0,0.18)',
  },
  avgLabel: { fontSize: 10, color: '#000', letterSpacing: 2 },

  center: {
    width: 190,
    flexShrink: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '0 8px',
  },
  centerSetup: { width: 280 },

  // Setup
  setupBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 14,
    background: '#000',
    padding: '22px 20px',
    border: '4px solid #ffe000',
    boxShadow: '6px 6px 0 rgba(0,0,0,0.25)',
    width: '100%',
  },
  setupLabel: { fontSize: 9, color: '#ff8800', letterSpacing: 3 },
  setupDuration: {
    fontSize: 52, color: '#ffe000',
    letterSpacing: 2, lineHeight: 1,
    textShadow: '4px 4px 0 #ff4400',
    fontVariantNumeric: 'tabular-nums',
  },
  slider: { width: '100%', cursor: 'pointer' },
  sliderRange: {
    display: 'flex', justifyContent: 'space-between',
    width: '100%',
    fontSize: 7, color: '#888', letterSpacing: 1,
    marginTop: -8,
  },
  startBtn: {
    marginTop: 4,
    padding: '12px 28px',
    fontSize: 14, letterSpacing: 3,
    background: '#ffe000', color: '#000',
    border: '4px solid #ffe000',
    fontFamily: "'Press Start 2P', monospace",
    cursor: 'pointer',
    boxShadow: '4px 4px 0 rgba(255,255,255,0.4)',
  },
  setupBackBtn: {
    padding: '7px 14px',
    fontSize: 7, letterSpacing: 2,
    background: 'transparent', color: '#555',
    border: '2px solid #333',
    fontFamily: "'Press Start 2P', monospace",
    cursor: 'pointer',
  },

  // Countdown / racing
  countdownNum: {
    fontSize: 72, color: '#000',
    textShadow: '5px 5px 0 rgba(0,0,0,0.12)',
    lineHeight: 1,
    animation: 'countdownPop 0.35s cubic-bezier(0.2,1.4,0.6,1)',
  },
  timerNum: {
    fontSize: 36, color: '#000',
    fontVariantNumeric: 'tabular-nums',
    textShadow: '3px 3px 0 rgba(0,0,0,0.15)',
  },
  timerLabel: { fontSize: 9, color: '#555', letterSpacing: 3 },
  vsText: {
    fontSize: 44, color: '#ff2200',
    textShadow: '4px 4px 0 #000',
    letterSpacing: 5,
  },

  // ── Finished overlay ─────────────────────────────────────────────────────────

  finishedOverlay: {
    flex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 32px 16px',
    gap: 16,
    overflow: 'hidden',
  },

  winnerTile: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 6,
    background: '#000',
    padding: '16px 48px 20px',
    border: '5px solid #ffe000',
    boxShadow: '8px 8px 0 rgba(0,0,0,0.3)',
  },
  winnerBadge: {
    fontSize: 11, color: '#ffe000',
    letterSpacing: 5,
    animation: 'blink 0.5s step-end infinite',
    marginBottom: 4,
  },
  winnerInitials: {
    fontSize: 22, letterSpacing: 6,
    textShadow: '3px 3px 0 rgba(255,255,255,0.1)',
    marginTop: 8,
  },
  winnerWattsRow: {
    display: 'flex', alignItems: 'baseline', gap: 4,
  },
  winnerBigWatts: {
    fontSize: 88, lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    textShadow: '6px 6px 0 rgba(0,0,0,0.35)',
  },
  winnerWUnit: {
    fontSize: 40,
    textShadow: '4px 4px 0 rgba(0,0,0,0.3)',
  },
  avgWattsLabel: {
    fontSize: 7, color: '#777',
    letterSpacing: 4, marginTop: 2,
  },

  othersRow: {
    display: 'flex', gap: 16,
  },
  otherTile: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 4,
    background: 'rgba(0,0,0,0.14)',
    padding: '12px 20px',
    border: '3px solid rgba(0,0,0,0.35)',
  },
  otherRank: {
    fontSize: 7, color: '#333', letterSpacing: 2, marginBottom: 4,
  },
  otherInitials: {
    fontSize: 12, letterSpacing: 3,
    textShadow: '2px 2px 0 rgba(0,0,0,0.2)',
    marginTop: 4,
  },
  otherWatts: {
    fontSize: 26, color: '#000',
    fontVariantNumeric: 'tabular-nums',
    textShadow: '2px 2px 0 rgba(0,0,0,0.15)',
  },
  otherAvgLabel: {
    fontSize: 6, color: '#555', letterSpacing: 3,
  },

  finMenuBtn: {
    padding: '12px 36px',
    fontSize: 10, letterSpacing: 2,
    background: '#000', color: '#ffe000',
    border: '3px solid #000',
    fontFamily: "'Press Start 2P', monospace",
    cursor: 'pointer',
    boxShadow: '4px 4px 0 rgba(0,0,0,0.2)',
  },

  // ── No-device fallback ───────────────────────────────────────────────────────

  noDevices: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, color: '#000', letterSpacing: 2,
  },
  backBtn: {
    margin: '0 auto 24px',
    padding: '12px 32px',
    fontSize: 10, letterSpacing: 2,
    background: '#000', color: '#ffe000',
    border: '3px solid #000',
    fontFamily: "'Press Start 2P', monospace",
    cursor: 'pointer',
  },
}

const css = `
@keyframes countdownPop {
  0%   { transform: scale(2); opacity: 0.4; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
.wb-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  background: #444;
  border: 2px solid #000;
  outline: none;
  border-radius: 0;
}
.wb-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #ffe000;
  border: 3px solid #000;
  cursor: pointer;
  box-shadow: 2px 2px 0 rgba(0,0,0,0.4);
}
.wb-slider::-moz-range-thumb {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #ffe000;
  border: 3px solid #000;
  cursor: pointer;
}
`
