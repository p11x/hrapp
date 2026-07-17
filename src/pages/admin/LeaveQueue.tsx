import { PageShell } from '../../components/PageShell'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { hrToast } from '../../components/HRCToast'
import { getDatabase } from '../../firebase/config'

interface LeaveRequest {
  id: string
  employeeId: string
  employee: string
  avatar?: string
  type: string
  from: string
  to: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
}

export function LeaveQueue() {
  const [showCount, setShowCount] = useState(10)
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])

  useEffect(() => {
    let unsub: (() => void) | null = null
    getDatabase().then((db: any) => {
      unsub = db.onValue('leaves', (snapshot: any) => {
        const data = snapshot.val() as Record<string, Omit<LeaveRequest, 'id'>> | undefined
        if (data) {
          const pending = Object.entries(data)
            .filter(([_, r]) => (r as LeaveRequest).status === 'pending')
            .map(([id, req]) => ({ ...(req as Omit<LeaveRequest, 'id'>), id }))
          setLeaves(pending)
        } else {
          setLeaves([])
        }
      })
    })
    return () => { if (unsub) unsub() }
  }, [])

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const db = await getDatabase()
      const status = action === 'approve' ? 'approved' : 'rejected'
      await (db as any).set(`leaves/${id}/status`, status)
      hrToast.success(action === 'approve' ? 'Approved' : 'Rejected', `Leave request ${action}ed successfully`)
    } catch (e) {
      hrToast.error('Action Failed', (e as Error).message)
    }
  }

  return (
    <PageShell title="Leave Queue">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-body text-text-mid">Show</span>
          <select
            value={showCount}
            onChange={(e) => setShowCount(Number(e.target.value))}
            className="px-2 py-1 bg-bg-surface border border-border-soft rounded text-sm focus-ring"
          >
            <option value={10}>10 entries</option>
            <option value={25}>25 entries</option>
            <option value={50}>50 entries</option>
          </select>
        </div>

        <div className="relative">
          <input
            type="search"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 rounded-full border border-border-soft bg-bg-surface text-sm focus-ring w-48"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-low" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-xl overflow-hidden">
        <table className="w-full font-body text-sm">
          <thead className="bg-bg-app">
            <tr>
              <th className="text-left p-4 font-medium text-text-low">EMPLOYEE ID</th>
              <th className="text-left p-4 font-medium text-text-low">EMPLOYEE NAME</th>
              <th className="text-left p-4 font-medium text-text-low">LEAVE TYPE</th>
              <th className="text-left p-4 font-medium text-text-low">FROM</th>
              <th className="text-left p-4 font-medium text-text-low">TO</th>
              <th className="text-left p-4 font-medium text-text-low">REASON</th>
              <th className="text-left p-4 font-medium text-text-low">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave) => (
              <motion.tr
                key={leave.id}
                className="border-t border-border-soft hover:bg-bg-app transition-colors"
                whileHover={{ x: 2 }}
              >
                <td className="p-4">
                  <span className={`font-mono ${leave.status === 'pending' ? 'text-accent-coral' : 'text-text-hi'}`}>
                    {leave.employeeId}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-mint flex items-center justify-center text-white text-xs font-mono">
                      {leave.avatar}
                    </div>
                    <span className="text-text-hi font-medium">{leave.employee}</span>
                  </div>
                </td>
                <td className="p-4 text-text-hi">{leave.type}</td>
                <td className="p-4 font-mono text-text-mid">{leave.from}</td>
                <td className="p-4 font-mono text-text-mid">{leave.to}</td>
                <td className="p-4 text-text-mid">{leave.reason}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(leave.id, 'approve')}
                      className="w-8 h-8 rounded-full bg-accent-mint text-white flex items-center justify-center focus-ring"
                      aria-label="Approve"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => handleAction(leave.id, 'reject')}
                      className="w-8 h-8 rounded-full bg-accent-coral text-white flex items-center justify-center focus-ring"
                      aria-label="Reject"
                    >
                      ×
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        <div className="p-4 border-t border-border-soft flex justify-between items-center text-sm text-text-mid font-body">
          <span>Showing 1 to {leaves.length} of {leaves.length} entries</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 rounded border border-border-soft hover:bg-primary-dim transition-colors">Previous</button>
            <button className="px-3 py-1 rounded bg-primary text-white">1</button>
            <button className="px-3 py-1 rounded border border-border-soft hover:bg-primary-dim transition-colors">Next</button>
          </div>
        </div>
      </div>
    </PageShell>
  )
}