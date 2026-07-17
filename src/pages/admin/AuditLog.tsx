import { PageShell } from '../../components/PageShell'
import { StatusDot } from '../../components/StatusDot'
import { motion } from 'framer-motion'

interface AuditEntry {
  id: string
  timestamp: string
  action: string
  user: string
}

export function AuditLog() {
  const entries: AuditEntry[] = []

  if (entries.length === 0) {
    return (
      <PageShell title="Audit Log">
        <div className="p-4 text-text-mid font-body">
          No audit entries recorded.
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell title="Audit Log">
      <div className="bg-ink-900 border border-hairline rounded-lg divide-y divide-hairline">
        {[...entries].reverse().map((entry) => (
          <motion.div
            key={entry.id}
            className="flex items-center gap-3 p-4 hover:bg-ink-800 transition-colors"
            whileHover={{ x: 4 }}
          >
            <StatusDot status="pulse" size="sm" />
            <span className="font-mono text-text-mid text-sm">{entry.timestamp}</span>
            <span className="text-text-hi font-body">{entry.action}</span>
            <span className="text-text-low font-mono text-xs ml-auto">{entry.user}</span>
          </motion.div>
        ))}
      </div>
    </PageShell>
  )
}