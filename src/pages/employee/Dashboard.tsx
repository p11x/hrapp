import { motion } from 'framer-motion'
import {
  Bell,
  Calendar as CalendarIcon,
  FileText,
  Ticket,
  User,
  GraduationCap,
  Banknote,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDatabase } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { hrToast } from '../../components/HRCToast'

interface DocumentStatus {
  uploaded: boolean
}

interface LeaveBalance {
  casual: number
  sick: number
  vacation: number
}

interface TicketItem {
  id: string
  status: 'open' | 'resolved'
}

export function EmployeeDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<Record<string, DocumentStatus>>({})
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null)
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  
  const [personalDetails, setPersonalDetails] = useState<any>(null)
  const [educationDetails, setEducationDetails] = useState<any>(null)
  const [bankDetails, setBankDetails] = useState<any>(null)
  const [employeeDbData, setEmployeeDbData] = useState<any>(null)
  
  const [attendance, setAttendance] = useState<any>(null)
  const [leaves, setLeaves] = useState<any[]>([])

  const userName = user?.email?.split('@')[0] || 'Employee'
  const userId = user?.uid || 'emp-001'

  useEffect(() => {
    let unsubDocs: (() => void) | null = null
    let unsubLeave: (() => void) | null = null
    let unsubTickets: (() => void) | null = null
    let unsubUser: (() => void) | null = null
    let unsubEducation: (() => void) | null = null
    let unsubBank: (() => void) | null = null
    let unsubEmployee: (() => void) | null = null
    let unsubAttendance: (() => void) | null = null
    let unsubLeaves: (() => void) | null = null
    let unsubNotifications: (() => void) | null = null

    getDatabase().then((db: any) => {
      unsubDocs = db.onValue(`Documents/${userId}`, (snapshot: any) => {
        const data = snapshot.val() as Record<string, DocumentStatus> | undefined
        setDocuments(data || {})
      })
      
      unsubNotifications = db.onValue(`notifications/${userId}`, (snapshot: any) => {
        const data = snapshot.val() as Record<string, any> | undefined
        if (data) {
          const unreadCount = Object.values(data).filter(n => !n.read).length
          setUnreadNotifications(unreadCount)
        } else {
          setUnreadNotifications(0)
        }
      })
      
      unsubLeave = db.onValue(`leaveBalance/${userId}`, (snapshot: any) => {
        const data = snapshot.val() as LeaveBalance | undefined
        if (data) setLeaveBalance(data)
      })
      unsubTickets = db.onValue('tickets', (snapshot: any) => {
        const data = snapshot.val() as Record<string, TicketItem> | undefined
        if (data) setTickets(Object.values(data).filter((t) => t.status === 'open'))
      })
      unsubUser = db.onValue(`users/${userId}`, (snapshot: any) => {
        const data = snapshot.val()
        setPersonalDetails(data)
      })
      unsubEducation = db.onValue(`education/${userId}`, (snapshot: any) => {
        const data = snapshot.val()
        setEducationDetails(data)
      })
      unsubBank = db.onValue(`bankDetails/${userId}`, (snapshot: any) => {
        const data = snapshot.val()
        setBankDetails(data)
      })
      unsubEmployee = db.onValue(`employees/${userId}`, (snapshot: any) => {
        const data = snapshot.val()
        setEmployeeDbData(data)
      })
      unsubAttendance = db.onValue(`attendance/${userId}`, (snapshot: any) => {
        const data = snapshot.val()
        setAttendance(data)
      })
      unsubLeaves = db.onValue(`leaves`, (snapshot: any) => {
        const data = snapshot.val()
        if (data) {
          const lvs = Object.values(data).filter((l: any) => l.employeeId === userId && l.status === 'approved')
          setLeaves(lvs)
        } else {
          setLeaves([])
        }
      })
    })

    return () => {
      if (unsubDocs) unsubDocs()
      if (unsubLeave) unsubLeave()
      if (unsubTickets) unsubTickets()
      if (unsubUser) unsubUser()
      if (unsubEducation) unsubEducation()
      if (unsubBank) unsubBank()
      if (unsubEmployee) unsubEmployee()
      if (unsubAttendance) unsubAttendance()
      if (unsubLeaves) unsubLeaves()
      if (unsubNotifications) unsubNotifications()
    }
  }, [userId])

  const requiredDocs = ['aadhaar', 'pan', 'resume', 'photo', 'signature']
  const uploadedCount = requiredDocs.filter(key => documents[key]?.uploaded).length
  const totalDays = (leaveBalance?.casual || 0) + (leaveBalance?.sick || 0) + (leaveBalance?.vacation || 0)
  
  const usedDays = useMemo(() => {
    return leaves.reduce((total, leave) => total + (Number(leave.days) || 0), 0)
  }, [leaves])
  
  const remainingDays = Math.max(0, totalDays - usedDays)

  // Compute punch percentage based on today's attendance (mock logic)
  const punchPercentage = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayAtt = attendance?.[today]
    if (todayAtt?.clockIn) {
      if (todayAtt.clockOut) return 100
      return 50 // Checked in but not out
    }
    return 0
  }, [attendance])

  // Compute trend data
  const dynamicTrendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const result = days.map(d => ({ name: d, value: 0 }))
    
    if (!attendance) return result
    
    // Just mock some variation based on actual attendance entries
    // For a real app we'd map actual dates to days of the week
    const entries = Object.values(attendance)
    let i = 0
    for (const entry of entries) {
      if (i >= 5) break // Mon-Fri
      if ((entry as any).status === 'present') {
        result[i].value = 8
      } else if ((entry as any).status === 'half-day') {
        result[i].value = 4
      }
      i++
    }
    
    return result
  }, [attendance])

  // 4-Step Onboarding calculations
  const isStep1Complete = useMemo(() => !!(personalDetails?.fullName && personalDetails?.phone), [personalDetails])
  const isStep2Complete = useMemo(() => !!(educationDetails?.collegeName && educationDetails?.degree), [educationDetails])
  const isStep3Complete = useMemo(() => uploadedCount === 5, [uploadedCount])
  const isStep4Complete = useMemo(() => !!(bankDetails?.accountNumber && bankDetails?.bankName), [bankDetails])

  const completedSteps = useMemo(() => {
    return [isStep1Complete, isStep2Complete, isStep3Complete, isStep4Complete].filter(Boolean).length
  }, [isStep1Complete, isStep2Complete, isStep3Complete, isStep4Complete])

  const progressPercentage = useMemo(() => completedSteps * 25, [completedSteps])

  const hasEmployeeCode = employeeDbData?.employeeCode || employeeDbData?.employeeId || null
  const assignedCompanyName = employeeDbData?.companyName || personalDetails?.companyName || 'Acme Corp'

  const steps = useMemo(() => [
    {
      id: 1,
      name: 'Personal Details',
      desc: 'Complete your personal profile details',
      isComplete: isStep1Complete,
      path: '/employee/profile',
      icon: User,
    },
    {
      id: 2,
      name: 'Education Details',
      desc: 'Add your qualification details',
      isComplete: isStep2Complete,
      path: '/employee/education',
      icon: GraduationCap,
    },
    {
      id: 3,
      name: 'Document Submission',
      desc: 'Upload 5 required documents',
      isComplete: isStep3Complete,
      path: '/employee/documents',
      icon: FileText,
    },
    {
      id: 4,
      name: 'Bank Details',
      isComplete: isStep4Complete,
      path: '/employee/bank-details',
      icon: Banknote,
    },
  ], [isStep1Complete, isStep2Complete, isStep3Complete, isStep4Complete])

  const handleGenerateCode = async () => {
    try {
      const db = await getDatabase()
      
      // Use employees count to generate a sequential ID
      const empSnap = await db.get('employees')
      let count = 1
      if (empSnap.exists()) {
        count = Object.keys(empSnap.val()).length + 1
      }
      
      const code = 'EMP-' + count.toString().padStart(4, '0')
      const joinDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      
      await db.update(`employees/${userId}`, {
        employeeCode: code,
        employeeId: code,
        joinDate: joinDate,
      })

      await db.update(`users/${userId}`, {
        employeeCode: code,
        employeeId: code,
        joinDate: joinDate,
      })

      hrToast.success('Code Generated!', `Your Employee Code is ${code}`)
    } catch (error: any) {
      console.error('Failed to generate code:', error)
      hrToast.error('Generation Failed', error?.message || 'Unable to generate employee code')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-bg-app"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-semibold text-text-hi">
              Welcome back, {userName}
            </h1>
            <p className="text-text-mid font-body text-sm mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/employee/notifications')}
              className="p-2 rounded-full hover:bg-primary-dim transition-colors relative focus-ring"
            >
              <Bell className="w-5 h-5 text-text-mid" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent-coral rounded-full" />
              )}
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-border-soft">
              <button 
                onClick={() => navigate('/employee/digital-id')}
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium hover:bg-primary-dim transition-colors focus-ring"
                aria-label="View Digital ID"
              >
                <User className="w-5 h-5" />
              </button>
              <span className="text-sm font-body">{userName}</span>
            </div>
          </div>
        </div>

        {/* 4-Step Onboarding Progress Visual */}
        <motion.div
          className="bg-surface border border-border-soft rounded-xl p-6 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-display font-semibold text-text-hi flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Onboarding Profile Completion
              </h2>
              <p className="text-text-mid text-sm font-body mt-1">
                Complete all 4 steps to generate your official Employee Code.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xl font-bold text-primary">{progressPercentage}%</span>
              <span className="text-text-low text-sm font-body">({completedSteps}/4 Steps)</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-border-soft rounded-full h-3 mb-6 relative overflow-hidden">
            <motion.div
              className="bg-primary h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {steps.map((step) => {
              const IconComponent = step.icon
              return (
                <motion.div
                  key={step.id}
                  onClick={() => navigate(step.path)}
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${
                    step.isComplete
                      ? 'bg-accent-mint/5 border-accent-mint/30 hover:border-accent-mint/60'
                      : 'bg-surface border-border-soft hover:border-primary/50 hover:shadow-sm'
                  }`}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      step.isComplete ? 'bg-accent-mint/20 text-accent-mint' : 'bg-primary-dim text-primary'
                    }`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
                      step.isComplete ? 'bg-accent-mint text-white' : 'bg-border-soft text-text-mid'
                    }`}>
                      {step.isComplete ? 'Complete' : `Step ${step.id}`}
                    </span>
                  </div>
                  <h3 className="font-body font-semibold text-text-hi text-sm mb-1">{step.name}</h3>
                  <p className="text-text-mid text-xs font-body mb-3">{step.desc}</p>
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className={step.isComplete ? 'text-accent-mint' : 'text-primary'}>
                      {step.isComplete ? '✓ Verified' : 'Complete Now'}
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 ${step.isComplete ? 'text-accent-mint' : 'text-primary'}`} />
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Code Generation / Completed Status Area */}
          {completedSteps === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-xl border border-dashed flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-2 bg-gradient-to-r from-primary-dim/30 to-accent-mint/10 border-primary/20"
            >
              {!hasEmployeeCode ? (
                <>
                  <div className="flex-1">
                    <h4 className="text-base font-display font-semibold text-text-hi flex items-center gap-2">
                      🎉 Onboarding Complete!
                    </h4>
                    <p className="text-sm text-text-mid font-body mt-1">
                      You have successfully completed all four onboarding steps. You can now generate your official employee code below.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateCode}
                    className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold shadow transition-all flex items-center gap-2 self-start md:self-auto focus-ring animate-pulse"
                  >
                    <Sparkles className="w-4 h-4" /> Generate Employee Code
                  </button>
                </>
              ) : (
                <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base font-display font-semibold text-accent-mint flex items-center gap-1.5">
                      ✓ Profile Completed & Verified
                    </h4>
                    <p className="text-sm text-text-mid font-body mt-1">
                      Your onboarding requirements are fulfilled. Your details have been verified by HR.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="px-4 py-2.5 bg-surface border border-border-soft rounded-lg flex flex-col justify-center">
                      <span className="text-[10px] font-mono font-bold text-text-low uppercase tracking-wider">
                        EMPLOYEE CODE
                      </span>
                      <span className="font-mono font-bold text-text-hi text-base tracking-wider">
                        {hasEmployeeCode}
                      </span>
                    </div>
                    <div className="px-4 py-2.5 bg-surface border border-border-soft rounded-lg flex flex-col justify-center">
                      <span className="text-[10px] font-mono font-bold text-text-low uppercase tracking-wider">
                        ASSIGNED COMPANY
                      </span>
                      <span className="font-body font-semibold text-text-hi text-sm">
                        {assignedCompanyName}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            className="bg-surface border border-border-soft rounded-xl p-4"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded bg-accent-mint/20 flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 text-accent-mint" />
              </div>
              <span className="font-body font-medium text-text-hi">This Month Attendance</span>
            </div>
            <div className="font-mono text-3xl font-bold text-accent-mint">85%</div>
            <div className="text-text-mid text-xs">20/22 days</div>
          </motion.div>

          <motion.div
            className="bg-surface border border-border-soft rounded-xl p-4"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 text-primary" />
              </div>
              <span className="font-body font-medium text-text-hi">Leave Balance</span>
            </div>
            <div className="font-mono text-3xl font-bold text-text-hi">{totalDays}</div>
            <div className="text-text-mid text-xs">total days remaining</div>
          </motion.div>

          <motion.div
            className="bg-surface border border-border-soft rounded-xl p-4"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded bg-accent-amber/20 flex items-center justify-center">
                <Ticket className="w-4 h-4 text-accent-amber" />
              </div>
              <span className="font-body font-medium text-text-hi">Pending Tickets</span>
            </div>
            <div className="font-mono text-3xl font-bold text-accent-amber">{tickets.length}</div>
            <div className="text-text-mid text-xs">awaiting response</div>
          </motion.div>

          <motion.div
            className="bg-surface border border-border-soft rounded-xl p-4"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded bg-accent-coral/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-accent-coral" />
              </div>
              <span className="font-body font-medium text-text-hi">Documents Complete</span>
            </div>
            <div className="font-mono text-3xl font-bold text-text-hi">{uploadedCount}/5</div>
            <div className="text-text-mid text-xs">required documents uploaded</div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <motion.div
            className="lg:col-span-2 bg-surface border border-border-soft rounded-xl p-6"
            whileHover={{ y: -2 }}
          >
            <h3 className="text-lg font-display font-semibold text-text-hi mb-4">My Attendance Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dynamicTrendData}>
                  <defs>
                    <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAEBF3" />
                  <XAxis dataKey="name" stroke="#A0A3B1" fontSize={12} />
                  <YAxis stroke="#A0A3B1" fontSize={12} domain={[0, 10]} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#4F46E5"
                    fill="url(#indigoGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            className="bg-surface border border-border-soft rounded-xl p-6"
            whileHover={{ y: -2 }}
          >
            <h3 className="text-lg font-display font-semibold text-text-hi mb-4">Leave Usage</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Used', value: usedDays },
                      { name: 'Remaining', value: remainingDays },
                    ]}
                    innerRadius={40}
                    outerRadius={60}
                    dataKey="value"
                  >
                    <Cell fill="#4F46E5" />
                    <Cell fill="#EEF0FD" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-primary rounded-full" />
                <span className="text-text-mid text-xs font-body">Used {usedDays}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-primary-dim rounded-full" />
                <span className="text-text-mid text-xs font-body">Remaining {remainingDays}</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <motion.div
            className="bg-surface border border-border-soft rounded-xl p-6"
            whileHover={{ y: -2 }}
          >
            <h3 className="text-lg font-display font-semibold text-text-hi mb-4">Punch Widget</h3>
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#EAEBF3" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="8"
                    strokeDasharray="283"
                    strokeDashoffset={283 - (283 * punchPercentage) / 100}
                    className="transition-all duration-1000"
                  />
                  <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="text-xl font-mono font-bold fill-text-hi" transform="rotate(90 50 50)">
                    {punchPercentage}%
                  </text>
                </svg>
              </div>
              <button onClick={() => navigate('/employee/attendance')} className="px-6 py-2 bg-primary text-white rounded-full font-medium focus-ring">
                Punch Out
              </button>
            </div>
          </motion.div>


        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <motion.div
            className="bg-surface border border-border-soft rounded-xl p-6"
            whileHover={{ y: -2 }}
          >
            <h3 className="text-lg font-display font-semibold text-text-hi mb-4">My Recent Activity</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent-mint rounded-full" />
                <span className="text-text-mid font-mono">09:12</span>
                <span className="text-text-hi font-body">Clocked in</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-signal rounded-full" />
                <span className="text-text-mid font-mono">Yesterday</span>
                <span className="text-text-hi font-body">Leave applied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent-coral rounded-full" />
                <span className="text-text-mid font-mono">2d ago</span>
                <span className="text-text-hi font-body">Document uploaded</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-2 bg-surface border border-border-soft rounded-xl p-6"
            whileHover={{ y: -2 }}
          >
            <h3 className="text-lg font-display font-semibold text-text-hi mb-4">Announcements</h3>
            <div className="space-y-3">
              <div className="border-l-4 border-primary pl-4 py-2">
                <div className="font-body font-medium text-text-hi">Office Closure</div>
                <div className="text-text-mid text-sm mt-1">Dec 25th is a holiday</div>
              </div>
              <div className="border-l-4 border-accent-amber pl-4 py-2">
                <div className="font-body font-medium text-text-hi">Team Lunch</div>
                <div className="text-text-mid text-sm mt-1">Friday team lunch at 1pm</div>
              </div>
              <div className="border-l-4 border-accent-mint pl-4 py-2">
                <div className="font-body font-medium text-text-hi">Welcome New Hires</div>
                <div className="text-text-mid text-sm mt-1">New joiners orientation at 10am</div>
              </div>
            </div>
          </motion.div>
        </div>


      </div>
    </motion.div>
  )
}