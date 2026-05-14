import { app } from 'electron'
import { join } from 'path'
import { readFile, writeFile, mkdir, rename } from 'fs/promises'
import type { SessionResult, LeaderboardEntry, RiderSessionResult } from '../../shared/types'

function dataDir(): string {
  return join(app.getPath('userData'), 'seeker-cycle-data')
}
function sessionsFile(): string {
  return join(dataDir(), 'sessions.json')
}
function leaderboardFile(): string {
  return join(dataDir(), 'leaderboard.json')
}

async function ensureDataDir(): Promise<void> {
  await mkdir(dataDir(), { recursive: true })
}

async function readJSON<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

async function writeJSON<T>(filePath: string, data: T): Promise<void> {
  const tmp = filePath + '.tmp'
  await writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8')
  await rename(tmp, filePath)
}

export async function saveSession(result: SessionResult): Promise<void> {
  await ensureDataDir()
  const sessions = await readJSON<SessionResult[]>(sessionsFile(), [])
  sessions.push(result)
  await writeJSON(sessionsFile(), sessions)
  await updateLeaderboard(result)
}

export async function loadSessions(): Promise<SessionResult[]> {
  await ensureDataDir()
  return readJSON<SessionResult[]>(sessionsFile(), [])
}

export async function loadLeaderboard(): Promise<LeaderboardEntry[]> {
  await ensureDataDir()
  return readJSON<LeaderboardEntry[]>(leaderboardFile(), [])
}

async function updateLeaderboard(result: SessionResult): Promise<void> {
  const board = await readJSON<LeaderboardEntry[]>(leaderboardFile(), [])
  const byInitials = new Map(board.map((e) => [e.initials, e]))

  for (const rider of result.riders) {
    if (!rider.initials) continue
    const existing = byInitials.get(rider.initials)

    if (existing) {
      const newBest =
        rider.finishTimeMs !== null &&
        (existing.bestFinishTimeMs === null ||
          rider.finishTimeMs < existing.bestFinishTimeMs)
          ? rider.finishTimeMs
          : existing.bestFinishTimeMs

      const totalRaces = existing.totalRaces + 1
      const avgWatts =
        (existing.avgWatts * existing.totalRaces + rider.avgWatts) / totalRaces

      byInitials.set(rider.initials, {
        ...existing,
        bestFinishTimeMs: newBest,
        totalRaces,
        avgWatts,
        date: newBest !== existing.bestFinishTimeMs ? result.date : existing.date
      })
    } else {
      byInitials.set(rider.initials, {
        initials: rider.initials,
        bestFinishTimeMs: rider.finishTimeMs,
        totalRaces: 1,
        avgWatts: rider.avgWatts,
        date: result.date
      })
    }
  }

  const sorted = Array.from(byInitials.values()).sort((a, b) => {
    if (a.bestFinishTimeMs === null) return 1
    if (b.bestFinishTimeMs === null) return -1
    return a.bestFinishTimeMs - b.bestFinishTimeMs
  })

  await writeJSON(leaderboardFile(), sorted)
}

// Keep RiderSessionResult import satisfied (used in updateLeaderboard via result.riders)
export type { RiderSessionResult }
