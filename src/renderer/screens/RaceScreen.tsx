import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeviceStore } from '../store/deviceStore'
import { useRaceStore } from '../store/raceStore'
import { useGameLoop } from '../hooks/useGameLoop'
import { RaceTrack } from '../components/race/RaceTrack'
import { RaceHUD } from '../components/race/RaceHUD'
import type { SessionResult } from '../types'

export function RaceScreen(): React.ReactElement {
  const navigate = useNavigate()
  const { connected } = useDeviceStore()
  const { race, initRace, startCountdown, startRacing, tickPhysics, endRace } = useRaceStore()
  const [countdown, setCountdown] = useState<number | null>(null)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Initialise race when screen mounts
  useEffect(() => {
    const riders = Object.values(connected).filter(
      (d) => d.status === 'connected' && d.initials.length > 0
    )
    if (riders.length === 0) {
      navigate('/devices')
      return
    }
    initRace(riders)
    startCountdown()
    setCountdown(3)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Countdown sequence
  useEffect(() => {
    if (race.status !== 'countdown') return
    setCountdown(3)

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownRef.current!)
          startRacing()
          return null
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [race.status, startRacing])

  // Navigate to results when race finishes
  useEffect(() => {
    if (race.status !== 'finished') return

    const result = buildSessionResult()
    navigate('/results', { state: { result } })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [race.status])

  // Window resize
  useEffect(() => {
    const onResize = (): void => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Game loop
  useGameLoop(race.status === 'racing', tickPhysics)

  const buildSessionResult = (): SessionResult => {
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
        avgRpm: r.readingCount > 0 ? r.totalRpm / r.readingCount : 0
      }))
    }
  }

  const handleStop = (): void => {
    endRace()
  }

  return (
    <div style={styles.container}>
      {/* Background */}
      <div style={styles.bg} />

      {/* Track */}
      {race.status !== 'idle' && (
        <RaceTrack race={race} windowWidth={windowWidth} />
      )}

      {/* HUD */}
      {(race.status === 'racing' || race.status === 'finished') && (
        <RaceHUD race={race} onStop={handleStop} />
      )}

      {/* Countdown overlay */}
      {race.status === 'countdown' && countdown !== null && (
        <div style={styles.countdownOverlay}>
          <div style={styles.countdownNumber} key={countdown}>
            {countdown}
          </div>
          <style>{countdownAnim}</style>
        </div>
      )}

      {/* GO! flash */}
      {race.status === 'racing' && countdown === null && (
        <GoFlash />
      )}
    </div>
  )
}

const goFlashDuration = 800

function GoFlash(): React.ReactElement | null {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), goFlashDuration)
    return () => clearTimeout(t)
  }, [])
  if (!visible) return null
  return (
    <div style={styles.goOverlay}>
      <div style={styles.goText}>GO!</div>
      <style>{goAnim}</style>
    </div>
  )
}

const countdownAnim = `
@keyframes countdownPop {
  0% { transform: scale(1.4); opacity: 0; }
  20% { opacity: 1; }
  80% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.8); opacity: 0; }
}
`

const goAnim = `
@keyframes goFlash {
  0% { opacity: 0; transform: scale(0.7); }
  30% { opacity: 1; transform: scale(1.1); }
  70% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.3); }
}
`

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    background: '#0a0a1a'
  },
  bg: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at 50% 30%, #0d1a2e 0%, #0a0a1a 70%)'
  },
  countdownOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.5)',
    zIndex: 20
  },
  countdownNumber: {
    fontSize: 240,
    fontWeight: 900,
    color: '#ffffff',
    textShadow: '0 0 80px rgba(0,212,255,0.5)',
    animation: 'countdownPop 1s ease-out forwards'
  },
  goOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 20
  },
  goText: {
    fontSize: 180,
    fontWeight: 900,
    color: '#22c55e',
    textShadow: '0 0 60px rgba(34,197,94,0.6)',
    animation: 'goFlash 0.8s ease-out forwards'
  }
}
