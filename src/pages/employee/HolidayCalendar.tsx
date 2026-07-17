import { PageShell } from '../../components/PageShell'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns'
import { useState, useEffect } from 'react'
import { getDatabase } from '../../firebase/config'

interface HolidayEvent {
  id: string
  date: string
  name: string
  type: 'national' | 'optional' | 'observance'
}

export function HolidayCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [holidays, setHolidays] = useState<HolidayEvent[]>([])

  useEffect(() => {
    let unsub: (() => void) | null = null
    getDatabase().then((db: any) => {
      unsub = db.onValue('holidays', (snapshot: any) => {
        const data = snapshot.val() as Record<string, Omit<HolidayEvent, 'id'>> | undefined
        if (data) {
          setHolidays(Object.entries(data).map(([id, h]) => ({ ...h, id } as HolidayEvent)))
        } else {
          setHolidays([])
        }
      })
    })
    return () => { if (unsub) unsub() }
  }, [])

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const today = format(new Date(), 'yyyy-MM-dd')

  const getHolidayTypeColor = (type: string) => {
    switch (type) {
      case 'national':
        return 'bg-accent-mint'
      case 'optional':
        return 'bg-accent-amber'
      case 'observance':
        return 'bg-accent-coral'
      default:
        return 'bg-primary'
    }
  }

  return (
    <PageShell title="Holiday Calendar">
      <div className="bg-surface border border-border-soft rounded-xl">
        <div className="flex items-center justify-between p-4 border-b border-border-soft">
          <h3 className="text-xl font-display font-semibold text-text-hi">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="p-2 rounded-lg border border-border-soft hover:bg-bg-app transition-colors focus-ring"
            >
              <ChevronLeft className="w-4 h-4 text-text-mid" />
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium focus-ring"
            >
              Today
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="p-2 rounded-lg border border-border-soft hover:bg-bg-app transition-colors focus-ring"
            >
              <ChevronRight className="w-4 h-4 text-text-mid" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 p-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-text-low font-mono text-xs py-2">
              {d}
            </div>
          ))}

          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const holiday = holidays.find((h) => h.date === dateStr)
            const isToday = dateStr === today

            return (
              <motion.div
                key={dateStr}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg border font-mono text-sm relative p-1 ${
                  isToday ? 'bg-primary-dim border-primary' : 'bg-surface border-border-soft'
                }`}
                whileHover={{ scale: holiday ? 1.05 : 1.02 }}
              >
                <span className={isToday ? 'text-primary font-medium' : 'text-text-hi'}>{format(day, 'd')}</span>
                {holiday && (
                  <div className={`w-full h-1.5 rounded-full mt-1 ${getHolidayTypeColor(holiday.type)}`} />
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </PageShell>
  )
}