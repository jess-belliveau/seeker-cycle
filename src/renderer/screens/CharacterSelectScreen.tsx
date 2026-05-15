import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDeviceStore } from '../store/deviceStore'
import { C, pixelBtn, sunsetBg } from '../theme'

// ─── Character definitions ───────────────────────────────────────────────────

interface Character {
  name: string
  subtitle: string
  color: string
  spd: number
  pwr: number
  end: number
}

const CHARACTERS: Character[] = [
  { name: 'VIPER',  subtitle: 'SPEED DEMON',     color: C.pink,    spd: 9, pwr: 6,  end: 7 },
  { name: 'BLAZE',  subtitle: 'POWER HOUSE',      color: C.orange,  spd: 6, pwr: 10, end: 7 },
  { name: 'STORM',  subtitle: 'ALL-ROUNDER',      color: C.yellow,  spd: 8, pwr: 8,  end: 8 },
  { name: 'JADE',   subtitle: 'ENDURANCE KING',   color: C.green,   spd: 7, pwr: 6,  end: 10 },
  { name: 'FROST',  subtitle: 'SMOOTH OPERATOR',  color: C.cyan,    spd: 8, pwr: 7,  end: 9 },
  { name: 'NOVA',   subtitle: 'SPRINT MACHINE',   color: C.purple,  spd: 9, pwr: 8,  end: 6 },
  { name: 'EMBER',  subtitle: 'BREAKAWAY ARTIST', color: '#ff8c00', spd: 7, pwr: 9,  end: 8 },
  { name: 'GHOST',  subtitle: 'MYSTERY RIDER',    color: C.white,   spd: 9, pwr: 7,  end: 7 },
]

const PLAYER_COLORS = [C.cyan, C.pink, C.yellow, C.green, C.orange, C.purple, '#ff8c00', C.white]

// ─── Sub-components ──────────────────────────────────────────────────────────

interface CharacterPortraitProps {
  color: string
  idx: number
  scale?: number
}

function CharacterPortrait({ color, idx, scale = 1 }: CharacterPortraitProps): React.ReactElement {
  const w = 48 * scale
  const h = 64 * scale
  const stripe = idx % 2 === 0

  return (
    <svg
      viewBox="0 0 48 64"
      width={w}
      height={h}
      style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }}
    >
      {/* Helmet */}
      <rect x="12" y="4"  width="24" height="20" fill={color} />
      <rect x="10" y="8"  width="28" height="14" fill={color} />
      {/* Helmet shading */}
      <rect x="12" y="4"  width="24" height="4"  fill="rgba(255,255,255,0.18)" />
      <rect x="32" y="8"  width="6"  height="12" fill="rgba(0,0,0,0.22)" />
      {/* Visor */}
      <rect x="12" y="14" width="24" height="8"  fill="#111133" />
      <rect x="14" y="15" width="20" height="3"  fill="rgba(100,160,255,0.35)" />
      {/* Face */}
      <rect x="14" y="22" width="20" height="10" fill="#f0b87a" />
      {/* Jersey */}
      <rect x="10" y="32" width="28" height="22" fill={color} />
      {stripe
        ? <rect x="10" y="36" width="28" height="4" fill="rgba(255,255,255,0.15)" />
        : <rect x="18" y="32" width="12" height="22" fill="rgba(0,0,0,0.12)" />
      }
      {/* Arms */}
      <rect x="4"  y="32" width="6"  height="16" fill={color} />
      <rect x="38" y="32" width="6"  height="16" fill={color} />
      {/* Gloves */}
      <rect x="4"  y="46" width="6"  height="6"  fill="#1a1a1a" />
      <rect x="38" y="46" width="6"  height="6"  fill="#1a1a1a" />
      {/* Legs */}
      <rect x="14" y="54" width="8"  height="8"  fill="#1a1a1a" />
      <rect x="26" y="54" width="8"  height="8"  fill="#1a1a1a" />
    </svg>
  )
}

interface StatBarProps {
  label: string
  value: number
  color: string
}

function StatBar({ label, value, color }: StatBarProps): React.ReactElement {
  return (
    <div style={styles.statRow}>
      <span style={styles.statLabel}>{label}</span>
      <div style={styles.statBlocks}>
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            style={{
              ...styles.statBlock,
              background: i < value ? color : C.bgLight,
              boxShadow: i < value ? `0 0 4px ${color}` : 'none',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── TypeInitials inline component ───────────────────────────────────────────

interface TypeInitialsProps {
  slotIdx: number
  onComplete: (initials: string) => void
}

function TypeInitials({ slotIdx, onComplete }: TypeInitialsProps): React.ReactElement {
  const [val, setVal] = useState('')
  return (
    <input
      key={`type-${slotIdx}`}
      autoFocus
      value={val}
      maxLength={3}
      style={styles.typeInput}
      onChange={(e) => {
        const clean = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
        setVal(clean)
        if (clean.length === 3) {
          onComplete(clean)
        }
      }}
      placeholder="___"
    />
  )
}

// ─── Slot model ───────────────────────────────────────────────────────────────

interface Slot {
  deviceId: string
  deviceName: string
  playerLabel: string
  charIdx: number | null
  initials: string
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function CharacterSelectScreen(): React.ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  const destination = (location.state as { destination?: string } | null)?.destination ?? '/race'
  const { connected, assignAvatar, assignInitials } = useDeviceStore()

  const connectedList = Object.values(connected).filter((d) => d.status === 'connected')

  const [slots, setSlots] = useState<Slot[]>(() =>
    connectedList.map((d, i) => ({
      deviceId: d.id,
      deviceName: d.name,
      playerLabel: `P${i + 1}`,
      charIdx: null,
      initials: '',
    }))
  )

  const [previewIdx, setPreviewIdx] = useState<number>(0)

  // Current slot = first slot where initials not yet complete
  const currentSlotIdx = slots.findIndex((s) => s.initials.length < 3)
  const currentSlot = currentSlotIdx >= 0 ? slots[currentSlotIdx] : null
  const allDone = currentSlotIdx === -1 && slots.length > 0

  // Map charIdx → playerLabel for taken characters
  const takenMap: Record<number, string> = {}
  slots.forEach((s) => {
    if (s.charIdx !== null) takenMap[s.charIdx] = s.playerLabel
  })

  function handleCharClick(charIdx: number): void {
    if (currentSlotIdx < 0) return
    // Can't take another player's confirmed character
    const takenBy = takenMap[charIdx]
    if (takenBy && takenBy !== currentSlot?.playerLabel) return

    setPreviewIdx(charIdx)
    setSlots((prev) =>
      prev.map((s, i) =>
        i === currentSlotIdx ? { ...s, charIdx } : s
      )
    )
  }

  function handleInitialsComplete(initials: string): void {
    setSlots((prev) =>
      prev.map((s, i) =>
        i === currentSlotIdx ? { ...s, initials } : s
      )
    )
  }

  function handleReset(slotIdx: number): void {
    setSlots((prev) =>
      prev.map((s, i) =>
        i === slotIdx ? { ...s, charIdx: null, initials: '' } : s
      )
    )
  }

  function handleFight(): void {
    slots.forEach((s) => {
      assignInitials(s.deviceId, s.initials)
      if (s.charIdx !== null) assignAvatar(s.deviceId, s.charIdx)
    })
    navigate(destination)
  }

  const previewChar = CHARACTERS[previewIdx]
  const previewSlot = slots.find((s) => s.charIdx === previewIdx)
  const previewColor = previewSlot
    ? PLAYER_COLORS[slots.indexOf(previewSlot) % PLAYER_COLORS.length]
    : previewChar.color

  return (
    <div style={{ ...styles.container, ...sunsetBg }}>

      {/* Header */}
      <div style={styles.header}>
        <button
          style={{ ...pixelBtn(C.dim), ...styles.backBtn }}
          onClick={() => navigate('/menu')}
        >
          ◀ BACK
        </button>
        <div style={styles.headerTitle}>SELECT YOUR FIGHTER</div>
        <div style={styles.playerChips}>
          {slots.map((s, i) => (
            <div
              key={s.deviceId}
              style={{
                ...styles.playerChip,
                borderColor: PLAYER_COLORS[i % PLAYER_COLORS.length],
                color: s.initials.length === 3
                  ? PLAYER_COLORS[i % PLAYER_COLORS.length]
                  : C.muted,
              }}
            >
              {s.playerLabel}: {s.initials.length === 3
                ? s.initials
                : s.charIdx !== null ? CHARACTERS[s.charIdx].name.slice(0, 5) : '???'}
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={styles.body}>

        {/* Left panel — preview */}
        <div style={styles.leftPanel}>
          <div style={styles.portraitWrap}>
            <CharacterPortrait color={previewChar.color} idx={previewIdx} scale={3} />
          </div>
          <div style={{
            ...styles.charName,
            color: previewChar.color,
            textShadow: `0 0 20px ${previewChar.color}, 3px 3px 0 ${C.black}`,
          }}>
            {previewChar.name}
          </div>
          <div style={styles.charSubtitle}>{previewChar.subtitle}</div>
          <div style={styles.statBars}>
            <StatBar label="SPD" value={previewChar.spd} color={C.cyan} />
            <StatBar label="PWR" value={previewChar.pwr} color={C.orange} />
            <StatBar label="END" value={previewChar.end} color={C.green} />
          </div>
        </div>

        {/* Right panel — grid */}
        <div style={styles.rightPanel}>
          <div style={styles.charGrid}>
            {CHARACTERS.map((char, idx) => {
              const takenByLabel = takenMap[idx]
              const takenByOther = takenByLabel &&
                takenByLabel !== currentSlot?.playerLabel
              const takenByCurrent = currentSlot &&
                slots[currentSlotIdx]?.charIdx === idx
              const slotColor = takenByLabel
                ? PLAYER_COLORS[slots.findIndex((s) => s.playerLabel === takenByLabel) % PLAYER_COLORS.length]
                : char.color

              return (
                <div
                  key={char.name}
                  style={{
                    ...styles.charCard,
                    borderColor: idx === previewIdx ? char.color : C.borderDim,
                    opacity: takenByOther ? 0.55 : 1,
                    pointerEvents: takenByOther ? 'none' : 'auto',
                    boxShadow: takenByCurrent
                      ? `0 0 12px ${char.color}, 4px 4px 0 ${C.black}`
                      : `4px 4px 0 ${C.black}`,
                    cursor: takenByOther ? 'default' : 'pointer',
                  }}
                  onMouseEnter={() => setPreviewIdx(idx)}
                  onClick={() => handleCharClick(idx)}
                >
                  {takenByCurrent && <div style={styles.selectFlash} />}
                  <CharacterPortrait color={char.color} idx={idx} scale={2} />
                  <div style={{ ...styles.cardName, color: char.color }}>{char.name}</div>
                  <div style={styles.cardSub}>{char.subtitle}</div>
                  {takenByLabel && (
                    <div style={{
                      ...styles.takenChip,
                      background: slotColor,
                    }}>
                      {takenByLabel}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Player status row below grid */}
          <div style={styles.slotStatusRow}>
            {slots.map((s, i) => (
              <div key={s.deviceId} style={styles.slotStatusItem}>
                <span style={{ color: PLAYER_COLORS[i % PLAYER_COLORS.length], fontSize: 8 }}>
                  {s.playerLabel}
                </span>
                <span style={{ fontSize: 7, color: C.dim, marginLeft: 6 }}>
                  {s.initials.length === 3
                    ? `${s.initials} ✓`
                    : s.charIdx !== null
                      ? `${CHARACTERS[s.charIdx].name} (initials...)`
                      : 'choosing...'}
                </span>
                {s.initials.length === 3 && (
                  <button
                    style={{ ...pixelBtn(C.muted), ...styles.resetBtn }}
                    onClick={() => handleReset(i)}
                  >
                    ↺
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prompt bar */}
      {currentSlot && (
        <div style={styles.promptBar}>
          {currentSlot.charIdx === null ? (
            <span style={styles.promptText}>
              <span style={{ color: PLAYER_COLORS[currentSlotIdx % PLAYER_COLORS.length] }}>
                {currentSlot.playerLabel}
              </span>
              {' '}({currentSlot.deviceName}) — CHOOSE YOUR FIGHTER
            </span>
          ) : (
            <div style={styles.promptInitialsRow}>
              <span style={styles.promptText}>
                <span style={{ color: PLAYER_COLORS[currentSlotIdx % PLAYER_COLORS.length] }}>
                  {currentSlot.playerLabel}
                </span>
                {' '}— ENTER INITIALS
              </span>
              <TypeInitials
                slotIdx={currentSlotIdx}
                onComplete={handleInitialsComplete}
              />
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.footerLeft}>
          {allDone && (
            <span style={styles.allReady}>ALL RIDERS READY!</span>
          )}
        </div>
        <button
          style={{
            ...pixelBtn(C.green),
            ...styles.fightBtn,
            ...(allDone ? styles.fightBtnActive : styles.fightBtnOff),
          }}
          disabled={!allDone}
          onClick={allDone ? handleFight : undefined}
        >
          RACE!
        </button>
      </div>

      <style>{css}</style>
    </div>
  )
}

const css = `
@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
@keyframes selectFlash {
  0%   { opacity: 0.7; }
  100% { opacity: 0; }
}
@keyframes fightPulse {
  0%,100% { box-shadow: 4px 4px 0 #000, 0 0 0px rgba(57,255,20,0); }
  50%     { box-shadow: 4px 4px 0 #000, 0 0 24px rgba(57,255,20,0.7); }
}
`

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },

  // Header
  header: {
    display: 'flex', alignItems: 'center',
    padding: '0 16px',
    height: 52,
    background: '#000',
    borderBottom: `4px solid ${C.orange}`,
    flexShrink: 0,
    gap: 12,
  },
  backBtn: { padding: '8px 12px', fontSize: 7, letterSpacing: 1, flexShrink: 0 },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 11, color: C.yellow,
    textShadow: `2px 2px 0 ${C.black}`,
    letterSpacing: 3,
    animation: 'blink 1s step-end infinite',
  },
  playerChips: {
    display: 'flex', gap: 8, flexShrink: 0,
  },
  playerChip: {
    fontSize: 7, letterSpacing: 1,
    border: `2px solid`,
    padding: '3px 6px',
  },

  // Body
  body: {
    flex: 1, display: 'flex', overflow: 'hidden',
  },

  // Left panel
  leftPanel: {
    width: 220,
    flexShrink: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '16px 12px',
    background: 'rgba(0,0,0,0.45)',
    borderRight: `3px solid ${C.borderDim}`,
    gap: 10,
    overflowY: 'auto',
  },
  portraitWrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '8px 0',
  },
  charName: {
    fontSize: 14, letterSpacing: 3,
    textAlign: 'center',
  },
  charSubtitle: {
    fontSize: 7, color: C.dim, letterSpacing: 2,
    textAlign: 'center',
  },
  statBars: {
    width: '100%', display: 'flex', flexDirection: 'column', gap: 8,
    marginTop: 8,
  },
  statRow: {
    display: 'flex', alignItems: 'center', gap: 8,
  },
  statLabel: {
    fontSize: 7, color: C.orange, letterSpacing: 1,
    width: 28, flexShrink: 0,
  },
  statBlocks: {
    display: 'flex', gap: 2, flex: 1,
  },
  statBlock: {
    width: 10, height: 10, flexShrink: 0,
  },

  // Right panel
  rightPanel: {
    flex: 1,
    display: 'flex', flexDirection: 'column',
    padding: '12px 16px',
    gap: 12,
    overflowY: 'auto',
  },
  charGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
    flex: 1,
  },
  charCard: {
    background: C.bgMid,
    border: `3px solid`,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '10px 8px',
    gap: 6,
    position: 'relative',
    overflow: 'hidden',
    transition: 'box-shadow 0.15s',
    userSelect: 'none',
  },
  cardName: {
    fontSize: 7, letterSpacing: 2,
    textShadow: `1px 1px 0 ${C.black}`,
  },
  cardSub: {
    fontSize: 5, color: C.dim, letterSpacing: 1,
    textAlign: 'center' as const,
  },
  takenChip: {
    position: 'absolute', top: 4, right: 4,
    fontSize: 6, color: C.black,
    padding: '2px 4px',
    fontFamily: "'Press Start 2P', monospace",
  },
  selectFlash: {
    position: 'absolute', inset: 0,
    background: 'rgba(255,255,255,0.6)',
    animation: 'selectFlash 0.5s ease-out forwards',
    pointerEvents: 'none',
  },

  // Slot status row
  slotStatusRow: {
    display: 'flex', gap: 16, flexWrap: 'wrap' as const,
    borderTop: `2px solid ${C.borderDim}`,
    paddingTop: 8,
  },
  slotStatusItem: {
    display: 'flex', alignItems: 'center', gap: 4,
  },
  resetBtn: {
    padding: '3px 7px', fontSize: 8, marginLeft: 6,
  },

  // Prompt bar
  promptBar: {
    flexShrink: 0,
    background: 'rgba(0,0,0,0.7)',
    borderTop: `3px solid ${C.cyan}`,
    padding: '10px 20px',
    display: 'flex', alignItems: 'center',
    minHeight: 56,
  },
  promptText: {
    fontSize: 8, color: C.white, letterSpacing: 2,
  },
  promptInitialsRow: {
    display: 'flex', alignItems: 'center', gap: 16, width: '100%',
  },
  typeInput: {
    background: '#0a0a14',
    border: `3px solid ${C.orange}`,
    boxShadow: `3px 3px 0 ${C.black}`,
    color: C.yellow,
    fontSize: 22,
    fontFamily: "'Press Start 2P', monospace",
    letterSpacing: 10,
    width: 120,
    textAlign: 'center' as const,
    outline: 'none',
    padding: '6px 8px',
  },

  // Footer
  footer: {
    flexShrink: 0,
    background: '#000',
    borderTop: `4px solid ${C.orange}`,
    padding: '12px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  footerLeft: {
    flex: 1,
  },
  allReady: {
    fontSize: 10, color: C.green,
    textShadow: `0 0 12px ${C.green}, 2px 2px 0 ${C.black}`,
    animation: 'blink 0.8s step-end infinite',
    letterSpacing: 2,
  },
  fightBtn: {
    padding: '14px 32px', fontSize: 12, letterSpacing: 4,
  },
  fightBtnActive: {
    animation: 'fightPulse 1s ease-in-out infinite',
  },
  fightBtnOff: {
    opacity: 0.3,
    cursor: 'default',
  },
}
