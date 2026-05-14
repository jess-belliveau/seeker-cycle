import React, { useEffect, useRef, useState } from 'react'
import { useDeviceStore } from '../../store/deviceStore'
import { C } from '../../theme'

const ALPHABET   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LETTER_H   = 52          // px per letter slot
const VISIBLE    = 5           // letters shown per reel (must be odd)
const HALF       = 2           // Math.floor(VISIBLE / 2)
const STOP_RPM   = 12          // below this → treat as stopped
const LOCK_MS    = 3000        // ms of stillness before confirming
const RPM_SCALE  = 0.05        // letters-per-sec per RPM  (60 RPM → 3 letters/s)

function letter(idx: number): string {
  return ALPHABET[((idx % 26) + 26) % 26]
}

interface Props {
  deviceId: string
  onComplete: (initials: string) => void
}

export function SlotInitialsInput({ deviceId, onComplete }: Props): React.ReactElement {
  const [activeReel, setActiveReel] = useState(0)
  const [confirmed, setConfirmed]   = useState<string[]>([])

  // Animation refs — never trigger re-renders
  const posRef      = useRef(0)
  const velRef      = useRef(0)
  const lockRef     = useRef(0)   // ms accumulated while stopped
  const hasSpunRef  = useRef(false) // true once reel has spun for first time
  const rafRef      = useRef(0)
  const lastTRef    = useRef(0)

  // Kept in sync via useEffect so RAF can read without closure stale values
  const activeReelRef  = useRef(0)
  const confirmedRef   = useRef<string[]>([])
  const onCompleteRef  = useRef(onComplete)

  useEffect(() => { activeReelRef.current  = activeReel   }, [activeReel])
  useEffect(() => { confirmedRef.current   = confirmed    }, [confirmed])
  useEffect(() => { onCompleteRef.current  = onComplete   }, [onComplete])

  // Direct DOM refs — updated every frame, no React state
  const stripRef   = useRef<HTMLDivElement>(null)
  const letterRefs = useRef<(HTMLDivElement | null)[]>(Array(VISIBLE).fill(null))
  const lockFillRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tick = (t: number): void => {
      const dt = Math.min(lastTRef.current ? t - lastTRef.current : 0, 100) / 1000
      lastTRef.current = t

      if (activeReelRef.current >= 3) return

      const rpm = useDeviceStore.getState().liveReadings[deviceId]?.rpm ?? 0
      const targetV = rpm > STOP_RPM ? rpm * RPM_SCALE : 0

      velRef.current = velRef.current * 0.88 + targetV * 0.12
      if (velRef.current < 0.02) velRef.current = 0

      if (velRef.current > 0.1) hasSpunRef.current = true

      posRef.current += velRef.current * dt

      const intPos = Math.floor(posRef.current)
      const sub    = posRef.current - intPos

      // Update letter text directly
      for (let i = 0; i < VISIBLE; i++) {
        const el = letterRefs.current[i]
        if (el) el.textContent = letter(intPos - HALF + i)
      }

      // Update reel scroll position directly
      if (stripRef.current) {
        stripRef.current.style.transform = `translateY(${-sub * LETTER_H}px)`
      }

      // Lock / confirm logic — only after reel has spun at least once
      const stopped = hasSpunRef.current && rpm < STOP_RPM && velRef.current < 0.05

      if (stopped) {
        // Ease toward nearest letter
        const snap = Math.round(posRef.current)
        posRef.current += (snap - posRef.current) * 0.25

        lockRef.current += dt * 1000
        const frac = Math.min(1, lockRef.current / LOCK_MS)

        if (lockFillRef.current) {
          lockFillRef.current.style.width = `${frac * 100}%`
        }

        if (lockRef.current >= LOCK_MS) {
          const char    = letter(Math.round(posRef.current))
          const next    = [...confirmedRef.current, char]
          const nextReel = activeReelRef.current + 1

          confirmedRef.current  = next
          activeReelRef.current = nextReel

          // Reset for next reel
          posRef.current   = 0
          velRef.current   = 0
          lockRef.current  = 0
          hasSpunRef.current = false

          setConfirmed(next)
          setActiveReel(nextReel)

          if (nextReel >= 3) {
            setTimeout(() => onCompleteRef.current(next.join('')), 700)
            return
          }
        }
      } else {
        lockRef.current = 0
        if (lockFillRef.current) lockFillRef.current.style.width = '0%'
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [deviceId])

  const done = activeReel >= 3

  return (
    <div style={styles.root}>
      <div style={styles.reels}>
        {([0, 1, 2] as const).map((i) => {
          const isActive    = !done && i === activeReel
          const isConfirmed = i < activeReel || done

          return (
            <div
              key={i}
              style={{
                ...styles.reelWrap,
                ...(isActive    ? styles.reelWrapActive    : {}),
                ...(isConfirmed ? styles.reelWrapConfirmed : {}),
              }}
            >
              <div style={styles.viewport}>
                {/* Confirmed: show locked letter */}
                {isConfirmed && (
                  <div style={styles.confirmedLetter}>{confirmed[i] ?? ''}</div>
                )}

                {/* Active: scrolling strip */}
                {isActive && (
                  <>
                    <div ref={stripRef} style={styles.strip}>
                      {Array.from({ length: VISIBLE }, (_, j) => (
                        <div
                          key={j}
                          ref={(el) => { letterRefs.current[j] = el }}
                          style={{
                            ...styles.stripLetter,
                            fontSize: j === HALF ? 32 : 16,
                            color:    j === HALF ? C.yellow : C.dim,
                            opacity:  j === HALF ? 1 : 1 - Math.abs(j - HALF) * 0.3,
                          }}
                        >
                          {letter(j - HALF)}
                        </div>
                      ))}
                    </div>
                    {/* Centre highlight bar */}
                    <div style={styles.centerHighlight} />
                  </>
                )}

                {/* Inactive (future): placeholder */}
                {!isActive && !isConfirmed && (
                  <div style={styles.pendingChar}>—</div>
                )}
              </div>

              {/* Lock progress bar — only on active reel */}
              {isActive && (
                <div style={styles.lockTrack}>
                  <div ref={lockFillRef} style={styles.lockFill} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={styles.hint}>
        {done
          ? <span style={{ color: C.green }}>✓ LOCKED IN</span>
          : 'PEDAL TO SPIN   ·   STOP TO LOCK'}
      </div>

      <style>{reelCss}</style>
    </div>
  )
}

const reelCss = `
@keyframes reelConfirmFlash {
  0%,100% { box-shadow: 0 0 0 rgba(57,255,20,0); }
  40%     { box-shadow: 0 0 24px rgba(57,255,20,0.6); }
}
@keyframes reelActivePulse {
  0%,100% { border-color: #ff6b35; }
  50%     { border-color: #ffee10; }
}
`

const REEL_W  = 76
const VIEW_H  = VISIBLE * LETTER_H

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
  },

  reels: {
    display: 'flex', gap: 10,
  },

  reelWrap: {
    width: REEL_W,
    background: '#000',
    border: `3px solid ${C.borderDim}`,
    boxShadow: `3px 3px 0 ${C.black}`,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  reelWrapActive: {
    border: `3px solid ${C.orange}`,
    animation: 'reelActivePulse 1.4s ease-in-out infinite',
  },
  reelWrapConfirmed: {
    border: `3px solid ${C.green}`,
    animation: 'reelConfirmFlash 0.6s ease-out',
  },

  viewport: {
    width: REEL_W,
    height: VIEW_H,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  strip: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    display: 'flex', flexDirection: 'column',
  },
  stripLetter: {
    height: LETTER_H,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    letterSpacing: 2,
    textShadow: `2px 2px 0 #000`,
  },

  centerHighlight: {
    position: 'absolute',
    top: HALF * LETTER_H,
    left: 0, right: 0,
    height: LETTER_H,
    background: 'rgba(255,107,53,0.12)',
    borderTop: `1px solid ${C.orange}`,
    borderBottom: `1px solid ${C.orange}`,
    pointerEvents: 'none',
  },

  confirmedLetter: {
    fontSize: 36, color: C.green,
    letterSpacing: 2,
    textShadow: `3px 3px 0 #000, 0 0 20px rgba(57,255,20,0.4)`,
  },

  pendingChar: {
    fontSize: 24, color: C.muted,
  },

  lockTrack: {
    height: 4,
    background: C.bgLight,
    flexShrink: 0,
  },
  lockFill: {
    height: '100%',
    width: '0%',
    background: C.orange,
    transition: 'width 80ms linear',
  },

  hint: {
    fontSize: 7, color: C.muted,
    letterSpacing: 2,
    textAlign: 'center' as const,
  },
}
