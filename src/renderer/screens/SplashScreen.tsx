import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function SplashScreen(): React.ReactElement {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/menu'), 3000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div style={styles.container}>
      <div style={styles.logoWrap}>
        <div style={styles.logo}>
          <span style={styles.logoSeeker}>SEEKER</span>
          <span style={styles.logoCycle}>CYCLE</span>
        </div>
        <div style={styles.tagline}>REAL POWER · REAL RACE</div>
        <div style={styles.dots}>
          <span style={{ ...styles.dot, animationDelay: '0s' }} />
          <span style={{ ...styles.dot, animationDelay: '0.3s' }} />
          <span style={{ ...styles.dot, animationDelay: '0.6s' }} />
        </div>
      </div>
      <style>{dotAnim}</style>
    </div>
  )
}

const dotAnim = `
@keyframes pulse {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1.2); }
}
`

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse at center, #0d1117 0%, #0a0a0f 100%)'
  },
  logoWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24
  },
  logo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    lineHeight: 1
  },
  logoSeeker: {
    fontSize: 96,
    fontWeight: 900,
    letterSpacing: 24,
    color: '#ffffff',
    textShadow: '0 0 40px rgba(255,255,255,0.3)'
  },
  logoCycle: {
    fontSize: 40,
    fontWeight: 300,
    letterSpacing: 32,
    color: '#00d4ff',
    textShadow: '0 0 30px rgba(0,212,255,0.6)'
  },
  tagline: {
    fontSize: 14,
    letterSpacing: 8,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: 400
  },
  dots: {
    display: 'flex',
    gap: 12,
    marginTop: 16
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#00d4ff',
    display: 'inline-block',
    animation: 'pulse 1.4s ease-in-out infinite'
  }
}
