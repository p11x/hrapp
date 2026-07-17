import { PageShell } from '../../components/PageShell'
import { StatusDot } from '../../components/StatusDot'
import { motion } from 'framer-motion'
import { usePresence } from '../../hooks/usePresence'
import { useState, useEffect } from 'react'
import { getDatabase } from '../../firebase/config'

interface Employee {
  id: string
  name: string
  role: string
}

export function Directory() {
  const { onlineUsers } = usePresence()
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    getDatabase().then((db: any) => {
      unsubscribe = db.onValue('employees', (snapshot: any) => {
        const data = snapshot.val()
        if (data) {
          const loaded: Employee[] = Object.entries(data).map(([id, emp]: [string, any]) => {
            const name = emp.name || emp.fullName || 'Unnamed Employee'
            return {
              id,
              name,
              role: emp.position || emp.role || 'Staff'
            }
          })
          setEmployees(loaded)
        } else {
          setEmployees([])
        }
      })
    })
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const getStatus = (id: string) => {
    return onlineUsers.has(id) ? 'pulse' : 'neutral'
  }

  return (
    <PageShell title="Employee Directory">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp, i) => (
          <motion.div
            key={emp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface border border-border-soft rounded-xl p-4 relative"
          >
            <div className="w-12 h-12 rounded-full bg-accent-mint flex items-center justify-center text-white text-lg font-mono mb-3">
              {emp.name.split(' ').map(n => n[0]).join('')}
            </div>

            <h3 className="text-lg font-display font-semibold text-text-hi mb-1">{emp.name}</h3>
            <p className="text-text-mid text-sm mb-3">{emp.role}</p>

            <StatusDot status={getStatus(emp.id)} size="sm" />
          </motion.div>
        ))}
      </div>
    </PageShell>
  )
}