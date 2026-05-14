import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeviceStore } from '../store/deviceStore'
import { useRaceStore } from '../store/raceStore'
import { useGameLoop } from '../hooks/useGameLoop'
import { RaceTrack } from '../components/race/RaceTrack'
import { RaceHUD } from '../components/race/RaceHUD'
import { C } from '../theme'
import type { SessionResult } from '../types'

export function RaceScreen(): React.ReactElement {
  const navigate = useNavigate()
  const { connected } = useDeviceStore()
  const { race, initRace, startCountdown, startRacing, tickPhysics, endRace } = useRaceStore()
  const [countdown, setCountdown] = useState<number | null>(null)
  const [showGo, setShowGo] = useState(false)
  const [windowWidth,  setWindowWidth]  = useState(window.innerWidth)
  const [windowHeight, setWindowHeight] = useState(window.innerHeight)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
    navigate('/results', { state: { result } })
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
}
