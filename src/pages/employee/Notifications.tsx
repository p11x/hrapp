import { PageShell } from '../../components/PageShell'
import { StatusDot } from '../../components/StatusDot'
import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export function Notifications() {
  const notifications: Notification[] = [
    { id: '1', title: 'Leave Approved', message: 'Your vacation request has been approved', read: false, createdAt: '2024-01-15 09:30' },
    { id: '2', title: 'Document Uploaded', message: 'January payslip is available', read: true, createdAt: '2024-01-14 14:20' },
    { id: '3', title: 'Ticket Response', message: 'Support ticket #124 has a new response', read: false, createdAt: '2024-01-12 11:45' },
  ]

  if (notifications.length === 0) {
    return (
      <PageShell title="Notifications">
        <div className="p-4 text-text-mid font-body">
          No notifications. You're all caught up.
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell title="Notifications">
      <div className="bg-surface border border-border-soft rounded-xl divide-y divide-border-soft">
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-bg-app transition-colors ${!n.read ? 'border-l-4 border-l-primary' : ''}`}
            whileHover={{ x: 4 }}
          >
            <Bell className="w-5 h-5 text-text-mid mt-0.5" />
            <div className="flex-1">
              <div className="text-text-hi font-body">{n.title}</div>
              <div className="text-text-mid text-sm mt-1">{n.message}</div>
              <div className="text-text-low font-mono text-xs mt-2">{n.createdAt}</div>
            </div>
            {!n.read && <StatusDot status="pulse" size="sm" />}
          </motion.div>
        ))}
      </div>
    </PageShell>
  )
}