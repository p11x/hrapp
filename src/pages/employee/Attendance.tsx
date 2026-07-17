import { PageShell } from '../../components/PageShell'
import { motion } from 'framer-motion'
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Pause, Play } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { getDatabase } from '../../firebase/config'
import { hrToast } from '../../components/HRCToast'
import { useAuth } from '../../context/AuthContext'

const recentActivity = [
  { icon: '📅', label: 'Punch In', time: '09:12 AM' },
  { icon: '⏱', label: 'Break Start', time: '01:30 PM' },
  { icon: '▶', label: 'Break End', time: '02:00 PM' },
]

export function Attendance() {
  const { user } = useAuth()
  const userId = user?.uid || 'emp-001'
  const [punchState, setPunchState] = useState<'in' | 'out'>('out')
  const [activity, setActivity] = useState(recentActivity)
  const [attendance, setAttendance] = useState<Record<string, any>>({})

  useEffect(() => {
    let unsubAll: (() => void) | null = null
    if (user?.uid) {
      getDatabase().then((db: any) => {
        unsubAll = db.onValue(`attendance/${user.uid}`, (snapshot: any) => {
          const data = snapshot.val()
          if (data) setAttendance(data)
          else setAttendance({})
        })
      })
    }
    return () => { if (unsubAll) unsubAll() }
  }, [user?.uid])

  useEffect(() => {
    let unsub: (() => void) | null = null
    if (user?.uid) {
      const today = new Date().toISOString().split('T')[0]
      getDatabase().then((db: any) => {
        unsub = db.onValue(`attendance/${user.uid}/${today}`, (snapshot: any) => {
          const data = snapshot.val()
          if (data && data.checkInTime && !data.checkOutTime) {
            setPunchState('in')
          } else {
            setPunchState('out')
          }
        })
      })
    }
    return () => { if (unsub) unsub() }
  }, [user?.uid])

  const handlePunch = async () => {
    if (!user?.uid) return
    const db = await getDatabase()
    const today = new Date().toISOString().split('T')[0]
    
    if (punchState === 'out') {
      await (db as any).set(`attendance/${userId}/${today}`, {
        checkInTime: new Date().toLocaleTimeString(),
        status: 'present'
      })
      setPunchState('in')
      setActivity([{ icon: '📅', label: 'Punch In', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...activity])
      hrToast.success('Punch In', 'Successfully punched in')
    } else {
      await (db as any).set(`attendance/${userId}/${today}/checkOutTime`, new Date().toLocaleTimeString())
      setPunchState('out')
      setActivity([{ icon: '▶', label: 'Punch Out', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...activity])
      hrToast.success('Punch Out', 'Successfully punched out')
    }
  }

  const yearlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthStats = months.map((monthName) => ({
      name: monthName,
      hours: 0,
      progress: 0,
    }))

    let hasData = false
    Object.entries(attendance).forEach(([dateStr, record]: [string, any]) => {
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        const monthIndex = parseInt(parts[1], 10) - 1
        if (monthIndex >= 0 && monthIndex < 12) {
          hasData = true
          if (record.status === 'present' || record.status === 'late') {
            monthStats[monthIndex].hours += 8
          } else if (record.status === 'half-day') {
            monthStats[monthIndex].hours += 4
          }
        }
      }
    })

    monthStats.forEach((m) => {
      m.progress = Math.min(100, Math.round((m.hours / 160) * 100))
    })

    if (!hasData) {
      return [
        { name: 'Jan', hours: 160, progress: 85 },
        { name: 'Feb', hours: 145, progress: 78 },
        { name: 'Mar', hours: 180, progress: 92 },
        { name: 'Apr', hours: 155, progress: 82 },
        { name: 'May', hours: 170, progress: 88 },
        { name: 'Jun', hours: 165, progress: 85 },
      ]
    }

    const currentMonthIndex = new Date().getMonth()
    return monthStats.slice(0, Math.max(6, currentMonthIndex + 1))
  }, [attendance])

  const progressData = useMemo(() => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()

    let daysInMonth = 0
    let presentDays = 0

    for (let d = 1; d <= today.getDate(); d++) {
      const dayOfWeek = new Date(currentYear, currentMonth, d).getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysInMonth++
      }
    }

    Object.entries(attendance).forEach(([dateStr, record]: [string, any]) => {
      const parts = dateStr.split('-').map(Number)
      if (parts[0] === currentYear && parts[1] === (currentMonth + 1)) {
        if (record.status === 'present' || record.status === 'late' || record.status === 'half-day') {
          presentDays++
        }
      }
    })

    const monthPercent = daysInMonth > 0 ? Math.min(100, Math.round((presentDays / daysInMonth) * 100)) : 0

    const finalMonth = monthPercent || 85
    const finalWeek = punchState === 'in' ? 100 : 80
    const finalToday = punchState === 'in' ? 100 : 0

    return [
      { period: 'Today', percentage: finalToday },
      { period: 'This Week', percentage: finalWeek },
      { period: 'This Month', percentage: finalMonth },
    ]
  }, [attendance, punchState])

  const todayPercentage = useMemo(() => {
    const todayItem = progressData.find(p => p.period === 'Today')
    return todayItem ? todayItem.percentage : 0
  }, [progressData])

  return (
    <PageShell title="Attendance">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          className="bg-bg-surface border border-border-soft rounded-xl p-6"
          whileHover={{ y: -2 }}
        >
          <div className="text-center mb-4">
            <div className="flex items-center justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-accent-mint flex items-center justify-center text-white mr-2">
                📅
              </div>
              <h3 className="text-lg font-display font-semibold text-text-hi">Working Today</h3>
            </div>
            <p className="text-text-mid font-body text-sm mb-6">Punching: {punchState === 'in' ? 'Active' : 'Not started'}</p>
          </div>

          <div className="relative w-48 h-48 mx-auto mb-6">
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
                strokeDashoffset={String(283 - (283 * todayPercentage) / 100)}
                className="transition-all"
              />
              <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="text-xl font-mono font-bold fill-text-hi rotate-0">
                {todayPercentage}%
              </text>
            </svg>
          </div>

          <button 
            onClick={handlePunch}
            className="mx-auto block px-6 py-2 bg-primary text-white rounded-full font-medium flex items-center gap-2 focus-ring"
          >
            {punchState === 'in' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {punchState === 'in' ? 'Punch Out' : 'Punch In'}
          </button>

          <div className="grid grid-cols-2 gap-4 mb-4 mt-6">
            {progressData.map((item) => (
              <div key={item.period} className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent-mint rounded-full" />
                <span className="text-text-mid text-sm font-body">{item.period}</span>
                <span className="ml-auto font-mono text-sm text-text-hi">{item.percentage}%</span>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-border-soft pt-4">
            {activity.map((item) => (
              <div key={item.label} className="flex items-center gap-3 text-sm">
                <span className="text-lg">{item.icon}</span>
                <span className="text-text-hi font-body">{item.label}</span>
                <span className="ml-auto font-mono text-text-mid">{item.time}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="bg-bg-surface border border-border-soft rounded-xl p-6"
          whileHover={{ y: -2 }}
        >
          <h3 className="text-lg font-display font-semibold text-text-hi mb-4">Yearly Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAEBF3" />
                <XAxis dataKey="name" stroke="#A0A3B1" fontSize={12} />
                <YAxis yAxisId="left" stroke="#A0A3B1" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#A0A3B1" fontSize={12} domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="hours" fill="#4F46E5" radius={[4, 4, 4, 4]} barSize={20} />
                <Line yAxisId="right" dataKey="progress" stroke="#F472B6" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </PageShell>
  )
}