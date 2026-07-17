import { PageShell } from '../../components/PageShell'
import { motion } from 'framer-motion'
import { Folder, Paperclip, Users, MessageSquare } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDatabase } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'

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

export function Projects() {
  const { user } = useAuth()
  const userId = user?.uid || 'emp-001'
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let unsub: (() => void) | null = null
    getDatabase().then((db: any) => {
      unsub = db.onValue('projects', (snapshot: any) => {
        const data = snapshot.val() as Record<string, Project> | undefined
        if (data) {
          const allProjects = Object.entries(data).map(([id, p]) => ({ ...p, id, members: p.members || [] }))
          const myProjects = allProjects.filter((p) => p.members?.includes(userId))
          setProjects(myProjects)
        } else {
          setProjects([])
        }
        setLoading(false)
      })
    })
    return () => { if (unsub) unsub() }
  }, [userId])

  if (loading) {
    return (
      <PageShell title="My Projects">
        <div className="text-center py-8 text-text-mid">Loading...</div>
      </PageShell>
    )
  }

  return (
    <PageShell title="My Projects">
      {projects.length === 0 ? (
        <div className="text-center py-12 text-text-mid">No projects assigned yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-bg-surface border border-border-soft rounded-xl p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/employee/projects/${project.id}`)}
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
      )}
    </PageShell>
  )
}