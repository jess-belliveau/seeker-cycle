import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, sunsetBg } from '../theme'

export function SplashScreen(): React.ReactElement {
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (): void => navigate('/menu')
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

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
        <div style={styles.presents}>★ EPYX SOFT ★ PRESENTS ★</div>

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
          <span style={styles.editionInner}>CALIFORNIA GAMES EDITION</span>
        </div>

        {/* Press any key */}
        <div style={styles.pressKey}>
          <span style={styles.pressKeyText}>PRESS ANY KEY</span>
          <span style={styles.cursor} />
        </div>

        {/* Copyright */}
        <div style={styles.copyright}>© 2025 SEEKER LABS · ALL RIGHTS RESERVED</div>
      </div>

      <style>{css}</style>
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
}
