import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { SessionResult, LeaderboardEntry } from '../types'

const RIDER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#00d4ff', '#a855f7', '#ec4899', '#ffffff'
]

function formatTime(ms: number | null): string {
  if (ms === null) return 'DNF'
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  const ms2 = Math.floor((ms % 1000) / 10)
  return `${m}:${String(s).padStart(2, '0')}.${String(ms2).padStart(2, '0')}`
}

export function ResultsScreen(): React.ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  const result: SessionResult | undefined = (location.state as { result?: SessionResult })?.result
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [tab, setTab] = useState<'session' | 'alltime'>('session')

  useEffect(() => {
    if (!result) return
    window.api.data.saveSession(result).catch(console.error)
    window.api.data.loadLeaderboard().then(setLeaderboard).catch(console.error)
  }, [result])

  if (!result) {
    return (
      <div style={styles.container}>
        <div style={styles.noData}>No race data</div>
        <button style={styles.btn} onClick={() => navigate('/menu')}>MENU</button>
      </div>
    )
  }

  const sorted = [...result.riders].sort((a, b) => a.rank - b.rank)
  const podium = sorted.slice(0, 3)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>RACE RESULTS</div>
        <div style={styles.date}>{new Date(result.date).toLocaleDateString()}</div>
      </div>

      {/* Podium */}
      <div style={styles.podium}>
        {[1, 0, 2].map((idx) => {
          const rider = podium[idx]
          if (!rider) return <div key={idx} style={styles.podiumSlot} />
          const color = RIDER_COLORS[rider.avatarIndex % RIDER_COLORS.length]
          const heights = [100, 140, 80]
          return (
            <div key={idx} style={styles.podiumSlot}>
              <div style={styles.podiumInitials}>{rider.initials}</div>
              <div style={styles.podiumTime}>{formatTime(rider.finishTimeMs)}</div>
              <div
                style={{
                  ...styles.podiumBlock,
                  height: heights[idx],
                  background: color,
                  opacity: 0.85
                }}
              >
                <span style={styles.podiumRank}>{rider.rank}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(tab === 'session' ? styles.tabActive : {}) }}
          onClick={() => setTab('session')}
        >
          THIS RACE
        </button>
        <button
          style={{ ...styles.tab, ...(tab === 'alltime' ? styles.tabActive : {}) }}
          onClick={() => setTab('alltime')}
        >
          ALL TIME
        </button>
      </div>

      {/* Table */}
      <div style={styles.tableWrap}>
        {tab === 'session' ? (
          <SessionTable riders={sorted} />
        ) : (
          <LeaderboardTable entries={leaderboard} />
        )}
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button style={styles.btn} onClick={() => navigate('/menu')}>MAIN MENU</button>
        <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => navigate('/devices')}>
          RACE AGAIN ▶
        </button>
      </div>
    </div>
  )
}

function SessionTable({ riders }: { riders: SessionResult['riders'] }): React.ReactElement {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          {['#', 'RIDER', 'TIME', 'AVG W', 'MAX W', 'AVG RPM'].map((h) => (
            <th key={h} style={styles.th}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {riders.map((r) => (
          <tr key={r.initials} style={styles.tr}>
            <td style={styles.td}>{r.rank}</td>
            <td style={{ ...styles.td, ...styles.tdInitials }}>{r.initials}</td>
            <td style={styles.td}>{formatTime(r.finishTimeMs)}</td>
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
          {['#', 'RIDER', 'BEST TIME', 'RACES', 'AVG W', 'DATE'].map((h) => (
            <th key={h} style={styles.th}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {entries.map((e, i) => (
          <tr key={e.initials} style={styles.tr}>
            <td style={styles.td}>{i + 1}</td>
            <td style={{ ...styles.td, ...styles.tdInitials }}>{e.initials}</td>
            <td style={styles.td}>{formatTime(e.bestFinishTimeMs)}</td>
            <td style={styles.td}>{e.totalRaces}</td>
            <td style={styles.td}>{Math.round(e.avgWatts)}W</td>
            <td style={styles.td}>{new Date(e.date).toLocaleDateString()}</td>
          </tr>
        ))}
        {entries.length === 0 && (
          <tr>
            <td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: 'rgba(255,255,255,0.25)' }}>
              No records yet
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(160deg, #0d1117 0%, #0a0a0f 100%)',
    padding: '32px 60px',
    gap: 24,
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: 8,
    color: '#ffffff'
  },
  date: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 2
  },
  podium: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 16,
    height: 200
  },
  podiumSlot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    width: 120
  },
  podiumInitials: {
    fontSize: 24,
    fontWeight: 900,
    color: '#ffffff',
    letterSpacing: 4
  },
  podiumTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    fontVariantNumeric: 'tabular-nums'
  },
  podiumBlock: {
    width: '100%',
    borderRadius: '8px 8px 0 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  podiumRank: {
    fontSize: 48,
    fontWeight: 900,
    color: 'rgba(0,0,0,0.4)'
  },
  tabs: {
    display: 'flex',
    gap: 2,
    borderBottom: '1px solid rgba(255,255,255,0.07)'
  },
  tab: {
    padding: '10px 24px',
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 3,
    cursor: 'pointer'
  },
  tabActive: {
    color: '#ffffff',
    borderBottom: '2px solid #00d4ff'
  },
  tableWrap: {
    flex: 1,
    overflowY: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '8px 16px',
    textAlign: 'left',
    fontSize: 10,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: 700,
    borderBottom: '1px solid rgba(255,255,255,0.07)'
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.04)'
  },
  td: {
    padding: '12px 16px',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontVariantNumeric: 'tabular-nums'
  },
  tdInitials: {
    fontSize: 18,
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: 3
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 16
  },
  btn: {
    padding: '12px 32px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 3,
    cursor: 'pointer'
  },
  btnPrimary: {
    background: 'rgba(0,212,255,0.15)',
    border: '1px solid rgba(0,212,255,0.4)',
    color: '#00d4ff'
  },
  noData: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.25)'
  }
}
