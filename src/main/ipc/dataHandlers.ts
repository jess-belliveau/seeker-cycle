import type { IpcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/channels'
import { saveSession, loadSessions, loadLeaderboard } from '../persistence/store'
import type { SessionResult } from '../../shared/types'

export function registerDataHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(IPC_CHANNELS.DATA_SAVE_SESSION, (_event, result: SessionResult) =>
    saveSession(result)
  )
  ipcMain.handle(IPC_CHANNELS.DATA_LOAD_SESSIONS, () => loadSessions())
  ipcMain.handle(IPC_CHANNELS.DATA_LOAD_LEADERBOARD, () => loadLeaderboard())
}
