import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { CommandPalette } from './components/CommandPalette'
import { MockModeBadge } from './components/MockModeBadge'
import AppRouter from './AppRouter'
import { getDatabase } from './firebase/config'
import './index.css'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'
if (useMock) {
  const { mockDb } = await import('./mock/mockDb')
  mockDb.startRailSimulation()
}

function ClearTestUsers() {
  useEffect(() => {
    // Only clear once on load
    getDatabase().then(async (db: any) => {
      try {
        const testIds = ['emp-001', 'emp-002', 'emp-003', 'emp-004', 'emp-005', 'emp-006']
        for (const id of testIds) {
          await db.remove(`employees/${id}`)
        }
        console.log('Test employees cleared.')
      } catch (err) {
        console.error('Failed to clear test employees', err)
      }
    })
  }, [])
  return null
}

createRoot(document.getElementById('root')!)!.render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <ClearTestUsers />
          <AppRouter />
          <CommandPalette />
          <MockModeBadge />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#14171D',
                color: '#F5F3EE',
                border: '1px solid #262B33',
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)