import { PageShell } from '../../components/PageShell'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { hrToast } from '../../components/HRCToast'
import { getDatabase } from '../../firebase/config'

interface Client {
  id: string
  name: string
  avatar: string
  title: string
  email: string
  phone: string
  status: string
  description: string
}

export function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [statusFilter, setStatusFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    status: 'Active',
    description: '',
  })

  useEffect(() => {
    let unsub: (() => void) | null = null
    getDatabase().then((db: any) => {
      unsub = db.onValue('clients', (snapshot: any) => {
        const data = snapshot.val() as Record<string, Omit<Client, 'id'>> | undefined
        if (data) {
          setClients(Object.entries(data).map(([id, c]) => ({ ...c, id } as Client)))
        } else {
          setClients([])
        }
      })
    })
    return () => { if (unsub) unsub() }
  }, [])

  const filteredClients = clients.filter((c) => statusFilter === 'All' || c.status === statusFilter)

  const handleSaveClient = async () => {
    const db = await getDatabase()
    const clientData = {
      ...formData,
      avatar: formData.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??',
    }
    if (editingClient) {
      await (db as any).set(`clients/${editingClient.id}`, clientData)
      hrToast.success('Client Updated', 'Client details updated')
    } else {
      const newClient = { ...clientData, id: `client-${Date.now()}` }
      await (db as any).set(`clients/${newClient.id}`, newClient)
      hrToast.success('Client Added', 'New client created')
    }
    setShowModal(false)
    setEditingClient(null)
    setFormData({ name: '', title: '', email: '', phone: '', status: 'Active', description: '' })
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      title: client.title,
      email: client.email,
      phone: client.phone,
      status: client.status,
      description: client.description,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    const db = await getDatabase()
    await (db as any).remove(`clients/${id}`)
    hrToast.success('Client Deleted', 'Client removed successfully')
  }

  return (
    <PageShell title="Clients List">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium flex items-center gap-2 focus-ring text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-body text-text-mid">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-bg-surface border border-border-soft rounded-lg text-sm focus-ring"
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client, i) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-bg-surface border border-border-soft rounded-xl p-6 relative"
          >
            <div className="absolute top-4 right-4 flex gap-1">
              <button onClick={() => handleEdit(client)} className="p-1.5 rounded hover:bg-bg-app focus-ring" title="Edit">
                <Edit className="w-4 h-4 text-primary" />
              </button>
              <button onClick={() => handleDelete(client.id)} className="p-1.5 rounded hover:bg-bg-app focus-ring" title="Delete">
                <Trash2 className="w-4 h-4 text-accent-coral" />
              </button>
            </div>

            <div className="w-16 h-16 rounded-full bg-accent-mint flex items-center justify-center text-white text-2xl font-mono mb-4">
              {client.avatar}
            </div>

            <h3 className="text-lg font-display font-semibold text-text-hi mb-1">{client.name}</h3>
            <p className="text-text-mid text-sm mb-3">{client.title}</p>

            <p className="text-text-mid text-sm mb-4 line-clamp-2">{client.description}</p>

            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              client.status === 'Active' ? 'bg-accent-mint/20 text-accent-mint' : 'bg-accent-amber/20 text-accent-amber'
            }`}>
              {client.status}
            </span>

            <div className="flex gap-2 mt-4">
              <button className="flex-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium focus-ring">
                Chat
              </button>
              <button className="flex-1 px-3 py-1.5 border border-border-soft rounded-lg text-sm font-medium focus-ring">
                Profile
              </button>
            </div>
          </motion.div>
        ))}
        {filteredClients.length === 0 && (
          <div className="col-span-full text-center py-8 text-text-mid">No clients found</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface border border-border-soft rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-display font-semibold text-text-hi mb-4">
              {editingClient ? 'Edit Client' : 'Add Client'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-body text-text-low mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border-soft rounded focus-ring text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-body text-text-low mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-border-soft rounded focus-ring text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-body text-text-low mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-border-soft rounded focus-ring text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-body text-text-low mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-border-soft rounded focus-ring text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-body text-text-low mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-border-soft rounded focus-ring text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-body text-text-low mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border-soft rounded focus-ring text-sm"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveClient}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 transition-colors focus-ring"
                >
                  Save
                </button>
                <button
                  onClick={() => { setShowModal(false); setEditingClient(null) }}
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