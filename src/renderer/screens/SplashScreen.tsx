import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, sunsetBg } from '../theme'
import type { RaceState, RiderState } from '../types'
import { RaceTrack } from '../components/race/RaceTrack'
import { wattsToVelocity } from '../store/raceStore'
import { PLAYER_COLORS, WarioRider, PowerBar, getExpression } from './WattsBattleScreen'

// ── Demo constants ────────────────────────────────────────────────────────────

const DEMO_TIMEOUT_MS      = 20_000
const DEMO_DISTANCE_M      = 200
const DEMO_BATTLE_MS       = 12_000
const DEMO_SEQUENCE        = ['race', 'watts-battle'] as const
type DemoType = typeof DEMO_SEQUENCE[number]

const DEMO_CONFIG = [
  { deviceId: 'd1', initials: 'ACE', avatarIndex: 0, basePower: 265, phase: 0.0 },
  { deviceId: 'd2', initials: 'REX', avatarIndex: 2, basePower: 242, phase: 1.7 },
]

function makeDemoRace(): RaceState {
  const riders: Record<string, RiderState> = {}
  for (const cfg of DEMO_CONFIG) {
    riders[cfg.deviceId] = {
      deviceId: cfg.deviceId, initials: cfg.initials, avatarIndex: cfg.avatarIndex,
      positionMeters: 0, velocityMs: 0,
      currentWatts: cfg.basePower, currentRpm: 85,
      totalWatts: 0, maxWatts: cfg.basePower, totalRpm: 0, readingCount: 0,
      finishTimeMs: null, rank: null,
    }
  }
  return {
    status: 'racing',
    config: { distanceMeters: DEMO_DISTANCE_M, countdownSeconds: 0, physicsMode: 'flat-watts' },
    startTimeMs: Date.now(), elapsedMs: 0,
    riders, finishOrder: [],
  }
}

function tickDemo(prev: RaceState, deltaMs: number): RaceState {
  if (prev.status === 'finished') return prev
  const clampedDt = Math.min(deltaMs, 100)
  const elapsedMs = prev.elapsedMs + clampedDt
  const dt = clampedDt / 1000
  const t = elapsedMs / 1000

  const riders: Record<string, RiderState> = {}
  const finishOrder = [...prev.finishOrder]

  for (const cfg of DEMO_CONFIG) {
    const r = { ...prev.riders[cfg.deviceId] }
    if (r.finishTimeMs !== null) { riders[cfg.deviceId] = r; continue }

    const watts = Math.max(80,
      cfg.basePower + Math.sin(t * 0.3 + cfg.phase) * 28 + Math.sin(t * 1.3 + cfg.phase * 1.7) * 12
    )
    const targetV = wattsToVelocity(watts)
    r.velocityMs   = r.velocityMs * 0.85 + targetV * 0.15
    r.positionMeters = Math.min(r.positionMeters + r.velocityMs * dt, prev.config.distanceMeters)
    r.currentWatts = watts
    r.currentRpm   = 82 + Math.sin(t * 0.5 + cfg.phase) * 8

    if (r.positionMeters >= prev.config.distanceMeters) {
      r.finishTimeMs = elapsedMs
      r.rank = finishOrder.length + 1
      finishOrder.push(r.deviceId)
    }
    riders[cfg.deviceId] = r
  }

  return {
    ...prev, elapsedMs, riders, finishOrder,
    status: finishOrder.length === DEMO_CONFIG.length ? 'finished' : 'racing',
  }
}

// ── Splash screen ─────────────────────────────────────────────────────────────

export function SplashScreen(): React.ReactElement {
  const navigate = useNavigate()
  const [showDemo, setShowDemo] = useState(false)
  const [demoIdx,  setDemoIdx]  = useState(0)

  // Start/restart the idle timer whenever splash is visible
  useEffect(() => {
    if (showDemo) return
    const id = setTimeout(() => setShowDemo(true), DEMO_TIMEOUT_MS)
    return () => clearTimeout(id)
  }, [showDemo])

  // Advance to next demo, or return to splash when sequence wraps
  const handleDemoFinish = useCallback(() => {
    setDemoIdx((prev) => {
      const next = (prev + 1) % DEMO_SEQUENCE.length
      if (next === 0) setShowDemo(false)
      return next
    })
  }, [])

  // Key handler: interrupt demo → back to splash; else → menu
  useEffect(() => {
    function onKey(): void {
      if (showDemo) { setShowDemo(false); setDemoIdx(0) }
      else          { navigate('/menu') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, showDemo])

  return (
    <div style={{ ...styles.container, ...sunsetBg }}>

      {/* Stars */}
      <div style={styles.stars}>
        {STARS.map((s, i) => (
          <div key={i} style={{
            ...styles.star,
            left: s.x, top: s.y, width: s.size, height: s.size,
            animationDelay: `${s.delay}s`,
          }} />
        ))}
      </div>

      {/* Speed lines radiating from centre */}
      <div style={styles.speedLines}>
        {LINES.map((l, i) => (
          <div key={i} style={{
            ...styles.speedLine,
            transform: `rotate(${l.angle}deg)`,
            opacity: l.opacity,
            animationDelay: `${l.delay}s`,
          }} />
        ))}
      </div>

      {/* Mountains */}
      <svg style={styles.mountains} viewBox="0 0 1920 220" preserveAspectRatio="none">
        <polygon points="0,220 200,60 400,220"    fill="#3d1c5e" />
        <polygon points="150,220 420,25 700,220"  fill="#2d1448" />
        <polygon points="500,220 750,80 1000,220" fill="#3d1c5e" />
        <polygon points="700,220 1050,15 1380,220" fill="#1a0a2e" />
        <polygon points="1100,220 1400,65 1700,220" fill="#3d1c5e" />
        <polygon points="1500,220 1720,45 1920,220" fill="#2d1448" />
      </svg>

      {/* Palm trees */}
      <div style={styles.palms}>
        <PalmTree x={80}   size={1.0} />
        <PalmTree x={200}  size={0.7} />
        <PalmTree x={1680} size={0.7} flip />
        <PalmTree x={1800} size={1.0} flip />
      </div>

      {/* Ocean */}
      <div style={styles.ocean}>
        <div style={styles.wave1} />
        <div style={styles.wave2} />
        <div style={styles.wave3} />
      </div>

      {/* ── LOGO ── */}
      <div style={styles.logoWrap}>

        {/* Corner decorations */}
        <div style={styles.cornerTL}>◆</div>
        <div style={styles.cornerTR}>◆</div>
        <div style={styles.cornerBL}>◆</div>
        <div style={styles.cornerBR}>◆</div>

        {/* Top label */}
        <div style={styles.presents}>★ BREWS BREWS & BIKES ★ PRESENTS ★</div>

        {/* Main title */}
        <div style={styles.titleSeeker}>SEEKER</div>
        <div style={styles.titleDivider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerStar}>★</span>
          <span style={styles.dividerLine} />
        </div>
        <div style={styles.titleCycle}>CYCLE</div>

        {/* Edition badge */}
        <div style={styles.edition}>
          <span style={styles.editionInner}>BIG BREW EDITION</span>
        </div>

        {/* Press any key */}
        <div style={styles.pressKey}>
          <span style={styles.pressKeyText}>PRESS ANY KEY</span>
          <span style={styles.cursor} />
        </div>

        {/* Copyright */}
        <div style={styles.copyright}>© 2025 SEEKER LABS · ALL RIGHTS RESERVED</div>
      </div>

      {showDemo && (
        (DEMO_SEQUENCE[demoIdx] as DemoType) === 'race'
          ? <DemoRace onFinish={handleDemoFinish} />
          : <DemoWattsBattle onFinish={handleDemoFinish} />
      )}
      <style>{css}</style>
    </div>
  )
}

// ── Demo race overlay ─────────────────────────────────────────────────────────

function DemoRace({ onFinish }: { onFinish: () => void }): React.ReactElement {
  const [race, setRace] = useState<RaceState>(makeDemoRace)
  const rafRef  = useRef<number>(0)
  const lastRef = useRef<number>(0)

  useEffect(() => {
    function tick(now: number): void {
      const dt = lastRef.current ? now - lastRef.current : 0
      lastRef.current = now
      setRace((prev) => tickDemo(prev, dt))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Return to splash 4s after finish
  useEffect(() => {
    if (race.status !== 'finished') return
    const id = setTimeout(onFinish, 4000)
    return () => clearTimeout(id)
  }, [race.status, onFinish])

  return (
    <div style={styles.demoOverlay}>
      <RaceTrack race={race} windowWidth={window.innerWidth} windowHeight={window.innerHeight} />
      <div style={styles.demoBadge}>◆ DEMO ◆</div>
      <div style={styles.demoPrompt}>PRESS ANY KEY TO PLAY</div>
    </div>
  )
}

// ── Demo watts battle overlay ─────────────────────────────────────────────────

interface DemoBattlePlayer {
  initials: string
  color:    string
  watts:    number
  avg:      number
}

function DemoBattlePanel({ player, flip }: { player: DemoBattlePlayer; flip: boolean }): React.ReactElement {
  const expr = getExpression(player.watts)
  return (
    <div style={{ ...wbDemo.panel, ...(flip ? wbDemo.panelRight : wbDemo.panelLeft) }}>
      <div style={{ ...wbDemo.playerName, color: player.color }}>{player.initials}</div>
      <WarioRider color={player.color} expression={expr} flip={flip} />
      <div style={{ ...wbDemo.wattsNum, color: player.color }}>{Math.round(player.watts)}W</div>
      <PowerBar watts={player.watts} color={player.color} />
      <div style={wbDemo.avgLabel}>AVG: {Math.round(player.avg)}W</div>
    </div>
  )
}

function DemoWattsBattle({ onFinish }: { onFinish: () => void }): React.ReactElement {
  const [elapsedMs, setElapsedMs] = useState(0)
  const [finished, setFinished]   = useState(false)
  const accRef = useRef([{ sum: 0, count: 0 }, { sum: 0, count: 0 }])

  useEffect(() => {
    const start = performance.now()
    let raf: number
    function tick(now: number): void {
      const elapsed = Math.min(now - start, DEMO_BATTLE_MS)
      const t = elapsed / 1000
      for (let i = 0; i < 2; i++) {
        const base = i === 0 ? 265 : 242
        const ph   = i === 0 ? 0   : 1.7
        accRef.current[i].sum   += Math.max(80, base + Math.sin(t * 0.4 + ph) * 40 + Math.sin(t * 1.1 + ph * 1.5) * 15)
        accRef.current[i].count++
      }
      setElapsedMs(elapsed)
      if (elapsed >= DEMO_BATTLE_MS) { setFinished(true); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (!finished) return
    const id = setTimeout(onFinish, 4000)
    return () => clearTimeout(id)
  }, [finished, onFinish])

  const t   = elapsedMs / 1000
  const w0  = Math.max(80, 265 + Math.sin(t * 0.4)       * 40 + Math.sin(t * 1.1)        * 15)
  const w1  = Math.max(80, 242 + Math.sin(t * 0.4 + 1.7) * 40 + Math.sin(t * 1.1 + 2.89) * 15)
  const avg0 = accRef.current[0].count > 0 ? accRef.current[0].sum / accRef.current[0].count : 265
  const avg1 = accRef.current[1].count > 0 ? accRef.current[1].sum / accRef.current[1].count : 242

  const p0: DemoBattlePlayer = { initials: 'ACE', color: PLAYER_COLORS[0], watts: w0, avg: avg0 }
  const p1: DemoBattlePlayer = { initials: 'REX', color: PLAYER_COLORS[1], watts: w1, avg: avg1 }
  const winner = avg0 >= avg1 ? p0 : p1
  const remaining = ((DEMO_BATTLE_MS - elapsedMs) / 1000).toFixed(1)

  return (
    <div style={styles.demoOverlay}>
      {/* Battle UI */}
      <div style={wbDemo.container}>
        <div style={wbDemo.titleBar}>
          <span style={wbDemo.titleText}>WATTS BATTLE!</span>
        </div>
        <div style={wbDemo.battleArea}>
          {finished ? (
            <div style={wbDemo.finishedWrap}>
              <div style={wbDemo.winnerBadge}>★ WINNER! ★</div>
              <WarioRider color={winner.color} expression="maxing" width={180} />
              <div style={{ ...wbDemo.winnerInitials, color: winner.color }}>{winner.initials}</div>
              <div style={wbDemo.winnerWattsRow}>
                <span style={{ ...wbDemo.winnerBigWatts, color: winner.color }}>{Math.round(winner.avg)}</span>
                <span style={{ ...wbDemo.winnerWUnit,   color: winner.color }}>W</span>
              </div>
              <div style={wbDemo.avgWattsLabel}>AVG WATTS</div>
            </div>
          ) : (
            <>
              <DemoBattlePanel player={p0} flip={false} />
              <div style={wbDemo.center}>
                <div style={wbDemo.timerNum}>{remaining}</div>
                <div style={wbDemo.vsText}>VS</div>
                <div style={wbDemo.secLabel}>SEC</div>
              </div>
              <DemoBattlePanel player={p1} flip />
            </>
          )}
        </div>
      </div>

      {/* Demo overlays */}
      <div style={{ ...styles.demoBadge, zIndex: 40 }}>◆ DEMO ◆</div>
      <div style={{ ...styles.demoPrompt, zIndex: 40 }}>PRESS ANY KEY TO PLAY</div>
    </div>
  )
}

function PalmTree({ x, flip, size = 1 }: { x: number; flip?: boolean; size?: number }): React.ReactElement {
  const w = Math.round(80 * size)
  const h = Math.round(180 * size)
  return (
    <svg
      viewBox="0 0 60 140"
      width={w} height={h}
      style={{
        position: 'absolute', bottom: 140,
        left: x,
        transform: flip ? 'scaleX(-1)' : undefined,
        imageRendering: 'pixelated',
      }}
    >
      <rect x="26" y="60" width="8"  height="80" fill="#8B5E3C" />
      <rect x="24" y="80" width="12" height="60" fill="#6B3F1F" />
      <polygon points="30,0 10,40 30,30"   fill="#2d8a2d" />
      <polygon points="30,10 55,35 30,35"  fill="#39b339" />
      <polygon points="30,5 0,30 30,35"    fill="#2d8a2d" />
      <polygon points="30,15 60,50 30,45"  fill="#1e6b1e" />
      <polygon points="30,15 -5,55 30,45"  fill="#39b339" />
    </svg>
  )
}

// ── Animations ────────────────────────────────────────────────────────────────
const css = `
@keyframes seekerGlow {
  0%   { text-shadow: 8px 8px 0 #cc3300, 16px 16px 0 #881100, 20px 20px 0 #000,
                      0 0 40px #ff6b35, 0 0 80px #ff6b35; }
  33%  { text-shadow: 8px 8px 0 #cc0066, 16px 16px 0 #880033, 20px 20px 0 #000,
                      0 0 40px #ff2d78, 0 0 80px #ff2d78; }
  66%  { text-shadow: 8px 8px 0 #ccaa00, 16px 16px 0 #886600, 20px 20px 0 #000,
                      0 0 40px #ffee10, 0 0 80px #ffaa00; }
  100% { text-shadow: 8px 8px 0 #cc3300, 16px 16px 0 #881100, 20px 20px 0 #000,
                      0 0 40px #ff6b35, 0 0 80px #ff6b35; }
}
@keyframes cycleSlide {
  0%   { letter-spacing: 32px; opacity: 0; }
  100% { letter-spacing: 20px; opacity: 1; }
}
@keyframes scanIn {
  0%   { clip-path: inset(0 100% 0 0); }
  100% { clip-path: inset(0 0% 0 0); }
}
@keyframes wavePulse {
  0%,100% { transform: translateX(0)   scaleY(1);   }
  50%     { transform: translateX(-80px) scaleY(1.1); }
}
@keyframes speedPulse {
  0%,100% { opacity: 0;    transform: scaleX(0.3); }
  50%     { opacity: 0.15; transform: scaleX(1);   }
}
@keyframes cursorBlink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
@keyframes cornerSpin {
  0%,100% { transform: scale(1);   color: #ff6b35; }
  50%     { transform: scale(1.3); color: #ffee10; }
}
@keyframes pressBlink {
  0%,49%  { color: #ff2d78; }
  50%,100%{ color: #ffaa00; }
}
`

// Deterministic star + speed-line data
const STARS = Array.from({ length: 48 }, (_, i) => ({
  x:     `${((i * 47 + 13) % 97) + 1}%`,
  y:     `${((i * 31 + 7)  % 45) + 1}%`,
  size:  i % 4 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
  delay: (i * 0.17) % 1.4,
}))

const LINES = Array.from({ length: 24 }, (_, i) => ({
  angle:   i * 15,
  opacity: 0.06 + (i % 3) * 0.04,
  delay:   (i * 0.12) % 1.0,
}))

// ── Styles ────────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%', height: '100%',
    position: 'relative', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  stars: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  star: {
    position: 'absolute',
    background: '#ffffff',
    animation: 'blink 1.4s step-end infinite',
  },

  speedLines: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none',
  },
  speedLine: {
    position: 'absolute',
    width: '120%', height: 2,
    background: `linear-gradient(90deg, transparent 0%, ${C.orange} 50%, transparent 100%)`,
    transformOrigin: 'center center',
    animation: 'speedPulse 2s ease-in-out infinite',
  },

  mountains: {
    position: 'absolute', bottom: 160, left: 0, right: 0,
    height: 220, pointerEvents: 'none',
  },

  palms: { position: 'absolute', inset: 0, pointerEvents: 'none' },

  ocean: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 160, overflow: 'hidden',
  },
  wave1: {
    position: 'absolute', left: '-10%', right: '-10%', bottom: 100, height: 65,
    background: '#1a6bff',
    animation: 'wavePulse 2.2s ease-in-out infinite',
  },
  wave2: {
    position: 'absolute', left: '-10%', right: '-10%', bottom: 50, height: 56,
    background: '#1452cc',
    animation: 'wavePulse 2.8s ease-in-out infinite reverse',
  },
  wave3: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 56,
    background: '#0d3d99',
  },

  // ── Logo block ──
  logoWrap: {
    position: 'relative', zIndex: 10,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    padding: '32px 80px 28px',
    background: 'rgba(10,2,20,0.82)',
    border: `4px solid ${C.orange}`,
    boxShadow: `8px 8px 0 #000, 0 0 60px rgba(255,107,53,0.25)`,
  },

  cornerTL: {
    position: 'absolute', top: -16, left: -16,
    fontSize: 22, color: C.orange,
    animation: 'cornerSpin 2.4s ease-in-out infinite',
  },
  cornerTR: {
    position: 'absolute', top: -16, right: -16,
    fontSize: 22, color: C.orange,
    animation: 'cornerSpin 2.4s ease-in-out infinite 0.6s',
  },
  cornerBL: {
    position: 'absolute', bottom: -16, left: -16,
    fontSize: 22, color: C.orange,
    animation: 'cornerSpin 2.4s ease-in-out infinite 1.2s',
  },
  cornerBR: {
    position: 'absolute', bottom: -16, right: -16,
    fontSize: 22, color: C.orange,
    animation: 'cornerSpin 2.4s ease-in-out infinite 1.8s',
  },

  presents: {
    fontSize: 8, color: C.dim,
    letterSpacing: 3,
    textShadow: `1px 1px 0 #000`,
  },

  titleSeeker: {
    fontSize: 96,
    color: C.yellow,
    letterSpacing: 16,
    animation: 'seekerGlow 3s ease-in-out infinite',
    lineHeight: 1.1,
  },

  titleDivider: {
    display: 'flex', alignItems: 'center', gap: 16,
    width: '100%',
  },
  dividerLine: {
    flex: 1, height: 3,
    background: `linear-gradient(90deg, transparent, ${C.orange}, transparent)`,
  },
  dividerStar: {
    fontSize: 20, color: C.orange,
    textShadow: `2px 2px 0 #000`,
    animation: 'cornerSpin 1.6s ease-in-out infinite',
  },

  titleCycle: {
    fontSize: 48,
    color: C.orange,
    letterSpacing: 20,
    textShadow: `4px 4px 0 #882200, 8px 8px 0 #000`,
    animation: 'cycleSlide 0.6s ease-out both',
  },

  edition: {
    marginTop: 4,
    background: C.pink,
    padding: '5px 20px',
    boxShadow: `3px 3px 0 #000`,
  },
  editionInner: {
    fontSize: 9, color: C.black,
    letterSpacing: 3,
    textShadow: 'none',
  },

  pressKey: {
    marginTop: 16,
    display: 'flex', alignItems: 'center', gap: 8,
    animation: 'pressBlink 0.9s step-end infinite',
  },
  pressKeyText: { fontSize: 11, letterSpacing: 3 },
  cursor: {
    display: 'inline-block',
    width: 12, height: 18,
    background: 'currentColor',
    animation: 'cursorBlink 0.7s step-end infinite',
    verticalAlign: 'middle',
  },

  copyright: {
    marginTop: 4,
    fontSize: 6, color: C.muted,
    letterSpacing: 2,
  },

  demoOverlay: {
    position: 'absolute', inset: 0, zIndex: 20,
  },
  demoBadge: {
    position: 'absolute', top: 24, left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 22, color: C.yellow, letterSpacing: 8,
    background: 'rgba(0,0,0,0.85)',
    border: `4px solid ${C.orange}`,
    padding: '12px 40px',
    boxShadow: `4px 4px 0 #000`,
    animation: 'blink 1s step-end infinite',
    whiteSpace: 'nowrap',
  },
  demoPrompt: {
    position: 'absolute', bottom: 32, left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 16, color: C.green, letterSpacing: 4,
    background: 'rgba(0,0,0,0.85)',
    padding: '12px 32px',
    border: `3px solid ${C.green}`,
    whiteSpace: 'nowrap',
    animation: 'pressBlink 0.9s step-end infinite',
  },
}

// ── Watts-battle demo styles ──────────────────────────────────────────────────

const wbDemo: Record<string, React.CSSProperties> = {
  container: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    background: '#ffe000',
    fontFamily: "'Press Start 2P', monospace",
    color: '#000',
    overflow: 'hidden',
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
    display: 'flex', alignItems: 'stretch',
    overflow: 'hidden',
  },
  panel: {
    flex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center',
    gap: 10, padding: '12px 16px',
  },
  panelLeft:  { borderRight: '4px solid #000' },
  panelRight: { borderLeft:  '4px solid #000' },
  playerName: { fontSize: 22, letterSpacing: 4, textShadow: '3px 3px 0 rgba(0,0,0,0.25)' },
  wattsNum:   { fontSize: 30, fontVariantNumeric: 'tabular-nums', textShadow: '3px 3px 0 rgba(0,0,0,0.18)' },
  avgLabel:   { fontSize: 10, color: '#000', letterSpacing: 2 },
  center: {
    width: 190, flexShrink: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 10,
  },
  timerNum: { fontSize: 36, color: '#000', fontVariantNumeric: 'tabular-nums', textShadow: '3px 3px 0 rgba(0,0,0,0.15)' },
  vsText:   { fontSize: 44, color: '#ff2200', textShadow: '4px 4px 0 #000', letterSpacing: 5 },
  secLabel: { fontSize: 9, color: '#555', letterSpacing: 3 },

  // Finished
  finishedWrap: {
    flex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 8,
  },
  winnerBadge: {
    fontSize: 11, color: '#000', letterSpacing: 5,
    animation: 'blink 0.5s step-end infinite',
    marginBottom: 4,
  },
  winnerInitials: { fontSize: 22, letterSpacing: 6, marginTop: 8 },
  winnerWattsRow: { display: 'flex', alignItems: 'baseline', gap: 4 },
  winnerBigWatts: { fontSize: 88, lineHeight: 1, fontVariantNumeric: 'tabular-nums', textShadow: '6px 6px 0 rgba(0,0,0,0.2)' },
  winnerWUnit:    { fontSize: 40 },
  avgWattsLabel:  { fontSize: 7, color: '#555', letterSpacing: 4, marginTop: 2 },
}
