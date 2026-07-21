import { PageShell } from '../../components/PageShell'
import { motion } from 'framer-motion'
import { Plus, Phone, Mail, Trash2, Search } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { hrToast } from '../../components/HRCToast'
import { useNavigate } from 'react-router-dom'
import { getDatabase } from '../../firebase/config'

interface Employee {
  id: string
  name: string
  avatar: string
  role: string
  companyName: string
  email: string
  phone: string
  status: string
}

export function Employees() {
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    setLoading(true)
    getDatabase().then((db: any) => {
      unsubscribe = db.onValue('employees', (snapshot: any) => {
        const data = snapshot.val()
        if (data) {
          const loaded: Employee[] = Object.entries(data).map(([id, emp]: [string, any]) => {
            const name = emp.name || emp.fullName || 'Unnamed Employee'
            return {
              id,
              name,
              avatar: name.split(' ').map((n: string) => n ? n[0] : '').join('').slice(0, 2).toUpperCase() || 'E',
              role: emp.position || emp.role || 'Employee',
              companyName: emp.companyName || emp.department || 'Acme Corp',
              email: emp.email || '',
              phone: emp.phone || '',
              status: emp.status || 'Active'
            }
          })
          setEmployees(loaded)
        } else {
          setEmployees([])
        }
        setLoading(false)
      })
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return
    }
    
    try {
      const db = await getDatabase()
      await (db as any).remove(`employees/${id}`)
      await (db as any).remove(`users/${id}`)
      hrToast.success('Deleted', `${name} has been removed.`)
    } catch (error) {
      console.error("Delete failed", error)
      hrToast.error('Error', 'Failed to delete employee')
    }
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            emp.role.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    })
  }, [employees, statusFilter, searchQuery]);

  return (
    <PageShell title="Employee Management">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate('/admin/add-employee')}
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium flex items-center gap-2 focus-ring text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-low" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employees..."
              className="pl-9 pr-4 py-2 rounded-full border border-border-soft bg-bg-surface text-sm focus-ring w-48 md:w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-body text-text-mid">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-bg-surface border border-border-soft rounded-lg text-sm focus-ring text-text-hi"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp, i) => (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-bg-surface border border-border-soft rounded-xl p-6 relative group"
            >
              <div className="absolute top-4 right-4 flex gap-1">
                <button 
                  onClick={() => handleDelete(emp.id, emp.name)}
                  className="p-1.5 rounded hover:bg-bg-app focus-ring text-text-low hover:text-accent-coral opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Employee"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="w-16 h-16 rounded-full bg-accent-mint flex items-center justify-center text-white text-2xl font-mono mb-4">
                {emp.avatar}
              </div>
              <h3 className="text-lg font-display font-semibold text-text-hi mb-1">{emp.name}</h3>
              <p className="text-text-mid text-sm mb-3">{emp.role} • {emp.companyName}</p>

              <div className="flex items-center gap-2 text-text-low text-sm mb-1">
                <Mail className="w-3 h-3" />
                <span className="truncate font-mono">{emp.email}</span>
              </div>
              <div className="flex items-center gap-2 text-text-low text-sm mb-4">
                <Phone className="w-3 h-3" />
                <span className="font-mono">{emp.phone}</span>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                emp.status === 'Active' ? 'bg-accent-mint/20 text-accent-mint' : 'bg-accent-amber/20 text-accent-amber'
              }`}>
                {emp.status}
              </span>

              <div className="flex gap-2 mt-4">
                <button className="flex-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium focus-ring">
                  Message
                </button>
                <button className="flex-1 px-3 py-1.5 border border-border-soft rounded-lg text-sm font-medium focus-ring text-text-hi">
                  Profile
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  )
}
