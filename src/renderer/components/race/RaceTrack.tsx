import React from 'react'
import type { RaceState } from '../../types'
import { RiderAvatar } from './RiderAvatar'
import { C } from '../../theme'

const PX_PER_METER = 3.2
const LEADER_X     = 0.35

interface Props {
  race: RaceState
  windowWidth: number
}

export function RaceTrack({ race, windowWidth }: Props): React.ReactElement {
  const riders      = Object.values(race.riders)
  const leaderPos   = riders.reduce((max, r) => Math.max(max, r.positionMeters), 0)
  const leaderX     = windowWidth * LEADER_X
  const trackOffset = (leaderPos * PX_PER_METER) % 128
  const finishX     = leaderX + (race.config.distanceMeters - leaderPos) * PX_PER_METER

  return (
    <div style={styles.track}>
      {/* Sky gradient */}
      <div style={styles.sky} />

      {/* Pixel sun */}
      <div style={styles.sun} />

      {/* Pixel mountains (static) */}
      <svg style={styles.mountains} viewBox="0 0 1920 160" preserveAspectRatio="none">
        <polygon points="0,160 280,40 560,160"   fill="#3d1c5e" />
        <polygon points="300,160 600,20 900,160"  fill="#2d1448" />
        <polygon points="700,160 1000,60 1300,160" fill="#3d1c5e" />
        <polygon points="1100,160 1400,30 1700,160" fill="#1a0a2e" />
        <polygon points="1500,160 1720,70 1920,160" fill="#2d1448" />
      </svg>

      {/* Scrolling road — pixel stripe pattern */}
      <div style={styles.roadWrap}>
        <div style={{
          ...styles.road,
          backgroundPositionX: `-${trackOffset}px`,
        }} />
      </div>

      {/* Road centre dashes */}
      <div style={{
        ...styles.centreDashes,
        backgroundPositionX: `-${trackOffset}px`,
      }} />

      {/* Ground */}
      <div style={styles.ground} />

      {/* Distance markers */}
      {[250, 500, 750, 1000, 1250, 1500, 1750].map((m) => {
        const mx = leaderX + (m - leaderPos) * PX_PER_METER
        if (mx < -60 || mx > windowWidth + 60) return null
        return (
          <div key={m} style={{ ...styles.marker, left: mx }}>
            <div style={styles.markerPole} />
            <div style={styles.markerFlag}>{m}M</div>
          </div>
        )
      })}

      {/* Finish line */}
      {finishX < windowWidth + 300 && (
        <div style={{ ...styles.finish, left: finishX }}>
          <div style={styles.finishPole} />
          <div style={styles.finishFlag}>FINISH!</div>
          <div style={styles.finishChecker} />
        </div>
      )}

      {/* Riders */}
      {riders.map((rider) => (
        <RiderAvatar
          key={rider.deviceId}
          rider={rider}
          xPx={leaderX + (rider.positionMeters - leaderPos) * PX_PER_METER}
          isLeader={rider.positionMeters === leaderPos}
          finishDistanceM={race.config.distanceMeters}
        />
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  track: { position: 'absolute', inset: 0, overflow: 'hidden' },

  sky: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 380,
    background: `linear-gradient(180deg,
      #0d0221 0%, #1a0a2e 30%, #3d1c5e 55%,
      #7b2d4e 70%, #c45c35 85%, #ff8c20 95%, #ffcc44 100%)`,
  },

  sun: {
    position: 'absolute', right: '15%', top: '8%',
    width: 80, height: 80,
    background: C.yellow,
    boxShadow: `0 0 0 10px ${C.amber}, 0 0 0 20px rgba(255,170,0,0.3)`,
  },

  mountains: {
    position: 'absolute', left: 0, right: 0, bottom: 380, height: 200,
    pointerEvents: 'none',
  },

  roadWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 120, height: 280, overflow: 'hidden',
  },
  road: {
    width: '100%', height: '100%',
    background: `repeating-linear-gradient(
      90deg,
      #2a1a0a 0px, #2a1a0a 64px,
      #1e1206 64px, #1e1206 128px
    )`,
  },

  centreDashes: {
    position: 'absolute', left: 0, right: 0, bottom: 258, height: 10,
    background: `repeating-linear-gradient(
      90deg,
      ${C.yellow} 0px, ${C.yellow} 48px,
      transparent 48px, transparent 96px
    )`,
  },

  ground: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 120,
    background: `repeating-linear-gradient(
      180deg,
      #3a6b00 0px, #3a6b00 8px,
      #2d5200 8px, #2d5200 16px
    )`,
    borderTop: `4px solid #5a9900`,
  },

  marker: {
    position: 'absolute', bottom: 380,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    transform: 'translateX(-50%)',
    pointerEvents: 'none',
  },
  markerPole: { width: 4, height: 40, background: C.white },
  markerFlag: {
    background: C.orange, color: C.black,
    fontSize: 6, padding: '2px 4px',
    fontFamily: "'Press Start 2P', monospace",
    boxShadow: `2px 2px 0 ${C.black}`,
    whiteSpace: 'nowrap',
  },

  finish: {
    position: 'absolute', bottom: 120,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    transform: 'translateX(-50%)',
    pointerEvents: 'none',
  },
  finishPole: { width: 8, height: 320, background: C.white, boxShadow: `3px 0 0 ${C.black}` },
  finishFlag: {
    position: 'absolute', top: -4, left: 8,
    background: C.pink, color: C.black,
    fontSize: 10, padding: '4px 10px',
    fontFamily: "'Press Start 2P', monospace",
    boxShadow: `3px 3px 0 ${C.black}`,
    whiteSpace: 'nowrap',
    animation: 'blink 0.4s step-end infinite',
  },
  finishChecker: {
    position: 'absolute', bottom: 0, left: 0,
    width: 8, height: 320,
    background: `repeating-linear-gradient(
      180deg,
      #fff 0px,#fff 16px,#000 16px,#000 32px
    )`,
  },
}
