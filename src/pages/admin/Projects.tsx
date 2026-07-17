import { PageShell } from '../../components/PageShell'
import { motion } from 'framer-motion'
import { Plus, Folder, Paperclip, Users, MessageSquare } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDatabase } from '../../firebase/config'
import { hrToast } from '../../components/HRCToast'

interface Project {
  id: string
  name: string
  category: string
  status: 'Started' | 'Approval' | 'Completed'
  progress: number
  daysLeft: number
  members: string[]
  attachments: number
  comments: number
}

const statusTabs = ['All', 'Started', 'Approval', 'Completed']

export function Projects() {
  const [activeTab, setActiveTab] = useState('All')
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProject, setNewProject] = useState({
    name: '',
    category: 'Web Dev',
    description: '',
  })
  const [createLoading, setCreateLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let unsub: (() => void) | null = null
    getDatabase().then((db: any) => {
      unsub = db.onValue('projects', (snapshot: any) => {
        const data = snapshot.val() as Record<string, Project> | undefined
        if (data) {
          setProjects(Object.entries(data).map(([id, p]) => ({ ...p, id, members: p.members || [] })))
        } else {
          setProjects([])
        }
      })
    })
    return () => { if (unsub) unsub() }
  }, [])

  const filteredProjects = projects.filter((p) => activeTab === 'All' || p.status === activeTab)

  const handleCreateProject = async () => {
    setCreateLoading(true)
    try {
      const db = await getDatabase()
      const projectId = `proj-${Date.now()}`
      const projectData: Project = {
        id: projectId,
        name: newProject.name,
        category: newProject.category,
        status: 'Started',
        progress: 0,
        daysLeft: 30,
        members: [],
        attachments: 0,
        comments: 0,
      }
      await (db as any).set(`projects/${projectId}`, projectData)
      hrToast.success('Project Created', `${newProject.name} has been added`)
      setShowCreateModal(false)
      setNewProject({ name: '', category: 'Web Dev', description: '' })
    } catch (error: any) {
      hrToast.error('Creation Failed', error?.message || 'Unable to create project')
    } finally {
      setCreateLoading(false)
    }
  }

  const categories = ['Web Dev', 'UI/UX', 'Backend', 'App Dev', 'QA']

  return (
    <PageShell title="Projects Management">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                activeTab === tab ? 'bg-primary text-white' : 'bg-bg-surface border border-border-soft text-text-mid'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium flex items-center gap-2 focus-ring text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-bg-surface border border-border-soft rounded-xl p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/admin/projects/${project.id}`)}
          >
            <div className="w-12 h-12 rounded-xl bg-accent-mint flex items-center justify-center text-white text-xl mb-4">
              <Folder className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-display font-semibold text-text-hi mb-1">{project.name}</h3>
            <p className="text-text-mid text-sm mb-4">{project.category}</p>

            <div className="flex items-center justify-between text-text-low text-xs mb-3">
              <div className="flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                <span>{project.attachments}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{project.members.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                <span>{project.comments}</span>
              </div>
            </div>

            <div className="w-full h-2 bg-bg-app rounded-full overflow-hidden mb-3">
              <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress}%` }} />
            </div>

            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                project.daysLeft > 0 ? 'bg-primary-dim text-primary' : 'bg-accent-mint/20 text-accent-mint'
              }`}>
                {project.daysLeft > 0 ? `${project.daysLeft} Days Left` : 'Completed'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface border border-border-soft rounded-xl p-6 w-96">
            <h3 className="text-lg font-display font-semibold text-text-hi mb-4">Create Project</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-mid mb-1">Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border-soft rounded focus-ring text-sm"
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-mid mb-1">Category</label>
                <select
                  value={newProject.category}
                  onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                  className="w-full px-3 py-2 border border-border-soft rounded focus-ring text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateProject}
                  disabled={createLoading || !newProject.name}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 transition-colors focus-ring"
                >
                  {createLoading ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
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