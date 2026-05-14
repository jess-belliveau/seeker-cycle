import React from 'react'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useBLEDeviceSync } from './hooks/useBLE'
import { SplashScreen } from './screens/SplashScreen'
import { MainMenuScreen } from './screens/MainMenuScreen'
import { DevicesScreen } from './screens/DevicesScreen'
import { CharacterSelectScreen } from './screens/CharacterSelectScreen'
import { RaceScreen } from './screens/RaceScreen'
import { ResultsScreen } from './screens/ResultsScreen'

function AppRoutes(): React.ReactElement {
  useBLEDeviceSync()

  return (
    <Routes>
      <Route path="/splash" element={<SplashScreen />} />
      <Route path="/menu" element={<MainMenuScreen />} />
      <Route path="/devices" element={<DevicesScreen />} />
      <Route path="/character-select" element={<CharacterSelectScreen />} />
      <Route path="/race" element={<RaceScreen />} />
      <Route path="/results" element={<ResultsScreen />} />
      <Route path="*" element={<Navigate to="/splash" replace />} />
    </Routes>
  )
}

export function App(): React.ReactElement {
  return (
    <MemoryRouter initialEntries={['/splash']}>
      <AppRoutes />
    </MemoryRouter>
  )
}
