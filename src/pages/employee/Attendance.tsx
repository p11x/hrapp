import { PageShell } from '../../components/PageShell'
import { motion } from 'framer-motion'
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Pause, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { getDatabase } from '../../firebase/config'
import { hrToast } from '../../components/HRCToast'
import { useAuth } from '../../context/AuthContext'

const recentActivity = [
  { icon: '📅', label: 'Punch In', time: '09:00 AM' },
  { icon: '⏱', label: 'Break Start', time: '01:00 PM' },
  { icon: '▶', label: 'Break End', time: '02:00 PM' },
  { icon: '▶', label: 'Punch Out', time: '07:00 PM' },
]

export function Attendance() {
  const { user } = useAuth()
  const userId = user?.uid || 'emp-001'
  const [punchState, setPunchState] = useState<'in' | 'out'>('out')
  const [activity, setActivity] = useState(recentActivity)
  const [attendance, setAttendance] = useState<Record<string, any>>({})
  const [weekOffset, setWeekOffset] = useState(0)

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

    const now = new Date()
    if (now.getDay() === 0) {
      hrToast.error('Not Allowed', 'Cannot punch on Sunday (Holiday)')
      return
    }

    const hours = now.getHours()

    const db = await getDatabase()
    const today = now.toISOString().split('T')[0]
    
    if (punchState === 'out') {
      if (hours < 9 || hours >= 13) {
        hrToast.error('Not Allowed', 'Punch in is only allowed from 9:00 AM to 1:00 PM')
        return
      }

      await (db as any).set(`attendance/${userId}/${today}`, {
        checkInTime: now.toLocaleTimeString(),
        status: 'present'
      })
      setPunchState('in')
      setActivity([{ icon: '📅', label: 'Punch In', time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...activity])
      hrToast.success('Punch In', 'Successfully punched in')
    } else {
      if (hours >= 19) {
        hrToast.error('Not Allowed', 'Punch out is only allowed before 7:00 PM')
        return
      }

      await (db as any).set(`attendance/${userId}/${today}/checkOutTime`, now.toLocaleTimeString())
      setPunchState('out')
      setActivity([{ icon: '▶', label: 'Punch Out', time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...activity])
      hrToast.success('Punch Out', 'Successfully punched out')
    }
  }

  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const today = new Date()
    const currentDayOfWeek = today.getDay()
    const distanceToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1
    
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - distanceToMonday - (weekOffset * 7))
    startOfWeek.setHours(0, 0, 0, 0)
    
    const weekStats = days.map((dayName, index) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + index)
      const dateString = date.toISOString().split('T')[0]
      return {
        name: dayName,
        date: dateString,
        hours: 0,
        progress: 0,
      }
    })

    Object.entries(attendance).forEach(([dateStr, record]: [string, any]) => {
      const dayStat = weekStats.find(d => d.date === dateStr)
      if (dayStat) {
        if (record.status === 'present' || record.status === 'late') {
          dayStat.hours += 8
        } else if (record.status === 'half-day') {
          dayStat.hours += 4
        }
      }
    })

    weekStats.forEach((d) => {
      d.progress = Math.min(100, Math.round((d.hours / 8) * 100))
    })

    return weekStats
  }, [attendance, weekOffset])

  const progressData = useMemo(() => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()

    let daysInMonth = 0
    let presentDaysInMonth = 0

    const currentDayOfWeek = today.getDay()
    const distanceToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1
    const startOfThisWeek = new Date(today)
    startOfThisWeek.setDate(today.getDate() - distanceToMonday)
    startOfThisWeek.setHours(0, 0, 0, 0)
    
    let daysInWeek = 0
    let presentDaysInWeek = 0

    for (let d = 1; d <= today.getDate(); d++) {
      const date = new Date(currentYear, currentMonth, d)
      const dayOfWeek = date.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysInMonth++
      }
    }
    
    for (let i = 0; i <= distanceToMonday; i++) {
        const d = new Date(startOfThisWeek)
        d.setDate(startOfThisWeek.getDate() + i)
        if (d.getDay() !== 0 && d.getDay() !== 6) {
           daysInWeek++
        }
    }

    Object.entries(attendance).forEach(([dateStr, record]: [string, any]) => {
      const parts = dateStr.split('-').map(Number)
      if (parts[0] === currentYear && parts[1] === (currentMonth + 1)) {
        if (record.status === 'present' || record.status === 'late' || record.status === 'half-day') {
          presentDaysInMonth++
        }
      }
      
      const recordDate = new Date(parts[0], parts[1] - 1, parts[2])
      if (recordDate >= startOfThisWeek && recordDate <= today) {
          if (record.status === 'present' || record.status === 'late' || record.status === 'half-day') {
              presentDaysInWeek++
          }
      }
    })

    const monthPercent = daysInMonth > 0 ? Math.min(100, Math.round((presentDaysInMonth / daysInMonth) * 100)) : 0
    const weekPercent = daysInWeek > 0 ? Math.min(100, Math.round((presentDaysInWeek / daysInWeek) * 100)) : 0
    
    const todayStr = today.toISOString().split('T')[0]
    const todayRecord = attendance[todayStr]
    
    let todayPercent = 0
    if (punchState === 'in') {
      todayPercent = 100
    } else if (todayRecord && (todayRecord.status === 'present' || todayRecord.status === 'late' || todayRecord.status === 'half-day')) {
      todayPercent = 100
    }

    return [
      { period: 'Today', percentage: todayPercent },
      { period: 'This Week', percentage: weekPercent },
      { period: 'This Month', percentage: monthPercent },
    ]
  }, [attendance, punchState])

  const todayPercentage = useMemo(() => {
    const todayItem = progressData.find(p => p.period === 'Today')
    return todayItem ? todayItem.percentage : 0
  }, [progressData])

  const isSunday = new Date().getDay() === 0
  const currentHour = new Date().getHours()
  const isPunchInWindow = currentHour >= 9 && currentHour < 13
  const showPunchButton = !isSunday && (punchState === 'in' || isPunchInWindow)

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
              <h3 className="text-lg font-display font-semibold text-text-hi">
                {isSunday ? 'Holiday (Sunday)' : 'Working Today'}
              </h3>
            </div>
            {!isSunday && (
              <p className="text-text-mid font-body text-sm mb-6">Punching: {punchState === 'in' ? 'Active' : 'Not started'}</p>
            )}
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

          {showPunchButton ? (
            <button 
              onClick={handlePunch}
              className="mx-auto flex px-6 py-2 bg-primary text-white rounded-full font-medium items-center gap-2 focus-ring"
            >
              {punchState === 'in' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {punchState === 'in' ? 'Punch Out' : 'Punch In'}
            </button>
          ) : !isSunday && punchState === 'out' ? (
            <div className="text-center text-accent-coral text-sm font-semibold">
              Punch In is only available from 9:00 AM to 1:00 PM.
            </div>
          ) : null}

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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-semibold text-text-hi">Weekly Status</h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setWeekOffset(w => w + 1)}
                className="p-1 rounded hover:bg-bg-app transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-text-mid" />
              </button>
              <span className="text-sm font-medium text-text-hi min-w-[85px] text-center">
                {weekOffset === 0 ? 'This Week' : weekOffset === 1 ? 'Last Week' : `${weekOffset} Weeks Ago`}
              </span>
              <button 
                onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
                disabled={weekOffset === 0}
                className={`p-1 rounded transition-colors ${weekOffset === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-bg-app'}`}
              >
                <ChevronRight className="w-5 h-5 text-text-mid" />
              </button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyData}>
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