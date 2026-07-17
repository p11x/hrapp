import { useState, useEffect, useMemo, useCallback } from 'react'
import { PageShell } from '../../components/PageShell'
import { getDatabase } from '../../firebase/config'
import { hrToast } from '../../components/HRCToast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  User,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Clock,
  CheckCircle2,
  Clock3,
  CalendarDays,
  Activity
} from 'lucide-react'

interface Employee {
  id: string
  name: string
  companyName: string
  position: string
  avatar: string
}

interface AttendanceDayRecord {
  status: 'present' | 'half-day' | 'absent' | 'late'
  clockIn?: string
  clockOut?: string
  checkInTime?: string
  checkOutTime?: string
}

type AttendanceRecord = Record<string, AttendanceDayRecord> // dateString -> record
type AllAttendanceRecords = Record<string, AttendanceRecord> // employeeId -> AttendanceRecord


const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const years = [2024, 2025, 2026, 2027]

// Deterministic mock generator for beautiful pre-populated data
const generateMockAttendanceForMonth = (employeeId: string, year: number, month: number, isTestEmployee: boolean): AttendanceRecord => {
  const records: AttendanceRecord = {}
  const totalDays = new Date(year, month + 1, 0).getDate()
  
  if (!isTestEmployee) return records; // Return 0 attendance for new employees

  const seed = Array.from(employeeId).reduce((acc, char) => acc + char.charCodeAt(0), 0) || 1

  for (let d = 1; d <= totalDays; d++) {
    const dayOfWeek = new Date(year, month, d).getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) continue // Weekends are skipped by default

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const rand = (d * seed * 17) % 100

    if (rand < 75) {
      records[dateStr] = { status: 'present', clockIn: '09:00 AM', clockOut: '05:30 PM' }
    } else if (rand < 85) {
      records[dateStr] = { status: 'late', clockIn: '10:15 AM', clockOut: '06:00 PM' }
    } else if (rand < 92) {
      records[dateStr] = { status: 'half-day', clockIn: '09:00 AM', clockOut: '01:00 PM' }
    } else {
      records[dateStr] = { status: 'absent' }
    }
  }
  return records
}

export function AttendanceViewer() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendanceDb, setAttendanceDb] = useState<AllAttendanceRecords>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(6) // July (0-indexed)
  const [selectedYear, setSelectedYear] = useState(2026) // Default 2026
  
  // Calendar Dialog and Selection states
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  
  // Day editor states
  const [editStatus, setEditStatus] = useState<'present' | 'half-day' | 'absent' | 'late' | 'clear'>('present')
  const [editClockIn, setEditClockIn] = useState('09:00 AM')
  const [editClockOut, setEditClockOut] = useState('05:30 PM')

  // Real-time listener for database
  useEffect(() => {
    let unsubEmp: (() => void) | null = null
    let unsubAtt: (() => void) | null = null

    getDatabase().then((db: any) => {
      // 1. Listen to employees
      unsubEmp = db.onValue('employees', (snapshot: any) => {
        const data = snapshot.val()
        if (data) {
          const loaded: Employee[] = Object.entries(data).map(([id, emp]: [string, any]) => ({
            id,
            name: emp.name || emp.fullName || 'Unnamed Employee',
            companyName: emp.companyName || emp.department || 'Acme Corp',
            position: emp.position || 'Staff',
            avatar: (emp.name || emp.fullName || 'EE').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
          }))
          setEmployees(loaded)
        } else {
          setEmployees([])
        }
      })

      // 2. Listen to attendance
      unsubAtt = db.onValue('attendance', (snapshot: any) => {
        const data = snapshot.val()
        if (data) {
          setAttendanceDb(data as AllAttendanceRecords)
        } else {
          setAttendanceDb({})
        }
      })
    })

    return () => {
      if (unsubEmp) unsubEmp()
      if (unsubAtt) unsubAtt()
    }
  }, [])

  // Helper to obtain attendance for an employee and specific day, merging mock data
  const getDayRecord = useCallback((employeeId: string, dateStr: string): AttendanceDayRecord | undefined => {
    // 1. Try real database record
    if (attendanceDb[employeeId]?.[dateStr]) {
      return attendanceDb[employeeId][dateStr]
    }
    
    // 2. Otherwise generate deterministically so the UI always has realistic records
    const [year, month] = dateStr.split('-').map(Number)
    const emp = employees.find(e => e.id === employeeId)
    const isTestEmployee = emp?.name === 'Sunny' || emp?.name === 'Pavan'
    const mockRecord = generateMockAttendanceForMonth(employeeId, year, month - 1, isTestEmployee)
    return mockRecord[dateStr]
  }, [attendanceDb, employees])

  // Calculate statistics for each employee for the currently selected month
  const statsByEmployee = useMemo(() => {
    const totalDaysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    
    return employees.reduce((acc, emp) => {
      let present = 0
      let halfDay = 0
      let absent = 0
      let late = 0
      let totalWorkdays = 0

      for (let d = 1; d <= totalDaysInMonth; d++) {
        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const dayOfWeek = new Date(selectedYear, selectedMonth, d).getDay()
        const record = getDayRecord(emp.id, dateStr)

        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          totalWorkdays++
        }

        if (record) {
          if (record.status === 'present') present++
          else if (record.status === 'half-day') halfDay++
          else if (record.status === 'absent') absent++
          else if (record.status === 'late') late++
        }
      }

      // Calculation of Attendance Rate: Present counts as 100%, Late counts as 100%, Half-day as 50%
      const attendanceScore = present + late + (halfDay * 0.5)
      const rate = totalWorkdays > 0 ? Math.round((attendanceScore / totalWorkdays) * 100) : 100

      acc[emp.id] = { present, halfDay, absent, late, rate, totalWorkdays }
      return acc
    }, {} as Record<string, { present: number; halfDay: number; absent: number; late: number; rate: number; totalWorkdays: number }>)
  }, [employees, selectedMonth, selectedYear, getDayRecord])

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [employees, searchQuery])

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(y => y - 1)
    } else {
      setSelectedMonth(m => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(y => y + 1)
    } else {
      setSelectedMonth(m => m + 1)
    }
  }

  // Pre-load day editor form fields when calendar day is selected
  useEffect(() => {
    if (selectedEmployee && selectedDay) {
      const record = getDayRecord(selectedEmployee.id, selectedDay)
      if (record) {
        setEditStatus(record.status)
        setEditClockIn(record.clockIn || record.checkInTime || '09:00 AM')
        setEditClockOut(record.clockOut || record.checkOutTime || '05:30 PM')
      } else {
        setEditStatus('clear')
        setEditClockIn('09:00 AM')
        setEditClockOut('05:30 PM')
      }
    }
  }, [selectedEmployee, selectedDay, getDayRecord])

  // Save the attendance modification back to real database
  const handleSaveAttendance = async () => {
    if (!selectedEmployee || !selectedDay) return

    try {
      const db = await getDatabase()
      const path = `attendance/${selectedEmployee.id}/${selectedDay}`
      
      if (editStatus === 'clear') {
        await db.remove(path)
        hrToast.show({
          type: 'info',
          title: 'Attendance Reset',
          description: `Attendance record cleared for ${selectedEmployee.name} on ${selectedDay}`
        })
      } else {
        const updateData: AttendanceDayRecord = {
          status: editStatus,
          clockIn: editClockIn,
          clockOut: editClockOut,
          checkInTime: editClockIn, // support both structures
          checkOutTime: editClockOut
        }
        await db.set(path, updateData)
        hrToast.show({
          type: 'success',
          title: 'Attendance Updated',
          description: `Set status to ${editStatus.toUpperCase()} for ${selectedEmployee.name}`
        })
      }
    } catch (err) {
      console.error(err)
      hrToast.show({
        type: 'error',
        title: 'Update Failed',
        description: 'Unable to save the attendance record'
      })
    }
  }

  // Render Calendar Grid helper math
  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay() // 0 = Sun, 1 = Mon...
    const prevMonthDays = new Date(selectedYear, selectedMonth, 0).getDate()
    
    const cells = []
    
    // Lead days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        dayNum: prevMonthDays - i,
        isCurrentMonth: false,
        dateStr: ''
      })
    }
    
    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({
        dayNum: d,
        isCurrentMonth: true,
        dateStr
      })
    }
    
    // Trailing days of next month to complete the row
    const totalFilled = cells.length
    const trailingCount = totalFilled % 7 === 0 ? 0 : 7 - (totalFilled % 7)
    for (let d = 1; d <= trailingCount; d++) {
      cells.push({
        dayNum: d,
        isCurrentMonth: false,
        dateStr: ''
      })
    }

    return cells
  }, [selectedMonth, selectedYear])

  return (
    <PageShell title="Employee Attendance">
      {/* Overview stats & selectors */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector Buttons */}
          <div className="flex items-center bg-bg-surface border border-border-soft rounded-lg p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-md hover:bg-bg-app text-text-mid hover:text-text-hi transition-colors focus-ring"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 text-sm font-medium text-text-hi min-w-[110px] text-center font-display">
              {months[selectedMonth]} {selectedYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-md hover:bg-bg-app text-text-mid hover:text-text-hi transition-colors focus-ring"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 bg-bg-surface border border-border-soft rounded-lg text-sm font-medium text-text-hi focus-ring"
          >
            {months.map((m, idx) => (
              <option key={m} value={idx}>{m}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 bg-bg-surface border border-border-soft rounded-lg text-sm font-medium text-text-hi focus-ring"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full xl:w-80">
          <Search className="w-4 h-4 text-text-low absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee, company..."
            className="w-full pl-9 pr-4 py-2 bg-bg-surface border border-border-soft rounded-lg text-sm focus-ring text-text-hi"
          />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-bg-surface border border-border-soft rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-text-low text-xs font-body">Total Tracked</div>
            <div className="text-xl font-bold font-display text-text-hi mt-0.5">{employees.length} Employees</div>
          </div>
        </div>

        <div className="bg-bg-surface border border-border-soft rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-accent-mint/10 text-accent-mint rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-text-low text-xs font-body">On-Time Standard</div>
            <div className="text-xl font-bold font-display text-text-hi mt-0.5">9:00 AM</div>
          </div>
        </div>

        <div className="bg-bg-surface border border-border-soft rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-accent-amber/10 text-accent-amber rounded-lg">
            <Clock3 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-text-low text-xs font-body">Month Target</div>
            <div className="text-xl font-bold font-display text-text-hi mt-0.5">{new Date(selectedYear, selectedMonth + 1, 0).getDate()} Days</div>
          </div>
        </div>

        <div className="bg-bg-surface border border-border-soft rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-text-low text-xs font-body font-medium">Average Attendance</div>
            <div className="text-xl font-bold font-display text-text-hi mt-0.5">
              {employees.length > 0
                ? Math.round(Object.values(statsByEmployee).reduce((acc, s) => acc + s.rate, 0) / employees.length)
                : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid View of Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((emp, i) => {
          const stats = statsByEmployee[emp.id] || { present: 0, halfDay: 0, absent: 0, late: 0, rate: 100, totalWorkdays: 22 }
          return (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}
              onClick={() => setSelectedEmployee(emp)}
              className="bg-bg-surface border border-border-soft rounded-xl p-6 cursor-pointer relative overflow-hidden group transition-all duration-300"
            >
              {/* Top Accent Bar based on rate */}
              <div className={`absolute top-0 left-0 right-0 h-1 transition-all ${
                stats.rate >= 90 ? 'bg-accent-mint' :
                stats.rate >= 75 ? 'bg-accent-amber' :
                'bg-accent-coral'
              }`} />

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-mono text-sm font-semibold tracking-wider shadow-inner">
                    {emp.avatar}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-text-hi text-base group-hover:text-primary transition-colors">
                      {emp.name}
                    </h3>
                    <p className="text-xs text-text-low mt-0.5">
                      {emp.position} • <span className="font-medium text-text-mid">{emp.companyName}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xl font-bold font-display ${
                    stats.rate >= 90 ? 'text-accent-mint' :
                    stats.rate >= 75 ? 'text-accent-amber' :
                    'text-accent-coral'
                  }`}>
                    {stats.rate}%
                  </div>
                  <div className="text-[10px] text-text-low font-mono uppercase tracking-wider">Attendance</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-bg-app rounded-full h-1.5 mb-5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.rate}%` }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className={`h-full rounded-full ${
                    stats.rate >= 90 ? 'bg-accent-mint' :
                    stats.rate >= 75 ? 'bg-accent-amber' :
                    'bg-accent-coral'
                  }`}
                />
              </div>

              {/* Status Counters Row */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-bg-app rounded-lg p-2 border border-border-soft/50">
                  <div className="text-accent-mint font-display font-bold text-sm">{stats.present}</div>
                  <div className="text-[10px] text-text-low font-medium">Present</div>
                </div>
                <div className="bg-bg-app rounded-lg p-2 border border-border-soft/50">
                  <div className="text-accent-amber font-display font-bold text-sm">{stats.halfDay}</div>
                  <div className="text-[10px] text-text-low font-medium">Half-Day</div>
                </div>
                <div className="bg-bg-app rounded-lg p-2 border border-border-soft/50">
                  <div className="text-accent-coral font-display font-bold text-sm">{stats.absent}</div>
                  <div className="text-[10px] text-text-low font-medium">Absent</div>
                </div>
                <div className="bg-bg-app rounded-lg p-2 border border-border-soft/50">
                  <div className="text-purple-400 font-display font-bold text-sm">{stats.late}</div>
                  <div className="text-[10px] text-text-low font-medium">Late</div>
                </div>
              </div>

              {/* Hover Cue */}
              <div className="mt-4 pt-3 border-t border-border-soft flex items-center justify-between text-xs text-text-mid group-hover:text-primary transition-colors">
                <span className="flex items-center gap-1.5 font-body">
                  <CalendarDays className="w-3.5 h-3.5" />
                  View & Edit Calendar
                </span>
                <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Interactive Modal showing Calendar & Editing Form */}
      <AnimatePresence>
        {selectedEmployee && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-surface border border-border-soft rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border-soft flex justify-between items-start bg-bg-app">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-mono text-lg font-bold">
                    {selectedEmployee.avatar}
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-semibold text-text-hi">{selectedEmployee.name}</h2>
                    <p className="text-sm text-text-mid mt-0.5">
                      {selectedEmployee.position} • <span className="font-medium">{selectedEmployee.companyName}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-text-low font-mono bg-bg-surface px-2.5 py-1 rounded-md border border-border-soft w-fit">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      Editing Attendance for {months[selectedMonth]} {selectedYear}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedEmployee(null)
                    setSelectedDay(null)
                  }}
                  className="p-1.5 rounded-lg bg-bg-surface hover:bg-bg-app text-text-low hover:text-text-hi transition-colors focus-ring"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body: Split Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                {/* Left Side: Calendar Grid */}
                <div className="lg:col-span-8 p-6 border-r border-border-soft">
                  <div className="grid grid-cols-7 gap-2 mb-3 text-center">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                      <div key={d} className="text-xs font-mono font-bold text-text-low uppercase tracking-wider py-1">
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {calendarCells.map((cell, idx) => {
                      const isSelected = selectedDay === cell.dateStr
                      const record = cell.isCurrentMonth ? getDayRecord(selectedEmployee.id, cell.dateStr) : undefined
                      
                      let statusBg = ''
                      
                      if (record?.status === 'present') {
                        statusBg = 'bg-accent-mint text-white font-medium'
                      } else if (record?.status === 'half-day') {
                        statusBg = 'bg-accent-amber text-white font-medium'
                      } else if (record?.status === 'absent') {
                        statusBg = 'bg-accent-coral text-white font-medium'
                      } else if (record?.status === 'late') {
                        statusBg = 'bg-purple-500 text-white font-medium'
                      } else if (cell.isCurrentMonth) {
                        statusBg = 'bg-bg-app border border-dashed border-border-soft hover:border-text-low text-text-hi'
                      } else {
                        statusBg = 'bg-bg-app/40 text-text-low opacity-40 cursor-not-allowed'
                      }

                      return (
                        <button
                          key={idx}
                          disabled={!cell.isCurrentMonth}
                          onClick={() => setSelectedDay(cell.dateStr)}
                          className={`h-14 rounded-xl flex flex-col justify-between p-2 text-left relative transition-all duration-200 focus-ring ${statusBg} ${
                            isSelected ? 'ring-2 ring-primary ring-offset-2 z-10 scale-[1.03] shadow-md' : ''
                          }`}
                        >
                          <span className="text-xs font-mono">{cell.dayNum}</span>
                          
                          {/* Mini label for weekdays in current month */}
                          {cell.isCurrentMonth && record && (
                            <span className="text-[8px] uppercase tracking-wider font-bold opacity-90 truncate max-w-full">
                              {record.status === 'half-day' ? 'Half' : record.status}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Calendar Legend */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6 p-4 bg-bg-app rounded-xl border border-border-soft">
                    <span className="text-xs font-mono font-bold text-text-low uppercase tracking-wider">Legend:</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-accent-mint rounded-full" />
                      <span className="text-xs text-text-mid font-body">Present</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-accent-amber rounded-full" />
                      <span className="text-xs text-text-mid font-body">Half-Day</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-accent-coral rounded-full" />
                      <span className="text-xs text-text-mid font-body">Absent</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-purple-500 rounded-full" />
                      <span className="text-xs text-text-mid font-body">Late</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Day Editing Form */}
                <div className="lg:col-span-4 p-6 bg-bg-app flex flex-col justify-between">
                  {selectedDay ? (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-mono font-bold text-text-low uppercase tracking-wider">
                          Attendance Editor
                        </h3>
                      </div>

                      <div className="bg-bg-surface border border-border-soft rounded-xl p-4 mb-5">
                        <div className="text-xs text-text-low font-mono">SELECTED DATE</div>
                        <div className="text-sm font-semibold text-text-hi mt-1">
                          {new Date(selectedDay).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>

                      {/* Status Selector */}
                      <div className="mb-5">
                        <label className="block text-xs font-mono font-bold text-text-low uppercase tracking-wider mb-2">
                          STATUS
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'present', label: 'Present', color: 'border-accent-mint/40 text-accent-mint hover:bg-accent-mint/10' },
                            { value: 'late', label: 'Late', color: 'border-purple-400/40 text-purple-400 hover:bg-purple-400/10' },
                            { value: 'half-day', label: 'Half-Day', color: 'border-accent-amber/40 text-accent-amber hover:bg-accent-amber/10' },
                            { value: 'absent', label: 'Absent', color: 'border-accent-coral/40 text-accent-coral hover:bg-accent-coral/10' }
                          ].map((opt) => {
                            const isCurrent = editStatus === opt.value
                            return (
                              <button
                                key={opt.value}
                                onClick={() => setEditStatus(opt.value as any)}
                                className={`px-3 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                                  isCurrent
                                    ? opt.value === 'present' ? 'bg-accent-mint text-white border-accent-mint shadow-sm' :
                                      opt.value === 'late' ? 'bg-purple-500 text-white border-purple-500 shadow-sm' :
                                      opt.value === 'half-day' ? 'bg-accent-amber text-white border-accent-amber shadow-sm' :
                                      'bg-accent-coral text-white border-accent-coral shadow-sm'
                                    : `bg-bg-surface border-border-soft ${opt.color}`
                                }`}
                              >
                                {opt.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Time Inputs */}
                      {editStatus !== 'absent' && editStatus !== 'clear' && (
                        <div className="grid grid-cols-2 gap-3 mb-5">
                          <div>
                            <label className="block text-xs font-mono font-bold text-text-low uppercase tracking-wider mb-1.5">
                              CLOCK IN
                            </label>
                            <input
                              type="text"
                              value={editClockIn}
                              onChange={(e) => setEditClockIn(e.target.value)}
                              placeholder="09:00 AM"
                              className="w-full px-3 py-2 bg-bg-surface border border-border-soft rounded-lg text-xs font-mono text-text-hi focus-ring"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-mono font-bold text-text-low uppercase tracking-wider mb-1.5">
                              CLOCK OUT
                            </label>
                            <input
                              type="text"
                              value={editClockOut}
                              onChange={(e) => setEditClockOut(e.target.value)}
                              placeholder="05:30 PM"
                              className="w-full px-3 py-2 bg-bg-surface border border-border-soft rounded-lg text-xs font-mono text-text-hi focus-ring"
                            />
                          </div>
                        </div>
                      )}

                      {/* Option to clear status entirely */}
                      <button
                        onClick={() => setEditStatus('clear')}
                        className={`w-full py-2 border rounded-lg text-xs font-semibold transition-all ${
                          editStatus === 'clear'
                            ? 'bg-text-hi text-bg-surface border-text-hi shadow-inner'
                            : 'bg-bg-surface border-border-soft text-text-mid hover:text-text-hi hover:border-text-low'
                        }`}
                      >
                        Clear Attendance
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-bg-surface/50 border border-dashed border-border-soft rounded-2xl h-full min-h-[250px]">
                      <CalendarDays className="w-8 h-8 text-text-low mb-3" />
                      <h4 className="text-sm font-semibold text-text-hi">No Day Selected</h4>
                      <p className="text-xs text-text-mid mt-1 max-w-[200px]">
                        Click on any day on the left calendar to edit status or working hours.
                      </p>
                    </div>
                  )}

                  {selectedDay && (
                    <div className="mt-6 pt-4 border-t border-border-soft">
                      <button
                        onClick={handleSaveAttendance}
                        className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-semibold text-sm rounded-xl transition-all shadow-md focus-ring flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Save Day Attendance
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  )
}
