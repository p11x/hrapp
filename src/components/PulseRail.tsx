import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getDatabase } from '../firebase/config'
import {
  LayoutDashboard,
  User,
  Calendar,
  Clock,
  FileText,
  Bell,
  Users,
  LifeBuoy,
  Settings,
  LogOut,
} from 'lucide-react'
import type { RailEvent } from '../types/index'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const employeeNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/employee/dashboard' },
  { icon: User, label: 'Profile', path: '/employee/profile' },
  { icon: Calendar, label: 'Leave', path: '/employee/leave' },
  { icon: Clock, label: 'Attendance', path: '/employee/attendance' },
  { icon: FileText, label: 'Documents', path: '/employee/documents' },
  { icon: Users, label: 'Directory', path: '/employee/directory' },
  { icon: LifeBuoy, label: 'Support', path: '/employee/support' },
  { icon: Bell, label: 'Notifications', path: '/employee/notifications' },
]

interface PulseRailProps {
  isAdmin?: boolean
  onSignOut?: () => void
}

export function PulseRail({ isAdmin = false, onSignOut }: PulseRailProps) {
  const railRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const [events, setEvents] = useState<Array<RailEvent & { _id: string }>>([])

  useEffect(() => {
    if (!railRef.current) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      railRef.current?.querySelectorAll('.rail-dot').forEach((dot) => {
        gsap.to(dot, {
          scale: 1.15,
          duration: 1,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1,
        })
      })
    })

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    let unsub: (() => void) | null = null

    if (useMock) {
      getDatabase().then((mockDb: any) => {
        if (mockDb.onChildAdded) {
          unsub = mockDb.onChildAdded('railEvents', (snap: any) => {
            const event = snap.val() as RailEvent
            setEvents((prev) => [...prev, { ...event, _id: snap.key }])
          })
        }
      })
    }

    return () => unsub?.()
  }, [])

  const navItems = isAdmin
    ? employeeNavItems.slice(0, 2).concat({ icon: Settings, label: 'Admin', path: '/admin/dashboard' })
    : employeeNavItems

  return (
    <>
      <div className="hidden md:flex fixed left-0 top-0 h-screen w-18 bg-white flex-col items-center justify-between py-4 z-40 border-r" style={{ borderColor: '#EAEBF3' }}>
        <div className="flex flex-col items-center gap-4" ref={railRef}>
          {events.slice(0, 5).map((event) => (
            <div key={event._id} className="rail-dot">
              <div className={`w-2 h-2 rounded-full ${
                event.status === 'pulse' ? 'bg-accent-mint' :
                event.status === 'signal' ? 'bg-primary' :
                event.status === 'warn' ? 'bg-accent-amber' :
                event.status === 'neutral' ? 'bg-accent-coral' : 'bg-text-low'
              }`} />
            </div>
          ))}
        </div>

        <nav className="flex flex-col items-center gap-3" aria-label="Navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`p-2.5 rounded-lg transition-colors relative focus-ring flex items-center justify-center ${
                  isActive ? 'bg-primary-dim' : 'hover:bg-primary-dim'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-text-low'}`} aria-hidden="true" />
              </motion.button>
            )
          })}
        </nav>

        <button
          onClick={onSignOut}
          className="p-2.5 rounded-lg hover:bg-primary-dim transition-colors focus-ring"
          aria-label="Sign Out"
        >
          <LogOut className="w-5 h-5 text-text-low" aria-hidden="true" />
        </button>
      </div>

      <div className="flex md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40" style={{ borderColor: '#EAEBF3' }}>
        <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`p-3 rounded-lg transition-colors min-w-[44px] focus-ring flex items-center justify-center ${
                  isActive ? 'bg-primary-dim' : 'hover:bg-primary-dim'
                }`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-text-low'}`} aria-hidden="true" />
              </motion.button>
            )
          })}
        </nav>
      </div>
    </>
  )
}