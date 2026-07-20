import { PageShell } from '../../components/PageShell'
import { StatusDot } from '../../components/StatusDot'
import { motion } from 'framer-motion'
import { Bell, CheckCircle2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getDatabase } from '../../firebase/config'

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let unsubscribe: (() => void) | null = null

    const fetchNotifications = async () => {
      try {
        const db = await getDatabase()
        unsubscribe = db.onValue(`notifications/${user.uid}`, (snapshot: any) => {
          const data = snapshot.val() as Record<string, Omit<Notification, 'id'>> | null
          if (data) {
            const parsed = Object.entries(data).map(([id, val]) => ({
              id,
              ...val
            }))
            // Sort by createdAt descending
            parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            setNotifications(parsed)
          } else {
            setNotifications([])
          }
          setLoading(false)
        })
      } catch (error) {
        console.error("Error fetching notifications:", error)
        setLoading(false)
      }
    }

    fetchNotifications()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [user])

  const markAsRead = async (id: string) => {
    if (!user) return
    try {
      const db = await getDatabase()
      await db.update(`notifications/${user.uid}/${id}`, { read: true })
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return
    try {
      const db = await getDatabase()
      const updates: Record<string, any> = {}
      notifications.forEach(n => {
        if (!n.read) {
          updates[`${n.id}/read`] = true
        }
      })
      if (Object.keys(updates).length > 0) {
        await db.update(`notifications/${user.uid}`, updates)
      }
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  return (
    <PageShell title="Notifications">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-display font-semibold text-text-hi">Your Notifications</h2>
        {notifications.length > 0 && notifications.some(n => !n.read) && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary-dim rounded-lg transition-colors focus-ring"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-4 text-text-mid font-body text-center">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="p-4 text-text-mid font-body text-center bg-surface border border-border-soft rounded-xl">
          No notifications. You're all caught up.
        </div>
      ) : (
        <div className="bg-surface border border-border-soft rounded-xl divide-y divide-border-soft">
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              onClick={() => !n.read && markAsRead(n.id)}
              className={`p-4 flex items-start gap-3 transition-colors ${
                !n.read 
                  ? 'cursor-pointer hover:bg-bg-app border-l-4 border-l-primary' 
                  : 'bg-surface opacity-75'
              }`}
              whileHover={!n.read ? { x: 4 } : {}}
            >
              <div className={`mt-0.5 rounded-full p-2 ${!n.read ? 'bg-primary-dim text-primary' : 'bg-bg-app text-text-mid'}`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className={`font-body ${!n.read ? 'text-text-hi font-semibold' : 'text-text-mid'}`}>
                  {n.title}
                </div>
                <div className="text-text-mid text-sm mt-1">{n.message}</div>
                <div className="text-text-low font-mono text-xs mt-2">{n.createdAt}</div>
              </div>
              {!n.read && <StatusDot status="pulse" size="sm" />}
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  )
}