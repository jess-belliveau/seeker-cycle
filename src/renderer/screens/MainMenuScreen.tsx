import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeviceStore } from '../store/deviceStore'
import { useSettingsStore } from '../store/settingsStore'
import { C, pixelBtn, sunsetBg } from '../theme'
import type { SessionResult } from '../types'

// ── Mode config ────────────────────────────────────────────────────────────────

interface ModeConfig {
  id:              string
  label:           string
  description:     string
  accent:          string
  lbPrimaryLabel:  string
  enabled:         boolean
}

const MODES: ModeConfig[] = [
  { id: 'race',         label: 'RACE',         description: 'FIRST TO FINISH WINS', accent: C.orange, lbPrimaryLabel: 'BEST TIME',    enabled: true  },
  { id: 'watts-battle', label: 'WATTS BATTLE', description: '15s POWER BATTLE',     accent: C.cyan,   lbPrimaryLabel: 'BEST AVG WATTS', enabled: true  },
  { id: 'endurance',    label: 'ENDURANCE',    description: 'HOLD TARGET POWER',    accent: C.purple, lbPrimaryLabel: '',              enabled: false },
  { id: 'sprint',       label: 'SPRINT',       description: 'MAX EFFORT INTERVALS', accent: C.pink,   lbPrimaryLabel: '',              enabled: false },
]

// ── Leaderboard building ───────────────────────────────────────────────────────

interface LBEntry {
  initials:   string
  primary:    string
  primaryRaw: number
  avgWatts:   number
  races:      number
}

function fmtTime(ms: number): string {
  const m  = Math.floor(ms / 60000)
  const s  = Math.floor((ms % 60000) / 1000)
  const cs = Math.floor((ms % 1000) / 10)
  return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}

function buildRaceLB(sessions: SessionResult[]): LBEntry[] {
  const map = new Map<string, { bestMs: number; wSum: number; count: number }>()
  for (const s of sessions) {
    if (s.config.distanceMeters <= 0) continue
    for (const r of s.riders) {
      if (r.finishTimeMs === null) continue
      const e = map.get(r.initials)
      if (!e) map.set(r.initials, { bestMs: r.finishTimeMs, wSum: r.avgWatts, count: 1 })
      else   { e.bestMs = Math.min(e.bestMs, r.finishTimeMs); e.wSum += r.avgWatts; e.count++ }
    }
  }
  return [...map.entries()]
    .map(([initials, d]) => ({
      initials, primary: fmtTime(d.bestMs), primaryRaw: d.bestMs,
      avgWatts: Math.round(d.wSum / d.count), races: d.count,
    }))
    .sort((a, b) => a.primaryRaw - b.primaryRaw)
    .slice(0, 8)
}

function buildBattleLB(sessions: SessionResult[]): LBEntry[] {
  const map = new Map<string, { bestW: number; count: number }>()
  for (const s of sessions) {
    if (s.config.distanceMeters > 0) continue
    for (const r of s.riders) {
      const e = map.get(r.initials)
      if (!e) map.set(r.initials, { bestW: r.avgWatts, count: 1 })
      else   { e.bestW = Math.max(e.bestW, r.avgWatts); e.count++ }
    }
  }
  return [...map.entries()]
    .map(([initials, d]) => ({
      initials, primary: `${Math.round(d.bestW)}W`, primaryRaw: d.bestW,
      avgWatts: Math.round(d.bestW), races: d.count,
    }))
    .sort((a, b) => b.primaryRaw - a.primaryRaw)
    .slice(0, 8)
}

function getEntries(modeId: string, sessions: SessionResult[]): LBEntry[] {
  if (modeId === 'race')         return buildRaceLB(sessions)
  if (modeId === 'watts-battle') return buildBattleLB(sessions)
  return []
}

// ── Medal helpers ──────────────────────────────────────────────────────────────

const MEDAL_COLORS = ['#ffd700', '#b8c4cc', '#cd7f32']
function medalColor(i: number): string { return i < 3 ? MEDAL_COLORS[i] : C.muted }

// ── Leaderboard panel ─────────────────────────────────────────────────────────

function LeaderboardPanel({ mode, entries, loading }: {
  mode:    ModeConfig
  entries: LBEntry[]
  loading: boolean
}): React.ReactElement {
  return (
    <div style={{ ...S.lbPanel, borderColor: mode.accent }}>
      <div style={{ ...S.lbHead, borderBottomColor: mode.accent + '50' }}>
        <span style={{ ...S.lbTitle, color: mode.accent }}>{mode.label}</span>
        <span style={S.lbSubtitle}>{mode.lbPrimaryLabel}</span>
      </div>

      {loading ? (
        <div style={S.lbEmpty}>LOADING...</div>
      ) : entries.length === 0 ? (
        <div style={S.lbEmpty}>{'NO RECORDS YET\nPLAY TO SET ONE!'}</div>
      ) : (
        <div style={S.lbList}>
          {entries.map((entry, i) => (
            <div
              key={entry.initials}
              style={{ ...S.lbRow, background: i === 0 ? `${mode.accent}18` : 'transparent' }}
            >
              <div style={S.lbRankWrap}>
                <span style={{ ...S.lbRank, color: medalColor(i) }}>{i + 1}</span>
              </div>
              <span style={{ ...S.lbInitials, color: i < 3 ? medalColor(i) : C.white }}>
                {entry.initials}
              </span>
              <span style={{ ...S.lbPrimary, color: i < 3 ? medalColor(i) : C.dim }}>
                {entry.primary}
              </span>
              <div style={S.lbMeta}>
                {mode.id === 'race' && (
                  <span style={S.lbMetaLine}>{entry.avgWatts}W avg</span>
                )}
                <span style={{ ...S.lbMetaLine, color: C.muted }}>×{entry.races}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Live device chip ───────────────────────────────────────────────────────────

function DeviceLiveChip({ deviceId, name }: { deviceId: string; name: string }): React.ReactElement {
  const reading = useDeviceStore((s) => s.liveReadings[deviceId])
  const w   = reading ? Math.round(reading.watts) : 0
  const rpm = reading ? Math.round(reading.rpm)   : 0
  return (
    <div style={S.liveChip}>
      <span style={S.liveChipName}>{name.slice(0, 14)}</span>
      <span style={{ ...S.liveChipVal, color: C.cyan }}>{w}W</span>
      <span style={{ ...S.liveChipVal, color: C.pink }}>{rpm}rpm</span>
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function MainMenuScreen(): React.ReactElement {
  const navigate = useNavigate()
  const { connected, isScanning } = useDeviceStore()
  const { adminMode, toggleAdminMode } = useSettingsStore()

  const connectedList = Object.values(connected).filter((d) => d.status === 'connected')
  const hasDevice     = connectedList.length > 0

  const [sessions, setSessions] = useState<SessionResult[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    window.api.data.loadSessions()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleModeClick(mode: ModeConfig): void {
    if (!mode.enabled) return
    if (hasDevice) {
      navigate('/character-select', { state: { destination: `/${mode.id}` } })
    } else {
      navigate('/devices', { state: { returnTo: `/${mode.id}` } })
    }
  }

  const enabledModes = MODES.filter((m) => m.enabled)

  return (
    <div style={{ ...S.container, ...sunsetBg }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={S.header}>
        <div style={S.logo}>
          <span style={S.logoSeeker}>SEEKER</span>
          <span style={S.logoCycle}>CYCLE</span>
        </div>
        <div style={S.headerMid}>
          <div style={S.ticker}>
            ★ CALIFORNIA GAMES EDITION ★ PEDAL HARD ★ RIDE FAST ★ &nbsp;★ CALIFORNIA GAMES EDITION ★ PEDAL HARD ★ RIDE FAST ★ &nbsp;
          </div>
        </div>
        <div style={S.headerRight}>
          <button style={S.devicesChip} onClick={() => navigate('/devices')}>
            {hasDevice
              ? <><span style={{ color: C.green }}>■</span>{' '}{connectedList.length} CONNECTED</>
              : <><span style={{ color: C.muted }}>○</span>{' '}CONNECT DEVICES</>
            }
            {isScanning && <span style={S.scanBlink} />}
          </button>
          <button style={{ ...pixelBtn(C.purple), ...S.headerBtn }} onClick={() => navigate('/splash')}>◀ INTRO</button>
          <button style={{ ...pixelBtn(C.pink),   ...S.headerBtn }} onClick={() => window.api.app.quit()}>■ QUIT</button>
        </div>
      </div>

      {/* ── Body: leaderboard columns ──────────────────────────────────────── */}
      <div style={S.body}>
        {enabledModes.map((mode) => (
          <LeaderboardPanel
            key={mode.id}
            mode={mode}
            entries={getEntries(mode.id, sessions)}
            loading={loading}
          />
        ))}
      </div>

      {/* ── Status strip ─────────────────────────────────────────────────── */}
      <div style={S.liveStrip}>
        {hasDevice ? (
          <>
            <span style={S.liveLabel}>◉ LIVE</span>
            {connectedList.map((d) => <DeviceLiveChip key={d.id} deviceId={d.id} name={d.name} />)}
          </>
        ) : (
          <span style={S.stripHint}>▼ SELECT A MODE BELOW TO START</span>
        )}
        <button
          style={{ ...S.adminBtn, ...(adminMode ? S.adminBtnOn : {}) }}
          onClick={toggleAdminMode}
        >
          ◈ ADMIN {adminMode ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* ── Mode bar ───────────────────────────────────────────────────────── */}
      <div style={S.modeBar}>
        {MODES.map((mode, i) => (
          <button
            key={mode.id}
            style={{
              ...S.modeBtn,
              borderRight: i < MODES.length - 1 ? `2px solid ${C.borderDim}` : 'none',
              ...(mode.enabled ? S.modeBtnOn : S.modeBtnOff),
              boxShadow: mode.enabled ? `inset 0 -5px 0 ${mode.accent}` : undefined,
            }}
            onClick={() => handleModeClick(mode)}
          >
            <span style={{ ...S.modeBtnLabel, color: mode.enabled ? mode.accent : C.muted }}>
              {mode.label}
            </span>
            <span style={S.modeBtnDesc}>{mode.description}</span>
            {!mode.enabled && <span style={S.lockTag}>LOCKED</span>}
          </button>
        ))}
      </div>

      <style>{css}</style>
    </div>
  )
}

const css = `
@keyframes tickerScroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes scanBlink {
  0%,49% { opacity: 1; } 50%,100% { opacity: 0; }
}
`

const S: Record<string, React.CSSProperties> = {
  container: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: "'Press Start 2P', monospace",
  },

  // ── Header ──
  header: {
    display: 'flex', alignItems: 'center',
    padding: '0 20px',
    height: 52, flexShrink: 0,
    background: '#000',
    borderBottom: `4px solid ${C.orange}`,
    gap: 16,
  },
  logo:      { display: 'flex', alignItems: 'baseline', gap: 10, flexShrink: 0 },
  logoSeeker:{ fontSize: 18, color: C.yellow, textShadow: `2px 2px 0 #000`, letterSpacing: 4 },
  logoCycle: { fontSize: 10, color: C.orange, textShadow: `2px 2px 0 #000`, letterSpacing: 6 },
  headerMid: { flex: 1, overflow: 'hidden' },
  ticker: {
    fontSize: 7, color: C.pink,
    textShadow: `1px 1px 0 #000`,
    whiteSpace: 'nowrap',
    animation: 'tickerScroll 18s linear infinite',
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  devicesChip: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '5px 12px',
    background: 'transparent',
    border: `2px solid ${C.cyan}`,
    color: C.cyan,
    fontSize: 7, letterSpacing: 1,
    fontFamily: "'Press Start 2P', monospace",
    cursor: 'pointer',
    boxShadow: `2px 2px 0 #000`,
  },
  scanBlink: {
    display: 'inline-block', width: 7, height: 7,
    background: C.cyan,
    animation: 'scanBlink 1s step-end infinite',
    marginLeft: 4,
  },
  headerBtn: { padding: '6px 12px', fontSize: 7, letterSpacing: 1 },

  // ── Body ──
  body: {
    flex: 1,
    display: 'flex', flexDirection: 'row',
    gap: 16, padding: '16px 20px',
    overflow: 'hidden', minHeight: 0,
  },

  // ── Leaderboard panel ──
  lbPanel: {
    flex: 1,
    display: 'flex', flexDirection: 'column',
    background: 'rgba(0,0,0,0.68)',
    border: '3px solid',
    boxShadow: `5px 5px 0 #000`,
    overflow: 'hidden',
  },
  lbHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 16px', flexShrink: 0,
    borderBottom: '2px solid',
  },
  lbTitle:   { fontSize: 12, letterSpacing: 3, textShadow: `2px 2px 0 #000` },
  lbSubtitle:{ fontSize: 6, color: C.dim, letterSpacing: 2 },

  lbList: { display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 },
  lbEmpty: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 7, color: C.muted,
    textAlign: 'center', lineHeight: 2.5, whiteSpace: 'pre',
  },
  lbRow: {
    display: 'flex', alignItems: 'center',
    padding: '11px 16px', gap: 12,
    borderBottom: `1px solid ${C.borderDim}`,
  },
  lbRankWrap: {
    width: 22, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  lbRank:    { fontSize: 10, fontVariantNumeric: 'tabular-nums' },
  lbInitials:{
    fontSize: 15, letterSpacing: 3,
    width: 56, flexShrink: 0,
    textShadow: `2px 2px 0 #000`,
  },
  lbPrimary: {
    flex: 1, fontSize: 18,
    fontVariantNumeric: 'tabular-nums',
    textShadow: `2px 2px 0 #000`,
  },
  lbMeta:    { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 },
  lbMetaLine:{ fontSize: 7, color: C.dim, letterSpacing: 1 },

  // ── Status strip ──
  liveStrip: {
    display: 'flex', alignItems: 'center',
    gap: 14, padding: '0 20px',
    height: 42, flexShrink: 0,
    background: 'rgba(0,0,0,0.60)',
    borderTop: `2px solid ${C.borderDim}`,
  },
  liveLabel: { fontSize: 7, color: C.green, letterSpacing: 2, flexShrink: 0 },
  liveChip: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '4px 10px',
    background: 'rgba(0,0,0,0.4)',
    border: `2px solid ${C.borderDim}`,
  },
  liveChipName: { fontSize: 6, color: C.dim },
  liveChipVal:  { fontSize: 9, textShadow: `1px 1px 0 #000`, fontVariantNumeric: 'tabular-nums' },
  stripHint: { fontSize: 7, color: C.dim, letterSpacing: 2 },
  adminBtn: {
    marginLeft: 'auto',
    padding: '5px 10px',
    background: 'transparent',
    border: `2px solid ${C.muted}`,
    color: C.muted,
    fontSize: 6, letterSpacing: 1,
    fontFamily: "'Press Start 2P', monospace",
    cursor: 'pointer',
  },
  adminBtnOn: { border: `2px solid ${C.green}`, color: C.green },

  // ── Mode bar ──
  modeBar: {
    display: 'flex',
    height: 76, flexShrink: 0,
    background: '#000',
    borderTop: `4px solid ${C.orange}`,
  },
  modeBtn: {
    flex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 7, padding: '0 12px',
    border: 'none',
    fontFamily: "'Press Start 2P', monospace",
    position: 'relative',
    cursor: 'pointer',
  },
  modeBtnOn:  { background: 'rgba(255,255,255,0.03)' },
  modeBtnOff: { background: 'transparent', cursor: 'default', opacity: 0.40 },
  modeBtnLabel: { fontSize: 11, letterSpacing: 2, textShadow: `2px 2px 0 #000` },
  modeBtnDesc:  { fontSize: 6, color: C.dim, letterSpacing: 1 },
  lockTag: {
    position: 'absolute', top: 6, right: 10,
    fontSize: 5, color: C.purple, letterSpacing: 1,
    border: `2px solid ${C.purple}`, padding: '2px 4px',
  },
}
