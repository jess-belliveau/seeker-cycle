export const IPC_CHANNELS = {
  // Renderer → Main (invoke/handle)
  BLE_START_SCAN: 'ble:start-scan',
  BLE_STOP_SCAN: 'ble:stop-scan',
  BLE_CONNECT: 'ble:connect',
  BLE_DISCONNECT: 'ble:disconnect',
  DATA_SAVE_SESSION: 'data:save-session',
  DATA_LOAD_SESSIONS: 'data:load-sessions',
  DATA_LOAD_LEADERBOARD: 'data:load-leaderboard',

  // Main → Renderer (send/on)
  BLE_DEVICE_DISCOVERED: 'ble:device-discovered',
  BLE_DEVICE_STATUS_CHANGED: 'ble:device-status-changed',
  BLE_TRAINER_READING: 'ble:trainer-reading',

  // App
  APP_QUIT: 'app:quit',
  DEBUG_SET_VERBOSE: 'debug:set-verbose',
} as const
