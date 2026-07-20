import { PageShell } from '../../components/PageShell'
import { motion } from 'framer-motion'
import { ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { getDatabase } from '../../firebase/config'

const recentActivity = [
  { id: '1', icon: '📅', label: 'Punch In', time: '09:12 AM' },
  { id: '2', icon: '⏱', label: 'Break Start', time: '01:30 PM' },
  { id: '3', icon: '▶', label: 'Break End', time: '02:00 PM' },
  { id: '4', icon: '📤', label: 'Document Uploaded', time: '03:45 PM' },
]

interface Employee {
  id: string
  name: string
  companyName: string
  position: string
}

export function EmployeesView() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendance, setAttendance] = useState<Record<string, any>>({})

  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    let unsubAttendance: (() => void) | null = null

    getDatabase().then((db: any) => {
      unsubscribe = db.onValue('employees', (snapshot: any) => {
        const data = snapshot.val() as Record<string, { name: string; companyName?: string; department?: string; position: string; role?: string }> | undefined
        if (data) {
          setEmployees(Object.entries(data).map(([id, emp]) => ({
            id,
            name: emp.name,
            companyName: emp.companyName || emp.department || '',
            position: emp.position || emp.role || '',
          })))
        } else {
          setEmployees([])
        }
      })
      unsubAttendance = db.onValue('attendance', (snapshot: any) => {
        const data = snapshot.val()
        if (data) setAttendance(data)
        else setAttendance({})
      })
    })
    return () => {
      if (unsubscribe) unsubscribe()
      if (unsubAttendance) unsubAttendance()
    }
  }, [])

  const { todayStr, weekStart, monthStart } = useMemo(() => {
    let maxDate = ''
    Object.values(attendance).forEach((days: any) => {
       Object.keys(days).forEach(dateStr => {
         if (dateStr > maxDate) maxDate = dateStr
       })
    })
    
    if (!maxDate) {
      maxDate = new Date().toISOString().split('T')[0]
    }

    const d = new Date(maxDate)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    const wStart = new Date(d.setDate(diff)).toISOString().split('T')[0]
    
    const d2 = new Date(maxDate)
    const mStart = new Date(d2.getFullYear(), d2.getMonth(), 1).toISOString().split('T')[0]
    
    return { todayStr: maxDate, weekStart: wStart, monthStart: mStart }
  }, [attendance])

  const utilisationData = useMemo(() => {
    let presentCount = 0
    let lateCount = 0
    let totalCount = employees.length || 1

    Object.entries(attendance).forEach(([_, days]: [string, any]) => {
      if (days && days[todayStr]) {
        const dStatus = days[todayStr].status
        if (dStatus === 'present' || dStatus === 'half-day') {
          presentCount++
        } else if (dStatus === 'late') {
          lateCount++
        }
      }
    })

    const working = presentCount + lateCount
    const offline = Math.max(0, totalCount - working)

    return [
      { name: 'Working', value: working },
      { name: 'Break', value: 0 },
      { name: 'Offline', value: offline },
    ]
  }, [employees, attendance, todayStr])

  const { todayPercentage, weekPercentage, monthPercentage } = useMemo(() => {
    const totalEmployees = employees.length || 1
    
    const todayWorking = utilisationData.find(d => d.name === 'Working')?.value || 0
    const tPercentage = Math.round((todayWorking / totalEmployees) * 100)

    let weekWorkingCount = 0
    let weekTotalCount = 0
    let monthWorkingCount = 0
    let monthTotalCount = 0

    Object.entries(attendance).forEach(([_, days]: [string, any]) => {
      Object.keys(days).forEach(dateStr => {
         const dStatus = days[dateStr].status
         const isWorking = dStatus === 'present' || dStatus === 'half-day' || dStatus === 'late'
         
         if (dateStr >= monthStart && dateStr <= todayStr) {
           monthTotalCount++
           if (isWorking) monthWorkingCount++
         }
         if (dateStr >= weekStart && dateStr <= todayStr) {
           weekTotalCount++
           if (isWorking) weekWorkingCount++
         }
      })
    })
    
    const wPercentage = weekTotalCount === 0 ? 0 : Math.round((weekWorkingCount / weekTotalCount) * 100)
    const mPercentage = monthTotalCount === 0 ? 0 : Math.round((monthWorkingCount / monthTotalCount) * 100)
    
    return {
      todayPercentage: tPercentage,
      weekPercentage: wPercentage,
      monthPercentage: mPercentage
    }
  }, [employees, attendance, utilisationData, todayStr, weekStart, monthStart])

  const utilisationPercentage = todayPercentage

  const yearlyStatusData = useMemo(() => {
    const monthStats: Record<string, { workingDays: number, totalDays: number }> = {}
    
    Object.entries(attendance).forEach(([_, days]: [string, any]) => {
      Object.keys(days).forEach(dateStr => {
        const monthKey = dateStr.substring(0, 7)
        if (!monthStats[monthKey]) {
          monthStats[monthKey] = { workingDays: 0, totalDays: 0 }
        }
        
        monthStats[monthKey].totalDays++
        const dStatus = days[dateStr].status
        if (dStatus === 'present' || dStatus === 'half-day' || dStatus === 'late') {
          monthStats[monthKey].workingDays++
        }
      })
    })

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    const sortedMonths = Object.keys(monthStats).sort()
    let recentMonths = sortedMonths.slice(-6)
    
    if (recentMonths.length === 0) {
      const d = new Date()
      return Array.from({length: 6}).map((_, i) => {
        const date = new Date(d.getFullYear(), d.getMonth() - 5 + i, 1)
        return { name: monthNames[date.getMonth()], hours: 0, progress: 0 }
      })
    }

    return recentMonths.map(monthKey => {
       const stats = monthStats[monthKey]
       const progress = stats.totalDays === 0 ? 0 : Math.round((stats.workingDays / stats.totalDays) * 100)
       const hours = stats.workingDays * 8 
       const date = new Date(monthKey + "-01")
       return {
         name: monthNames[date.getMonth()],
         hours,
         progress
       }
    })
  }, [attendance])

  const handleCardClick = (employeeId: string) => {
    navigate(`/admin/employee/${employeeId}`)
  }

  return (
    <PageShell title="Employees View">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          className="bg-bg-surface border border-border-soft rounded-xl p-6"
          whileHover={{ y: -2 }}
        >
          <h3 className="text-lg font-display font-semibold text-text-hi mb-4">Today Time Utilisation</h3>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={utilisationData}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell fill="#4F46E5" />
                  <Cell fill="#EAEBF3" />
                  <Cell fill="#A0A3B1" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-mono font-bold text-primary">{utilisationPercentage}%</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-bg-surface border border-border-soft rounded-xl p-6"
          whileHover={{ y: -2 }}
        >
          <h3 className="text-lg font-display font-semibold text-text-hi mb-4">Employees Yearly Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={yearlyStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAEBF3" />
                <XAxis dataKey="name" stroke="#A0A3B1" fontSize={12} />
                <YAxis yAxisId="left" stroke="#A0A3B1" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#A0A3B1" fontSize={12} domain={[0, 100]} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="hours" fill="#4F46E5" radius={[4, 4, 4, 4]} barSize={20} />
                <Line yAxisId="right" dataKey="progress" stroke="#F472B6" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="space-y-4 mb-6">
        {[
          { period: 'Today', percentage: todayPercentage },
          { period: 'This Week', percentage: weekPercentage },
          { period: 'This Month', percentage: monthPercentage },
        ].map((item) => (
          <div key={item.period} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-body text-text-mid">{item.period}</span>
              <span className={`px-3 py-1 rounded-full font-mono text-sm ${
                item.percentage >= 80 ? 'bg-accent-mint/20 text-accent-mint' :
                item.percentage >= 60 ? 'bg-accent-amber/20 text-accent-amber' :
                'bg-accent-coral/20 text-accent-coral'
              }`}>
                {item.percentage}%
              </span>
            </div>
            <div className="w-full h-2 bg-bg-app rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  item.percentage >= 80 ? 'bg-accent-mint' :
                  item.percentage >= 60 ? 'bg-accent-amber' :
                  'bg-accent-coral'
                }`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-xl p-6 mb-6">
        <h3 className="text-lg font-display font-semibold text-text-hi mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <span className="font-body text-text-hi">{item.label}</span>
              <span className="ml-auto font-mono text-sm text-text-low">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-display font-semibold text-text-hi mb-4">Employees</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto pr-2">
          {employees.map((emp) => (
            <motion.div
              key={emp.id}
              className="bg-bg-surface border border-border-soft rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
              whileHover={{ y: -2 }}
              onClick={() => handleCardClick(emp.id)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-mono">
                  {emp.name?.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-body font-medium text-text-hi">{emp.name}</div>
                  <div className="text-text-mid text-xs">{emp.position}</div>
                </div>
              </div>
              <div className="text-text-low text-xs">{emp.companyName}</div>
              <div className="flex items-center gap-3 mt-3">
                <Mail className="w-3 h-3 text-text-low" />
                <Phone className="w-3 h-3 text-text-low" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}