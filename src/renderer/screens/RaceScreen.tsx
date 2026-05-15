import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeviceStore } from '../store/deviceStore'
import { useRaceStore } from '../store/raceStore'
import { useGameLoop } from '../hooks/useGameLoop'
import { RaceTrack } from '../components/race/RaceTrack'
import { RaceHUD } from '../components/race/RaceHUD'
import { C } from '../theme'
import type { SessionResult } from '../types'

const RIDER_COLORS = [
  C.pink, C.orange, C.yellow, C.green,
  C.cyan, C.purple, '#ff8c00', C.white,
]

function fmtMs(ms: number): string {
  const m  = Math.floor(ms / 60000)
  const s  = Math.floor((ms % 60000) / 1000)
  const cs = Math.floor((ms % 1000) / 10)
  return `${m}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`
}

export function RaceScreen(): React.ReactElement {
  const navigate = useNavigate()
  const { connected } = useDeviceStore()
  const { race, initRace, startCountdown, startRacing, tickPhysics, endRace } = useRaceStore()
  const [countdown, setCountdown]   = useState<number | null>(null)
  const [showGo, setShowGo]         = useState(false)
  const [windowWidth,  setWindowWidth]  = useState(window.innerWidth)
  const [windowHeight, setWindowHeight] = useState(window.innerHeight)
  const [winner, setWinner] = useState<{ initials: string; color: string; timeMs: number } | null>(null)
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const resultRef   = useRef<SessionResult | null>(null)

  useEffect(() => {
    const riders = Object.values(connected).filter(
      (d) => d.status === 'connected' && d.initials.length > 0
    )
    if (riders.length === 0) { navigate('/character-select'); return }
    initRace(riders)
    startCountdown()
    setCountdown(3)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (race.status !== 'countdown') return
    setCountdown(3)
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!)
          startRacing()
          setShowGo(true)
          setTimeout(() => setShowGo(false), 900)
          return null
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [race.status, startRacing])

  useEffect(() => {
    if (race.status !== 'finished') return
    const result = buildResult()
    resultRef.current = result

    // Find winner (rank 1)
    const winRider = Object.values(race.riders).find((r) => r.rank === 1)
    if (winRider) {
      setWinner({
        initials: winRider.initials,
        color:    RIDER_COLORS[winRider.avatarIndex % RIDER_COLORS.length],
        timeMs:   winRider.finishTimeMs ?? 0,
      })
    }

    const t = setTimeout(() => {
      navigate('/results', { state: { result: resultRef.current } })
    }, 4500)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [race.status])

  useEffect(() => {
    const onResize = (): void => {
      setWindowWidth(window.innerWidth)
      setWindowHeight(window.innerHeight)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useGameLoop(race.status === 'racing', tickPhysics)

  const buildResult = (): SessionResult => {
    const riders = Object.values(race.riders)
    return {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      config: race.config,
      riders: riders.map((r) => ({
        initials: r.initials,
        avatarIndex: r.avatarIndex,
        rank: r.rank ?? riders.length,
        finishTimeMs: r.finishTimeMs,
        distanceMeters: r.positionMeters,
        avgWatts: r.readingCount > 0 ? r.totalWatts / r.readingCount : 0,
        maxWatts: r.maxWatts,
        avgRpm: r.readingCount > 0 ? r.totalRpm / r.readingCount : 0,
      }))
    }
  }

  return (
    <div style={styles.container}>
      {race.status !== 'idle' && (
        <RaceTrack race={race} windowWidth={windowWidth} windowHeight={windowHeight} />
      )}

      {(race.status === 'racing' || race.status === 'finished') && (
        <RaceHUD race={race} onStop={() => endRace()} />
      )}

      {/* Countdown overlay */}
      {race.status === 'countdown' && countdown !== null && (
        <div style={styles.overlay}>
          <div style={styles.countdownBox}>
            <div style={styles.countdownNum} key={countdown}>{countdown}</div>
            <div style={styles.countdownLabel}>GET READY!</div>
          </div>
          <style>{countdownAnim}</style>
        </div>
      )}

      {/* GO! */}
      {showGo && (
        <div style={styles.overlay}>
          <div style={{ ...styles.goText }}>GO!</div>
          <style>{goAnim}</style>
        </div>
      )}

      {/* Winner celebration */}
      {winner && (
        <div style={styles.winnerOverlay}>
          {/* Checkered flag background pattern */}
          <div style={styles.checkerBg} />

          <div style={styles.winnerInner}>
            <div style={{ ...styles.winnerInitials, color: winner.color, textShadow: `0 0 60px ${winner.color}, 8px 8px 0 #000` }}>
              {winner.initials}
            </div>
            <div style={{ ...styles.winsText, color: winner.color }}>
              WINS!
            </div>
            <div style={styles.winnerTime}>
              {fmtMs(winner.timeMs)}
            </div>
            <div style={styles.winnerHint}>
              RESULTS IN 4s…
            </div>
          </div>

          <style>{winnerAnim}</style>
        </div>
      )}
    </div>
  )
}

const countdownAnim = `
@keyframes cdPop {
  0%   { transform: scale(1.8); opacity: 0; }
  20%  { opacity: 1; }
  80%  { transform: scale(1);   opacity: 1; }
  100% { transform: scale(0.6); opacity: 0; }
}
`
const goAnim = `
@keyframes goFlash {
  0%   { transform: scale(0.6); opacity: 0; }
  25%  { opacity: 1; transform: scale(1.1); }
  75%  { opacity: 1; transform: scale(1); }
  100% { transform: scale(1.4); opacity: 0; }
}
`
const winnerAnim = `
@keyframes winnerSlam {
  0%   { transform: scale(2.5) translateY(-30px); opacity: 0; }
  15%  { transform: scale(0.92) translateY(4px);  opacity: 1; }
  25%  { transform: scale(1.06) translateY(-2px); }
  35%  { transform: scale(1);   translateY(0);    }
  100% { transform: scale(1);                     opacity: 1; }
}
@keyframes winnerHintBlink {
  0%,49% { opacity:1; } 50%,100% { opacity:0.3; }
}
@keyframes winnerPulse {
  0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
  70%  { box-shadow: 0 0 0 30px rgba(255,255,255,0); }
  100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
}
`

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%', height: '100%',
    position: 'relative', overflow: 'hidden',
    background: '#0d0221',
  },
  overlay: {
    position: 'absolute', inset: 0, zIndex: 30,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)',
  },
  countdownBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
    background: '#000',
    border: `4px solid ${C.orange}`,
    boxShadow: `8px 8px 0 ${C.black}`,
    padding: '40px 80px',
  },
  countdownNum: {
    fontSize: 120, color: C.yellow,
    textShadow: `6px 6px 0 ${C.black}`,
    animation: 'cdPop 1s ease-out forwards',
  },
  countdownLabel: {
    fontSize: 12, color: C.orange, letterSpacing: 4,
    textShadow: `2px 2px 0 ${C.black}`,
    animation: 'blink 0.5s step-end infinite',
  },
  goText: {
    fontSize: 120, color: C.green,
    textShadow: `6px 6px 0 ${C.black}, 0 0 40px ${C.green}`,
    animation: 'goFlash 0.9s ease-out forwards',
  },

  // ── Winner overlay ──
  winnerOverlay: {
    position: 'absolute', inset: 0, zIndex: 40,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.82)',
    overflow: 'hidden',
  },
  checkerBg: {
    position: 'absolute', inset: 0,
    backgroundImage: `
      repeating-conic-gradient(#fff 0% 25%, transparent 0% 50%)
    `,
    backgroundSize: '60px 60px',
    opacity: 0.06,
  },
  winnerInner: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    padding: '48px 80px',
    background: 'rgba(0,0,0,0.75)',
    border: `6px solid #fff`,
    boxShadow: `0 0 80px rgba(255,255,255,0.15), 12px 12px 0 #000`,
    animation: 'winnerPulse 1.2s ease-out 0.2s',
  },
  winnerInitials: {
    fontSize: 160, lineHeight: 1,
    animation: 'winnerSlam 0.5s cubic-bezier(0.23,1,0.32,1) forwards',
  },
  winsText: {
    fontSize: 48, letterSpacing: 12,
    textShadow: `4px 4px 0 #000`,
  },
  winnerTime: {
    fontSize: 28, color: C.white, letterSpacing: 4,
    textShadow: `3px 3px 0 #000`,
    fontVariantNumeric: 'tabular-nums',
    marginTop: 8,
  },
  winnerHint: {
    fontSize: 9, color: C.dim, letterSpacing: 3, marginTop: 16,
    animation: 'winnerHintBlink 1s step-end infinite',
  },
}
