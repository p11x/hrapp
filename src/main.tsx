import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { CommandPalette } from './components/CommandPalette'
import { MockModeBadge } from './components/MockModeBadge'
import AppRouter from './AppRouter'
import './index.css'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'
if (useMock) {
  const { mockDb } = await import('./mock/mockDb')
  mockDb.startRailSimulation()
}

createRoot(document.getElementById('root')!)!.render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
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