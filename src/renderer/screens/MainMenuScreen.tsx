import React from 'react'
import { useNavigate } from 'react-router-dom'

interface GameMode {
  id: string
  label: string
  description: string
  enabled: boolean
}

const GAME_MODES: GameMode[] = [
  { id: 'race', label: 'RACE', description: 'First to the finish line wins', enabled: true },
  { id: 'endurance', label: 'ENDURANCE', description: 'Sustain target power — coming soon', enabled: false },
  { id: 'sprint', label: 'SPRINT INTERVALS', description: 'Max effort intervals — coming soon', enabled: false },
  { id: 'team', label: 'TEAM RELAY', description: 'Tag-team racing — coming soon', enabled: false }
]

export function MainMenuScreen(): React.ReactElement {
  const navigate = useNavigate()

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>
          <span style={styles.titleSeeker}>SEEKER</span>
          <span style={styles.titleCycle}>CYCLE</span>
        </div>
        <div style={styles.subtitle}>SELECT GAME MODE</div>
      </div>

      <div style={styles.modeGrid}>
        {GAME_MODES.map((mode) => (
          <button
            key={mode.id}
            style={{
              ...styles.modeCard,
              ...(mode.enabled ? styles.modeCardEnabled : styles.modeCardDisabled)
            }}
            onClick={() => mode.enabled && navigate('/devices')}
            disabled={!mode.enabled}
          >
            {!mode.enabled && <span style={styles.comingSoon}>COMING SOON</span>}
            <span style={styles.modeLabel}>{mode.label}</span>
            <span style={styles.modeDesc}>{mode.description}</span>
            {mode.enabled && <span style={styles.selectArrow}>▶ SELECT</span>}
          </button>
        ))}
      </div>

      <div style={styles.footer}>
        <div style={styles.footerText}>Connect your bike trainer and get ready to race</div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '48px 80px',
    background: 'linear-gradient(160deg, #0d1117 0%, #0a0a0f 60%, #060810 100%)'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8
  },
  title: {
    display: 'flex',
    gap: 16,
    alignItems: 'baseline'
  },
  titleSeeker: {
    fontSize: 48,
    fontWeight: 900,
    letterSpacing: 12,
    color: '#ffffff'
  },
  titleCycle: {
    fontSize: 24,
    fontWeight: 300,
    letterSpacing: 16,
    color: '#00d4ff'
  },
  subtitle: {
    fontSize: 12,
    letterSpacing: 8,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 8
  },
  modeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 24,
    width: '100%',
    maxWidth: 900
  },
  modeCard: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    padding: '32px 40px',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left'
  },
  modeCardEnabled: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(0,212,255,0.3)',
    cursor: 'pointer',
    outline: 'none'
  },
  modeCardDisabled: {
    background: 'rgba(255,255,255,0.015)',
    border: '1px solid rgba(255,255,255,0.06)',
    opacity: 0.45,
    cursor: 'default',
    outline: 'none'
  },
  comingSoon: {
    position: 'absolute',
    top: 12,
    right: 16,
    fontSize: 10,
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: 600
  },
  modeLabel: {
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: 4,
    color: '#ffffff'
  },
  modeDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5
  },
  selectArrow: {
    marginTop: 8,
    fontSize: 12,
    letterSpacing: 4,
    color: '#00d4ff',
    fontWeight: 700
  },
  footer: {
    textAlign: 'center'
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 1
  }
}
