import { PageShell } from '../../components/PageShell'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { hrToast } from '../../components/HRCToast'
import { getDatabase } from '../../firebase/config'

interface TimesheetEntry {
  id: string
  employee: string
  project: string
  mon: string
  tue: string
  wed: string
  thu: string
  fri: string
  sat: string
  sun: string
  total: string
}

export function ProjectTimesheet() {
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | null>(null)
  const [formData, setFormData] = useState({
    employee: '',
    project: '',
    mon: '8:00',
    tue: '8:00',
    wed: '8:00',
    thu: '8:00',
    fri: '8:00',
    sat: '0:00',
    sun: '0:00',
  })

  useEffect(() => {
    let unsub: (() => void) | null = null
    getDatabase().then((db: any) => {
      unsub = db.onValue('timesheets', (snapshot: any) => {
        const data = snapshot.val() as Record<string, Omit<TimesheetEntry, 'id'>> | undefined
        if (data) {
          setTimesheets(Object.entries(data).map(([id, ts]) => ({ ...ts, id } as TimesheetEntry)))
        } else {
          setTimesheets([])
        }
      })
    })
    return () => { if (unsub) unsub() }
  }, [])

  const calculateTotal = (data: typeof formData) => {
    const totalMinutes = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].reduce((sum, day) => {
      const [h, m] = (data[day as keyof typeof data] || '0:00').split(':').map(Number)
      return sum + (h * 60 + (m || 0))
    }, 0)
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    return `${hours}:${mins.toString().padStart(2, '0')}`
  }

  const handleSaveEntry = async () => {
    const db = await getDatabase()
    const entry = {
      ...formData,
      total: calculateTotal(formData),
    }

    if (editingEntry) {
      await (db as any).set(`timesheets/${editingEntry.id}`, entry)
      hrToast.success('Timesheet Updated', 'Timesheet entry updated')
    } else {
      const newEntry = { ...entry, id: `ts-${Date.now()}` }
      await (db as any).set(`timesheets/${newEntry.id}`, newEntry)
      hrToast.success('Timesheet Added', 'New timesheet entry created')
    }
    setShowModal(false)
    setEditingEntry(null)
    setFormData({ employee: '', project: '', mon: '8:00', tue: '8:00', wed: '8:00', thu: '8:00', fri: '8:00', sat: '0:00', sun: '0:00' })
  }

  const handleEdit = (ts: TimesheetEntry) => {
    setEditingEntry(ts)
    setFormData({
      employee: ts.employee,
      project: ts.project,
      mon: ts.mon,
      tue: ts.tue,
      wed: ts.wed,
      thu: ts.thu,
      fri: ts.fri,
      sat: ts.sat,
      sun: ts.sun,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    const db = await getDatabase()
    await (db as any).remove(`timesheets/${id}`)
    hrToast.success('Timesheet Deleted', 'Entry removed successfully')
  }

  return (
    <PageShell title="Project Timesheet">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-body text-text-mid">Show</span>
          <select className="px-2 py-1 bg-bg-surface border border-border-soft rounded text-sm focus-ring">
            <option>10 entries</option>
          </select>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors focus-ring"
        >
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-xl overflow-hidden">
        <table className="w-full font-body text-sm">
          <thead className="bg-bg-app">
            <tr>
              <th className="text-left p-4 font-medium text-text-low">EMPLOYEE</th>
              <th className="text-left p-4 font-medium text-text-low">PROJECT</th>
              <th className="text-center p-4 font-medium text-text-low">MON</th>
              <th className="text-center p-4 font-medium text-text-low">TUE</th>
              <th className="text-center p-4 font-medium text-text-low">WED</th>
              <th className="text-center p-4 font-medium text-text-low">THU</th>
              <th className="text-center p-4 font-medium text-text-low">FRI</th>
              <th className="text-center p-4 font-medium text-text-low">SAT</th>
              <th className="text-center p-4 font-medium text-text-low">SUN</th>
              <th className="text-center p-4 font-medium text-text-low">TOTAL</th>
              <th className="text-center p-4 font-medium text-text-low">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {timesheets.map((ts) => (
              <motion.tr
                key={ts.id}
                className="border-t border-border-soft hover:bg-bg-app transition-colors"
                whileHover={{ x: 2 }}
              >
                <td className="p-4 font-mono text-accent-coral">{ts.employee}</td>
                <td className="p-4 text-text-hi">{ts.project}</td>
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                  <td key={day} className="p-4 text-center font-mono text-text-mid">
                    <span className="px-2 py-1 bg-bg-app rounded">{ts[day as keyof TimesheetEntry]}</span>
                  </td>
                ))}
                <td className="p-4 text-center">
                  <span className="px-3 py-1 rounded-full font-mono text-sm bg-accent-mint/20 text-accent-mint">{ts.total}</span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => handleEdit(ts)} className="text-primary hover:text-primary/80 focus-ring" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(ts.id)} className="text-accent-coral hover:text-accent-coral/80 focus-ring" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {timesheets.length === 0 && (
              <tr>
                <td colSpan={11} className="p-4 text-center text-text-mid">No timesheet entries yet</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="p-4 border-t border-border-soft flex justify-between items-center text-sm text-text-mid font-body">
          <span>Showing 1 to {timesheets.length} of {timesheets.length} entries</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 rounded border border-border-soft hover:bg-primary-dim">Previous</button>
            <button className="px-3 py-1 rounded bg-primary text-white">1</button>
            <button className="px-3 py-1 rounded border border-border-soft hover:bg-primary-dim">Next</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface border border-border-soft rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-display font-semibold text-text-hi mb-4">
              {editingEntry ? 'Edit Timesheet' : 'Add Timesheet Entry'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-body text-text-low mb-1">Employee</label>
                <input
                  type="text"
                  value={formData.employee}
                  onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                  className="w-full px-3 py-2 border border-border-soft rounded focus-ring text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-body text-text-low mb-1">Project</label>
                <input
                  type="text"
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  className="w-full px-3 py-2 border border-border-soft rounded focus-ring text-sm"
                />
              </div>
              <div className="grid grid-cols-7 gap-2">
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                  <div key={day}>
                    <label className="block text-xs font-body text-text-low mb-1 uppercase">{day}</label>
                    <input
                      type="text"
                      value={formData[day as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [day]: e.target.value })}
                      className="w-full px-2 py-1 border border-border-soft rounded text-sm focus-ring font-mono"
                      placeholder="8:00"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEntry}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 transition-colors focus-ring"
                >
                  Save
                </button>
                <button
                  onClick={() => { setShowModal(false); setEditingEntry(null) }}
                  className="px-4 py-2 border border-border-soft rounded text-sm focus-ring"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}