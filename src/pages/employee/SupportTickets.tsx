import { PageShell } from '../../components/PageShell'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ticketSchema } from '../../lib/validators'
import type { TicketFormData } from '../../lib/validators'
import { motion } from 'framer-motion'
import { Plus, LifeBuoy } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getDatabase } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { hrToast } from '../../components/HRCToast'

interface SupportTicket {
  id: string
  subject: string
  description: string
  status: 'open' | 'in-progress' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
}

export function SupportTickets() {
  const { user } = useAuth()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
  })

  const [tickets, setTickets] = useState<SupportTicket[]>([])

  useEffect(() => {
    let unsub: (() => void) | null = null
    getDatabase().then((db: any) => {
      unsub = db.onValue('tickets', (snapshot: any) => {
        const data = snapshot.val() as Record<string, Omit<SupportTicket, 'id'>> | undefined
        if (data) {
          setTickets(Object.entries(data).map(([id, t]) => ({ ...t, id, status: t.status || 'open' } as SupportTicket)))
        } else {
          setTickets([])
        }
      })
    })
    return () => { if (unsub) unsub() }
  }, [])

  const onSubmit = async (data: TicketFormData) => {
    if (!user?.uid) return
    try {
      const db = await getDatabase()
      const ticketId = `tic-${Date.now()}`
      await (db as any).set(`tickets/${ticketId}`, {
        ...data,
        id: ticketId,
        employee: user.displayName || user.email?.split('@')[0] || 'Employee',
        status: 'open',
        createdAt: new Date().toISOString().split('T')[0],
      })
      hrToast.success('Ticket Submitted', 'Your support ticket has been created')
      reset()
    } catch (error: any) {
      hrToast.error('Submission Failed', error?.message || 'Unable to submit ticket')
    }
  }

  return (
    <PageShell title="Support Tickets">
      <div className="max-w-2xl">
        <motion.div
          className="bg-surface border border-border-soft rounded-xl p-6 mb-6"
          whileHover={{ y: -2 }}
        >
          <h3 className="text-lg font-display font-semibold text-text-hi mb-4">
            Submit New Ticket
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-mid mb-2">
                Subject
              </label>
              <input
                {...register('subject')}
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                placeholder="Brief description"
              />
              {errors.subject && (
                <p className="text-accent-coral text-sm mt-1">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                placeholder="Detailed description..."
              />
              {errors.description && (
                <p className="text-accent-coral text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary text-white font-medium rounded hover:bg-accent-coral transition-colors disabled:opacity-50 flex items-center gap-2 focus-ring"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        </motion.div>

        <div className="bg-surface border border-border-soft rounded-xl divide-y divide-border-soft">
          {tickets.length === 0 ? (
            <div className="p-4 text-text-mid font-body">
              No tickets. All issues resolved or submit a new one above.
            </div>
          ) : (
            tickets.map((ticket) => (
              <motion.div
                key={ticket.id}
                className="p-4 hover:bg-bg-app transition-colors"
                whileHover={{ x: 4 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <LifeBuoy className="w-4 h-4 text-text-mid" />
                      <span className="text-text-hi font-body">{ticket.subject}</span>
                    </div>
                    <div className="text-text-mid text-sm mt-1">{ticket.description}</div>
                    <div className="text-text-low font-mono text-xs mt-2">{ticket.createdAt}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-mono ml-4 ${
                    ticket.status === 'resolved' ? 'text-accent-mint' :
                    ticket.status === 'in-progress' ? 'text-accent-amber' : 'text-accent-coral'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </PageShell>
  )
}