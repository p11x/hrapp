import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface CommandAction {
  id: string
  label: string
  path: string
}

const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const { isAdmin } = useAuth()

  const actions: CommandAction[] = [
    ...(isAdmin ? [{ id: 'admin-dashboard', label: 'Admin Dashboard', path: '/admin/dashboard' }] : []),
    { id: 'employee-dashboard', label: 'Employee Dashboard', path: '/employee/dashboard' },
...(!isAdmin ? [
       { id: 'notifications', label: 'Notifications', path: '/employee/notifications' },
       { id: 'holidays', label: 'Holidays', path: '/employee/holidays' },
       { id: 'directory', label: 'Directory', path: '/employee/directory' },
       { id: 'projects', label: 'My Projects', path: '/employee/projects' },
       { id: 'tasks', label: 'My Tasks', path: '/employee/tasks' },
       { id: 'chat', label: 'Chat', path: '/employee/chat' },
       { id: 'support', label: 'Support Tickets', path: '/employee/support' },
     ] : []),
    { id: 'profile', label: 'Profile', path: '/employee/profile' },
    { id: 'leave', label: 'Apply Leave', path: '/employee/leave' },
    { id: 'attendance', label: 'Attendance', path: '/employee/attendance' },
    { id: 'documents', label: 'Documents', path: '/employee/documents' },
    ...(isAdmin ? [
      { id: 'employees', label: 'Employees', path: '/admin/employees' },
      { id: 'employees-view', label: 'Employees View', path: '/admin/employees-view' },
      { id: 'add-employee', label: 'Add Employee', path: '/admin/add-employee' },
      { id: 'leave-queue', label: 'Leave Queue', path: '/admin/leaves' },
      { id: 'announcements', label: 'Announcements', path: '/admin/announcements' },
      { id: 'reports', label: 'Reports', path: '/admin/reports' },
      { id: 'projects', label: 'Projects', path: '/admin/projects' },
      { id: 'tasks-admin', label: 'Task Management', path: '/admin/tasks' },
      { id: 'timesheet', label: 'Timesheet', path: '/admin/timesheet' },
      { id: 'clients', label: 'Clients', path: '/admin/clients' },
      { id: 'chat', label: 'Chat', path: '/admin/chat' },
    ] : []),
  ]

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setQuery('')
        setSelectedIndex(0)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const handleSelect = (path: string) => {
    navigate(path)
    setIsOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => (i + 1) % filtered.length)
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length)
    }
    if (e.key === 'Enter' && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex].path)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50 md:pt-20"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            className="bg-ink-900 border border-hairline rounded-lg w-full max-w-md mx-4 md:mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-hairline">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-text-mid" aria-hidden="true" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-text-hi focus:outline-none focus:ring-2 focus:ring-signal rounded"
                  placeholder="Jump to..."
                  aria-label="Search commands"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-4 text-text-mid font-body">No results</div>
              ) : (
                filtered.map((action, i) => (
                  <div
                    key={action.id}
                    className={`px-4 py-2 cursor-pointer font-body focus-ring ${
                      i === selectedIndex ? 'bg-ink-800' : 'hover:bg-ink-800'
                    }`}
                    onClick={() => handleSelect(action.path)}
                    role="option"
                    aria-selected={i === selectedIndex}
                  >
                    <div className="text-text-hi">{action.label}</div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}