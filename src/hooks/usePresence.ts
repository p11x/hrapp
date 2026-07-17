import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setOnlineUsers(new Set())
      return
    }

    import('../firebase/config').then(({ getDatabase }) => {
      getDatabase().then((db) => {
        const database = db as any
        database.onValue('presence', (snap: any) => {
          const data = snap.val() || {}
          const online = new Set(
            Object.entries(data)
              .filter(([, v]) => (v as any).state === 'online')
              .map(([k]) => k)
          )
          setOnlineUsers(online)
        })
      })
    })
  }, [user])

  return { onlineUsers }
}