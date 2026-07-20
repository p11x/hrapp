import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  FolderKanban,
  ListTodo,
  ListChecks,
  Timer,
  Tickets,
  Calendar,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  Folder,
  Bell,
  Gift,
  Phone,
  User,
  GraduationCap,
  Banknote,
  Calendar as CalendarIcon,
  UserPlus,
  Menu,
  X,
  IdCard,
} from 'lucide-react'

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard', showDot: true },
  { icon: Users, label: 'Employees View', path: '/admin/employees-view', showDot: false },
  { icon: UserPlus, label: 'Add Employee', path: '/admin/add-employee', showDot: false },
  { icon: CalendarDays, label: 'Attendance Detail', path: '/admin/attendance', showDot: true },
  { icon: Folder, label: 'Document Center', path: '/admin/documents', showDot: false },
  { icon: FileText, label: 'Leave Request', path: '/admin/leaves', showDot: true },
  { icon: FolderKanban, label: 'Projects Management', path: '/admin/projects', showDot: false },
  { icon: ListTodo, label: 'Task Management', path: '/admin/tasks', showDot: false },
  { icon: Timer, label: 'Project Timesheet', path: '/admin/timesheet', showDot: false },
  { icon: Tickets, label: 'Tickets Detail', path: '/admin/tickets', showDot: true },
  { icon: Building2, label: 'Clients List', path: '/admin/clients', showDot: false },
  { icon: Calendar, label: 'Calendar Events', path: '/admin/holidays', showDot: true },
  { icon: MessageSquare, label: 'Chat List', path: '/admin/chat', showDot: false },
]

const employeeNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/employee/dashboard', showDot: true },
  { icon: IdCard, label: 'Virtual ID', path: '/employee/virtual-id', showDot: false },
  { icon: Bell, label: 'Notifications', path: '/employee/notifications', showDot: true },
  { icon: Gift, label: 'Holidays', path: '/employee/holidays', showDot: false },
  { icon: Users, label: 'Directory', path: '/employee/directory', showDot: false },
  { icon: FolderKanban, label: 'Projects', path: '/employee/projects', showDot: false },
  { icon: ListChecks, label: 'Tasks', path: '/employee/tasks', showDot: false },
  { icon: MessageSquare, label: 'Chat', path: '/employee/chat', showDot: false },
  { icon: Phone, label: 'Support', path: '/employee/support', showDot: false },
  { icon: User, label: 'Personal Details', path: '/employee/profile', showDot: false },
  { icon: GraduationCap, label: 'Education', path: '/employee/education', showDot: false },
  { icon: Folder, label: 'Documents', path: '/employee/documents', showDot: false },
  { icon: Banknote, label: 'Bank Details', path: '/employee/bank-details', showDot: false },
  { icon: CalendarIcon, label: 'Leave', path: '/employee/leave', showDot: false },
  { icon: CalendarDays, label: 'Attendance', path: '/employee/attendance', showDot: true },
]

export function Sidebar({ onSignOut, isAdmin = false }: { onSignOut?: () => void; isAdmin?: boolean }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = isAdmin ? adminNavItems : employeeNavItems
  const sidebarWidth = collapsed ? 'w-20' : 'w-64'

  return (
    <>
      <aside className={`hidden md:flex fixed left-0 top-0 h-screen ${sidebarWidth} bg-surface border-r border-border-soft flex-col z-40 transition-all duration-300`}>
        <div className="flex items-center justify-between p-4 border-b border-border-soft">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-display font-bold text-lg">
              V
            </div>
            {!collapsed && <span className="font-display font-semibold text-text-hi truncate">Vepcone Soft Systems</span>}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-bg-app transition-colors focus-ring"
          >
            {collapsed ? <ChevronRight className="w-4 h-4 text-text-mid" /> : <ChevronLeft className="w-4 h-4 text-text-mid" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors relative ${
                  isActive ? 'bg-primary-dim text-primary' : 'text-text-mid hover:bg-bg-app'
                }`}
                whileHover={{ x: 4 }}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-text-mid'}`} />
                {!collapsed && <span className="font-body text-sm">{item.label}</span>}
                {item.showDot && isActive && (
                  <div className="absolute top-2 right-4 w-2 h-2 bg-accent-mint rounded-full" />
                )}
              </motion.button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border-soft">
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-text-mid hover:bg-bg-app rounded transition-colors focus-ring"
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="font-body text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface border-b border-border-soft z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-display font-bold text-lg">
            V
          </div>
          <span className="font-display font-semibold text-text-hi truncate max-w-[200px]">Vepcone Soft Systems</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 -mr-2 text-text-mid hover:bg-bg-app rounded-lg focus-ring"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative flex-1 max-w-xs w-full bg-surface h-full flex flex-col border-r border-border-soft shadow-xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-border-soft">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-display font-bold text-lg">
                    V
                  </div>
                  <span className="font-display font-semibold text-text-hi truncate max-w-[200px]">Vepcone Soft Systems</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-text-mid hover:bg-bg-app rounded-lg focus-ring"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <nav className="flex-1 overflow-y-auto py-4" aria-label="Mobile navigation">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path)
                        setMobileMenuOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors relative ${
                        isActive ? 'bg-primary-dim text-primary' : 'text-text-mid hover:bg-bg-app'
                      }`}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-text-mid'}`} />
                      <span className="font-body text-sm">{item.label}</span>
                      {item.showDot && isActive && (
                        <div className="absolute top-2 right-4 w-2 h-2 bg-accent-mint rounded-full" />
                      )}
                    </button>
                  )
                })}
              </nav>
              <div className="p-4 border-t border-border-soft">
                <button
                  onClick={() => {
                    onSignOut?.()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-text-mid hover:bg-bg-app rounded transition-colors focus-ring"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-body text-sm">Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}