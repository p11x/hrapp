import { useEffect, useState } from 'react'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export function MockModeBadge() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(useMock)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-2 left-2 z-50 bg-ink-900 border border-hairline rounded px-2 py-1 font-mono text-xs text-warn">
      MOCK MODE
    </div>
  )
}