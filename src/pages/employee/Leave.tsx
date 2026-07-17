import { PageShell } from '../../components/PageShell'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { leaveSchema } from '../../lib/validators'
import type { LeaveFormData } from '../../lib/validators'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getDatabase } from '../../firebase/config'
import { hrToast } from '../../components/HRCToast'
import { useAuth } from '../../context/AuthContext'

interface LeaveRequest {
  id: string
  employeeId: string
  type: string
  days: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  startDate: string
  endDate: string
}

export function Leave() {
  const { user } = useAuth()
  const userId = user?.uid || 'emp-001'
  const [activeTab, setActiveTab] = useState<'apply' | 'my-requests'>('apply')
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([])
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema),
  })

  const startDate = watch('startDate')
  const endDate = watch('endDate')

  useEffect(() => {
    let unsub: (() => void) | null = null
    getDatabase().then((db: any) => {
      unsub = db.onValue('leaves', (snapshot: any) => {
        const data = snapshot.val() as Record<string, Omit<LeaveRequest, 'id'>> | undefined
        if (data) {
          const requests = Object.entries(data)
            .filter(([_, req]) => (req as any).employeeId === userId)
            .map(([id, req]) => ({ ...(req as any), id }))
          setMyRequests(requests)
        } else {
          setMyRequests([])
        }
      })
    })
    return () => { if (unsub) unsub() }
  }, [userId])

  const calculateDays = () => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1)
    }
    return 0
  }

  const onSubmit = async (data: LeaveFormData) => {
    if (!user?.uid) return
    try {
      const db = await getDatabase()
      const leaveId = `leave-${Date.now()}`
      await (db as any).set(`leaves/${leaveId}`, {
        ...data,
        id: leaveId,
        employeeId: userId,
        employee: user.displayName || user.email?.split('@')[0] || 'Employee',
        status: 'pending',
        days: calculateDays(),
      })
      hrToast.success('Leave Applied', 'Your leave request has been submitted')
    } catch (error: any) {
      hrToast.error('Submission Failed', error?.message || 'Unable to submit leave request')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-accent-mint'
      case 'pending': return 'text-accent-coral'
      default: return 'text-text-mid'
    }
  }

  return (
    <PageShell title="Leave">
      <div className="max-w-4xl">
        <div className="flex gap-2 mb-6 border-b border-border-soft">
          <button
            onClick={() => setActiveTab('apply')}
            className={`px-4 py-2 font-medium text-sm focus-ring ${
              activeTab === 'apply' ? 'text-primary border-b-2 border-primary' : 'text-text-mid hover:text-text-hi'
            }`}
          >
            Apply
          </button>
          <button
            onClick={() => setActiveTab('my-requests')}
            className={`px-4 py-2 font-medium text-sm focus-ring ${
              activeTab === 'my-requests' ? 'text-primary border-b-2 border-primary' : 'text-text-mid hover:text-text-hi'
            }`}
          >
            My Requests
          </button>
        </div>

        {activeTab === 'apply' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border-soft rounded-xl p-6 mb-6"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-mid mb-2">
                  Leave Type
                </label>
                <select
                  {...register('type')}
                  className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                >
                  <option value="">Select type</option>
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="vacation">Vacation</option>
                  <option value="personal">Personal</option>
                </select>
                {errors.type && (
                  <p className="text-accent-coral text-sm mt-1">{errors.type.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-mid mb-2">
                    Start Date
                  </label>
                  <input
                    {...register('startDate')}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                  />
                  {errors.startDate && (
                    <p className="text-accent-coral text-sm mt-1">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-mid mb-2">
                    End Date
                  </label>
                  <input
                    {...register('endDate')}
                    type="date"
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                  />
                  {errors.endDate && (
                    <p className="text-accent-coral text-sm mt-1">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              {startDate && endDate && (
                <div className="flex items-center gap-2 text-primary">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono">{calculateDays()} days</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-mid mb-2">
                  Reason
                </label>
                <textarea
                  {...register('reason')}
                  rows={4}
                  className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                  placeholder="Enter reason for leave..."
                />
                {errors.reason && (
                  <p className="text-accent-coral text-sm mt-1">{errors.reason.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-primary text-white font-medium rounded hover:bg-accent-coral transition-colors disabled:opacity-50 focus-ring"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </motion.div>
        )}

        {activeTab === 'my-requests' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border-soft rounded-xl divide-y divide-border-soft"
          >
            {myRequests.length === 0 ? (
              <div className="p-4 text-text-mid font-body">
                No leave requests found.
              </div>
            ) : (
              myRequests.map((req) => (
                <motion.div
                  key={req.id}
                  className="p-4 flex items-start justify-between"
                  whileHover={{ x: 2 }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarIcon className="w-4 h-4 text-text-mid" />
                      <span className="text-text-hi font-body font-medium">{req.type}</span>
                      <span className={`text-xs font-mono ${getStatusColor(req.status)}`}>({req.status})</span>
                    </div>
                    <div className="text-text-mid text-sm font-body">{req.reason}</div>
                    <div className="text-text-low font-mono text-xs mt-1">{req.startDate} to {req.endDate} • {req.days} days</div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        <motion.div
          className="bg-surface border border-border-soft rounded-xl p-6 mt-6"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-lg font-display font-semibold text-text-hi">Leave Balance</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-mono text-primary">12</div>
              <div className="text-text-mid text-sm">Casual</div>
            </div>
            <div>
              <div className="text-2xl font-mono text-signal">8</div>
              <div className="text-text-mid text-sm">Sick</div>
            </div>
            <div>
              <div className="text-2xl font-mono text-accent-amber">5</div>
              <div className="text-text-mid text-sm">Vacation</div>
            </div>
          </div>
        </motion.div>
      </div>
    </PageShell>
  )
}