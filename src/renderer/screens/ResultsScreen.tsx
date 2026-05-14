import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { SessionResult, LeaderboardEntry } from '../types'
import { C, pixelBtn, pixelBox, sunsetBg } from '../theme'

const RIDER_COLORS = [
  C.pink, C.orange, C.yellow, C.green,
  C.cyan, C.purple, '#ff8c00', C.white,
]

function fmt(ms: number | null): string {
  if (ms === null) return 'DNF'
  const m  = Math.floor(ms / 60000)
  const s  = Math.floor((ms % 60000) / 1000)
  const cs = Math.floor((ms % 1000) / 10)
  return `${m}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`
}

export function ResultsScreen(): React.ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  const result: SessionResult | undefined = (location.state as { result?: SessionResult })?.result
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [tab, setTab] = useState<'session' | 'alltime'>('session')
  const savedRef = useRef(false)

  useEffect(() => {
    if (!result || savedRef.current) return
    savedRef.current = true
    window.api.data.saveSession(result).catch(console.error)
    window.api.data.loadLeaderboard()
      .then(setLeaderboard)
      .catch(console.error)
  }, [result])

  if (!result) {
    return (
      <div style={{ ...styles.container, ...sunsetBg }}>
        <div style={styles.noData}>NO RACE DATA</div>
        <button style={{ ...pixelBtn(C.orange), padding: '12px 24px', fontSize: 9 }}
          onClick={() => navigate('/menu')}>MENU</button>
      </div>
    )
  }

  const sorted = [...result.riders].sort((a, b) => a.rank - b.rank)
  const podium = sorted.slice(0, 3)

  return (
    <div style={{ ...styles.container, ...sunsetBg }}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>RACE OVER!</div>
        <div style={styles.date}>{new Date(result.date).toLocaleDateString()}</div>
      </div>

      {/* Podium */}
      <div style={styles.podiumRow}>
        {([1, 0, 2] as const).map((idx) => {
          const rider = podium[idx]
          if (!rider) return <div key={idx} style={{ width: 140 }} />
          const color = RIDER_COLORS[rider.avatarIndex % RIDER_COLORS.length]
          const heights = [90, 130, 72]
          const podiumColors = [C.yellow, C.white, C.amber]
          return (
            <div key={idx} style={styles.podiumSlot}>
              <div style={{ ...styles.podiumInitials, color }}>{rider.initials}</div>
              <div style={{ ...styles.podiumTime, color: C.cyan }}>{fmt(rider.finishTimeMs)}</div>
              <div style={{
                ...styles.podiumBlock,
                height: heights[idx],
                background: color,
                boxShadow: `4px 4px 0 ${C.black}`,
              }}>
                <span style={{ ...styles.podiumRankNum, color: podiumColors[idx] }}>
                  {rider.rank}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {(['session', 'alltime'] as const).map((t) => (
          <button key={t}
            style={{
              ...styles.tab,
              ...(tab === t ? styles.tabActive : {}),
            }}
            onClick={() => setTab(t)}
          >
            {t === 'session' ? 'THIS RACE' : 'ALL TIME'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={styles.tableWrap}>
        {tab === 'session'
          ? <SessionTable riders={sorted} />
          : <LeaderboardTable entries={leaderboard} />}
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button style={{ ...pixelBtn(C.dim), ...styles.actionBtn }}
          onClick={() => navigate('/menu')}>MENU</button>
        <button style={{ ...pixelBtn(C.green), ...styles.actionBtn }}
          onClick={() => navigate('/devices')}>RACE AGAIN ▶</button>
      </div>
    </div>
  )
}

function SessionTable({ riders }: { riders: SessionResult['riders'] }): React.ReactElement {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          {['#','RIDER','TIME','AVG W','MAX W','RPM'].map((h) => (
            <th key={h} style={styles.th}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {riders.map((r) => (
          <tr key={r.initials} style={styles.tr}>
            <td style={styles.td}>{r.rank}</td>
            <td style={{ ...styles.td, ...styles.tdName, color: RIDER_COLORS[r.avatarIndex % 8] }}>
              {r.initials}
            </td>
            <td style={{ ...styles.td, color: C.cyan }}>{fmt(r.finishTimeMs)}</td>
            <td style={styles.td}>{Math.round(r.avgWatts)}W</td>
            <td style={styles.td}>{Math.round(r.maxWatts)}W</td>
            <td style={styles.td}>{Math.round(r.avgRpm)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }): React.ReactElement {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          {['#','RIDER','BEST','RACES','AVG W','DATE'].map((h) => (
            <th key={h} style={styles.th}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {entries.map((e, i) => (
          <tr key={e.initials} style={styles.tr}>
            <td style={{ ...styles.td, color: i === 0 ? C.yellow : C.dim }}>{i + 1}</td>
            <td style={{ ...styles.td, ...styles.tdName }}>{e.initials}</td>
            <td style={{ ...styles.td, color: C.cyan }}>{fmt(e.bestFinishTimeMs)}</td>
            <td style={styles.td}>{e.totalRaces}</td>
            <td style={styles.td}>{Math.round(e.avgWatts)}W</td>
            <td style={styles.td}>{new Date(e.date).toLocaleDateString()}</td>
          </tr>
        ))}
        {entries.length === 0 && (
          <tr><td colSpan={6} style={{ ...styles.td, color: C.muted, textAlign: 'center' }}>
            NO RECORDS
          </td></tr>
        )}
      </tbody>
    </table>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 24px',
    background: '#000',
    borderBottom: `4px solid ${C.orange}`,
    flexShrink: 0,
  },
  title: {
    fontSize: 18, color: C.yellow,
    textShadow: `3px 3px 0 ${C.black}`,
    letterSpacing: 4,
    animation: 'blink 1s step-end infinite',
  },
  date: { fontSize: 8, color: C.dim },

  podiumRow: {
    display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
    gap: 8, padding: '16px 0 0',
    flexShrink: 0,
  },
  podiumSlot: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 4, width: 130,
  },
  podiumInitials: {
    fontSize: 20, letterSpacing: 4,
    textShadow: `2px 2px 0 ${C.black}`,
  },
  podiumTime: { fontSize: 9, fontVariantNumeric: 'tabular-nums' },
  podiumBlock: {
    width: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  podiumRankNum: {
    fontSize: 40, fontFamily: "'Press Start 2P', monospace",
    textShadow: `3px 3px 0 rgba(0,0,0,0.4)`,
  },

  tabs: {
    display: 'flex', gap: 0,
    borderTop: `3px solid ${C.borderDim}`,
    borderBottom: `3px solid ${C.orange}`,
    flexShrink: 0,
  },
  tab: {
    padding: '10px 24px', fontSize: 8, letterSpacing: 2,
    background: 'transparent', border: 'none',
    color: C.dim, cursor: 'pointer',
    borderRight: `2px solid ${C.borderDim}`,
  },
  tabActive: {
    background: C.bgMid, color: C.yellow,
    textShadow: `1px 1px 0 ${C.black}`,
  },

  tableWrap: { flex: 1, overflowY: 'auto', padding: '0 8px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '8px 12px', textAlign: 'left',
    fontSize: 7, letterSpacing: 2, color: C.orange,
    borderBottom: `2px solid ${C.borderDim}`,
  },
  tr: { borderBottom: `2px solid ${C.bgLight}` },
  td: {
    padding: '10px 12px', fontSize: 9, color: C.white,
    fontVariantNumeric: 'tabular-nums',
  },
  tdName: { fontSize: 12, letterSpacing: 3, textShadow: `1px 1px 0 ${C.black}` },

  actions: {
    display: 'flex', justifyContent: 'flex-end', gap: 12,
    padding: '12px 20px',
    background: '#000', borderTop: `4px solid ${C.orange}`,
    flexShrink: 0,
  },
  actionBtn: { padding: '12px 24px', fontSize: 9, letterSpacing: 2 },
  noData: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, color: C.muted },
}
