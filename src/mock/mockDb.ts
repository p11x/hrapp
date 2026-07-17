import { seedData } from './seedData'

type Listener = (snapshot: { val: () => unknown; key?: string }) => void

const db: Record<string, unknown> = JSON.parse(JSON.stringify(seedData))

const listeners: Record<string, Listener[]> = {}
let railInterval: ReturnType<typeof setInterval> | null = null

const getNestedValue = (path: string): unknown => {
  const parts = path.split('/')
  let current: Record<string, unknown> | undefined = db as Record<string, unknown>
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part] as Record<string, unknown> | undefined
    } else {
      return undefined
    }
  }
  return current
}

const setNestedValue = (path: string, value: unknown) => {
  const parts = path.split('/')
  let current: Record<string, unknown> = db as Record<string, unknown>
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (!(part in current)) {
      current[part] = {}
    }
    current = current[part] as Record<string, unknown>
  }
  current[parts[parts.length - 1]] = value
}

const deleteNestedValue = (path: string) => {
  const parts = path.split('/')
  let current: Record<string, unknown> = db as Record<string, unknown>
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (!(part in current)) return
    current = current[part] as Record<string, unknown>
  }
  delete current[parts[parts.length - 1]]
}

const notifyListeners = (path: string) => {
  const value = getNestedValue(path)
  if (value === undefined) return
  const snapshot = { val: () => value, key: path }
  ;(listeners[path] || []).forEach((cb) => cb(snapshot))
}

const simulateRailEvents = () => {
  if (railInterval) return
  
  const eventTypes: Array<'signal' | 'pulse' | 'warn' | 'neutral'> = ['signal', 'pulse', 'warn', 'neutral']
  const actions = ['Clocked In', 'Leave Applied', 'Document Uploaded', 'Ticket Created', 'Announcement Posted']
  const employees = ['Sunny', 'Pavan']
  
  let eventId = 0
  railInterval = setInterval(() => {
    const newEvent = {
      status: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      message: actions[Math.floor(Math.random() * actions.length)] + ': ' + employees[Math.floor(Math.random() * employees.length)],
      timestamp: Date.now(),
    }
    db.railEvents = db.railEvents || {}
    ;(db.railEvents as Record<string, unknown>)[`rail-${Date.now()}-${eventId++}`] = newEvent
    notifyListeners('railEvents')
  }, 3000)
}

export const mockDb = {
  ref: (path: string) => {
    const parts = path.split('/')
    let current: Record<string, unknown> | undefined = db as Record<string, unknown>
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part] as Record<string, unknown> | undefined
      } else {
        return null
      }
    }
    return current || null
  },

  get: async (pathOrRef: string | { key?: string }) => {
    const path = typeof pathOrRef === 'string' ? pathOrRef : (pathOrRef.key || '')
    const value = getNestedValue(path)
    return {
      exists: () => value !== undefined,
      val: () => value,
      key: path,
    }
  },

  set: async (path: string, value: unknown) => {
    setNestedValue(path, value)
    notifyListeners(path)
  },

  remove: async (path: string) => {
    deleteNestedValue(path)
    notifyListeners(path)
  },

  onValue: (path: string, callback: Listener) => {
    listeners[path] = listeners[path] || []
    listeners[path].push(callback)
    const value = getNestedValue(path)
    if (value !== undefined) {
      callback({ val: () => value, key: path })
    }
    return () => {
      listeners[path] = (listeners[path] || []).filter((l) => l !== callback)
    }
  },

  onChildAdded: (path: string, callback: (snap: { key: string; val: () => unknown }) => void) => {
    listeners[path] = listeners[path] || []
    listeners[path].push((snap) => {
      if (typeof snap.val() === 'object' && snap.val() !== null) {
        const obj = snap.val() as Record<string, unknown>
        Object.entries(obj).forEach(([key, value]) => {
          callback({ key, val: () => value })
        })
      }
    })
    const value = getNestedValue(path)
    if (value !== undefined && typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>
      Object.entries(obj).forEach(([key, value]) => {
        callback({ key, val: () => value })
      })
    }
    return () => {
      listeners[path] = (listeners[path] || []).filter((l) => l !== callback)
    }
  },

  onChildRemoved: (path: string, callback: (snap: { key: string }) => void) => {
    listeners[path] = listeners[path] || []
    return () => {
      listeners[path] = (listeners[path] || []).filter((l) => l !== callback)
    }
  },

  startRailSimulation: () => simulateRailEvents(),
  stopRailSimulation: () => {
    if (railInterval) {
      clearInterval(railInterval)
      railInterval = null
    }
  },
}