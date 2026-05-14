import React from 'react'
import type { RaceState } from '../../types'
import { RiderAvatar } from './RiderAvatar'

const PX_PER_METER = 3.2
const LEADER_X = 0.35 // leader sits at 35% of screen width

interface Props {
  race: RaceState
  windowWidth: number
}

export function RaceTrack({ race, windowWidth }: Props): React.ReactElement {
  const riders = Object.values(race.riders)
  const leaderPos = riders.reduce((max, r) => Math.max(max, r.positionMeters), 0)
  const leaderScreenX = windowWidth * LEADER_X

  const trackOffset = leaderPos * PX_PER_METER
  const finishLineX = leaderScreenX + (race.config.distanceMeters - leaderPos) * PX_PER_METER

  return (
    <div style={styles.track}>
      {/* Scrolling road */}
      <div
        style={{
          ...styles.road,
          backgroundPositionX: `-${trackOffset % 120}px`
        }}
      />

      {/* Ground line */}
      <div style={styles.groundLine} />

      {/* Distance markers */}
      {[250, 500, 750, 1000, 1250, 1500, 1750].map((m) => {
        const markerX = leaderScreenX + (m - leaderPos) * PX_PER_METER
        if (markerX < -100 || markerX > windowWidth + 100) return null
        return (
          <div key={m} style={{ ...styles.distanceMarker, left: markerX }}>
            <div style={styles.markerLine} />
            <span style={styles.markerLabel}>{m}m</span>
          </div>
        )
      })}

      {/* Finish line */}
      {finishLineX < windowWidth + 200 && (
        <div style={{ ...styles.finishLine, left: finishLineX }}>
          <div style={styles.finishLineBar} />
          <span style={styles.finishLabel}>FINISH</span>
        </div>
      )}

      {/* Riders */}
      {riders.map((rider) => {
        const riderX = leaderScreenX + (rider.positionMeters - leaderPos) * PX_PER_METER
        return (
          <RiderAvatar
            key={rider.deviceId}
            rider={rider}
            xPx={riderX}
            isLeader={rider.positionMeters === leaderPos}
            finishDistanceM={race.config.distanceMeters}
          />
        )
      })}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  track: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden'
  },
  road: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
    height: 120,
    background: `repeating-linear-gradient(
      90deg,
      rgba(255,255,255,0.03) 0px,
      rgba(255,255,255,0.03) 60px,
      transparent 60px,
      transparent 120px
    ), #1a1a2e`
  },
  groundLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 140,
    height: 2,
    background: 'rgba(255,255,255,0.15)'
  },
  distanceMarker: {
    position: 'absolute',
    bottom: 140,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transform: 'translateX(-50%)'
  },
  markerLine: {
    width: 1,
    height: 12,
    background: 'rgba(255,255,255,0.2)'
  },
  markerLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
    marginTop: 4,
    letterSpacing: 1
  },
  finishLine: {
    position: 'absolute',
    bottom: 80,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transform: 'translateX(-50%)'
  },
  finishLineBar: {
    width: 4,
    height: 200,
    background: `repeating-linear-gradient(
      180deg,
      #ffffff 0px, #ffffff 10px,
      #000000 10px, #000000 20px
    )`
  },
  finishLabel: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 900,
    letterSpacing: 4,
    marginTop: 8
  }
}
