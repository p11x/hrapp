import { PageShell } from '../../components/PageShell'
import { motion } from 'framer-motion'
import { ChevronLeft, Plus, UserPlus, Check, Edit, MessageSquare, Send } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { hrToast } from '../../components/HRCToast'
import { getDatabase } from '../../firebase/config'

interface Project {
  id: string
  name: string
  category: string
  status: 'Started' | 'Approval' | 'Completed'
  progress: number
  dueDate: string
  daysLeft: number
  members: string[]
  attachments: number
  comments: number
}

interface Task {
  id: string
  title: string
  description: string
  status: 'To Do' | 'In Progress' | 'Completed'
  projectId: string
  assignee?: string
  attachments: number
  comments: number
}

interface TaskComment {
  id: string
  sender: string
  text: string
  timestamp: string
}

interface Employee {
  id: string
  name: string
  position: string
}

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [employees, setEmployees] = useState<Record<string, Employee>>({})
  const [loading, setLoading] = useState(true)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showEditProject, setShowEditProject] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskComments, setTaskComments] = useState<Record<string, TaskComment[]>>({})
  const [activeCommentTask, setActiveCommentTask] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const db = await getDatabase()
      const projectData = await (db as any).get(`projects/${projectId}`)
      const employeesData = await (db as any).get('employees')

      if (projectData.exists()) {
        setProject(projectData.val() as Project)
      }

      if (employeesData.exists()) {
        setEmployees(employeesData.val() as Record<string, Employee>)
      }
      setLoading(false)
    }

    const unsubs: Array<() => void> = []
    getDatabase().then((db: any) => {
      unsubs.push(db.onValue('tasks', (snapshot: any) => {
        const allTasks = snapshot.val() as Record<string, Task> | undefined
        if (allTasks) {
          const projectTasks = Object.entries(allTasks)
            .filter(([, t]) => (t as Task).projectId === projectId)
            .map(([id, task]) => ({ ...(task as Task), id }))
          setTasks(projectTasks)
        } else {
          setTasks([])
        }
      }))

      unsubs.push(db.onValue('taskComments', (snapshot: any) => {
        const data = snapshot.val() as Record<string, Record<string, TaskComment>> | undefined
        if (data) {
          const formatted: Record<string, TaskComment[]> = {}
          Object.entries(data).forEach(([taskId, comments]) => {
            formatted[taskId] = Object.values(comments || {})
          })
          setTaskComments(formatted)
        } else {
          setTaskComments({})
        }
      }))
    })

    if (projectId) {
      fetchData()
    }
    return () => { unsubs.forEach(u => u()) }
  }, [projectId])

  const handleAssignMember = async (empId: string) => {
    if (!project) return
    const currentMembers = project.members || []
    if (!currentMembers.includes(empId)) {
      const db = await getDatabase()
      await (db as any).set(`projects/${projectId}/members`, [...currentMembers, empId])
      setProject({ ...project, members: [...currentMembers, empId] })
      hrToast.success('Member Assigned', 'Team member added to project')
    }
    setShowAssignModal(false)
  }

  const handleRemoveMember = async (empId: string) => {
    if (!project) return
    const db = await getDatabase()
    const updatedMembers = (project.members || []).filter(id => id !== empId)
    await (db as any).set(`projects/${projectId}/members`, updatedMembers)
    setProject({ ...project, members: updatedMembers })
    hrToast.success('Member Removed', 'Team member removed from project')
  }

  const handleEditProject = async (updatedProject: Partial<Project>) => {
    if (!project) return
    const db = await getDatabase()
    await (db as any).set(`projects/${projectId}`, { ...project, ...updatedProject })
    setProject({ ...project, ...updatedProject })
    hrToast.success('Project Updated', 'Project details saved')
    setShowEditProject(false)
  }

  const handleTaskSubmit = async (taskData: { title: string; assignee: string; status: 'To Do' | 'In Progress' | 'Completed' }) => {
    const db = await getDatabase()
    if (editingTask) {
      await (db as any).set(`tasks/${editingTask.id}`, { ...editingTask, ...taskData })
      hrToast.success('Task Updated', 'Task updated successfully')
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: taskData.title,
        description: '',
        status: taskData.status,
        projectId: projectId || '',
        assignee: taskData.assignee,
        attachments: 0,
        comments: 0,
      }
      await (db as any).set(`tasks/${newTask.id}`, newTask)
      hrToast.success('Task Created', 'New task added to project')
    }
    setShowTaskModal(false)
    setEditingTask(null)
  }

  const handleMarkComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      const db = await getDatabase()
      await (db as any).set(`tasks/${taskId}`, { ...task, status: 'Completed' })
      hrToast.success('Task Completed', 'Task marked as complete')
    }
  }

  const handleSendComment = async (taskId: string) => {
    if (!newComment.trim()) return
    const db = await getDatabase()
    const comment: TaskComment = {
      id: `cmt-${Date.now()}`,
      sender: 'admin',
      text: newComment,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    const existing = taskComments[taskId] || []
    await (db as any).set(`taskComments/${taskId}`, [...existing, comment])
    setNewComment('')
    hrToast.success('Comment Sent', 'Your clarification has been sent')
  }

  if (loading) {
    return (
      <PageShell title="Project Detail">
        <div className="text-center py-8 text-text-mid">Loading...</div>
      </PageShell>
    )
  }

  if (!project) {
    return (
      <PageShell title="Project Detail">
        <div className="text-center py-8 text-text-mid">Project not found</div>
      </PageShell>
    )
  }

  return (
    <PageShell title={project.name}>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-bg-app transition-colors focus-ring"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5 text-text-low" />
        </button>
        <div>
          <h2 className="text-xl font-display font-semibold text-text-hi">{project.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              project.status === 'Completed' ? 'bg-accent-mint/20 text-accent-mint' :
              project.status === 'Approval' ? 'bg-accent-amber/20 text-accent-amber' :
              'bg-primary-dim text-primary'
            }`}>
              {project.status}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              project.daysLeft > 0 ? 'bg-primary-dim text-primary' : 'bg-accent-mint/20 text-accent-mint'
            }`}>
              {project.daysLeft > 0 ? `${project.daysLeft} Days Left` : 'Completed'}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="w-full h-2 bg-bg-app rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      <div className="space-y-4">
        <motion.div
          className="bg-bg-surface border-l-4 border-accent-mint rounded-xl p-6"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-semibold text-text-hi">Team</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditProject(true)}
                className="px-3 py-1.5 border border-border-soft rounded text-sm font-medium hover:bg-bg-app transition-colors focus-ring flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                Edit Project
              </button>
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-3 py-1.5 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 transition-colors focus-ring flex items-center gap-1"
              >
                <UserPlus className="w-4 h-4" />
                Assign Member
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {project.members.map((memId) => (
              <div key={memId} className="flex items-center gap-2 bg-bg-app rounded-lg px-2 py-1">
                <div className="w-8 h-8 rounded-full bg-accent-mint flex items-center justify-center text-white text-xs font-mono">
                  {employees[memId]?.name?.split(' ').map(n => n[0]).join('') || '?'}
                </div>
                <div>
                  <div className="font-body text-text-hi text-sm">{employees[memId]?.name}</div>
                  <div className="text-text-mid text-xs">{employees[memId]?.position}</div>
                </div>
                <button
                  onClick={() => handleRemoveMember(memId)}
                  className="ml-1 p-1 rounded hover:bg-accent-amber/20 text-accent-amber text-xs focus-ring"
                  title="Remove member"
                >
                  ×
                </button>
              </div>
            ))}
            {project.members.length === 0 && (
              <span className="text-text-mid">No members assigned</span>
            )}
          </div>
        </motion.div>

        <motion.div
          className="bg-bg-surface border-l-4 border-primary rounded-xl p-6"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-semibold text-text-hi">Tasks</h3>
            <button
              onClick={() => setShowTaskModal(true)}
              className="px-3 py-1.5 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 transition-colors focus-ring flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
          <div className="space-y-3">
            {tasks.length === 0 && (
              <div className="text-center py-4 text-text-mid">No tasks yet</div>
            )}
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-bg-app rounded-lg">
                <div className="flex-1">
                  <div className="font-body font-medium text-text-hi">{task.title}</div>
                  <div className="text-text-mid text-xs flex items-center gap-2 mt-1">
                    <span>{employees[task.assignee || '']?.name || 'Unassigned'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    task.status === 'Completed' ? 'bg-accent-mint/20 text-accent-mint' :
                    task.status === 'In Progress' ? 'bg-primary-dim text-primary' :
                    'bg-accent-amber/20 text-accent-amber'
                  }`}>
                    {task.status}
                  </span>
                  <button
                    onClick={() => setActiveCommentTask(task.id)}
                    className="p-1.5 rounded hover:bg-bg-app transition-colors focus-ring"
                    aria-label="Clarify"
                  >
                    <MessageSquare className="w-4 h-4 text-text-low" />
                  </button>
                  {task.status !== 'Completed' && (
                    <button
                      onClick={() => handleMarkComplete(task.id)}
                      className="p-1.5 rounded hover:bg-bg-app transition-colors focus-ring"
                      aria-label="Mark Complete"
                    >
                      <Check className="w-4 h-4 text-accent-mint" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingTask(task)
                      setShowTaskModal(true)
                    }}
                    className="p-1.5 rounded hover:bg-bg-app transition-colors focus-ring"
                    aria-label="Edit"
                  >
                    <Edit className="w-4 h-4 text-text-low" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {activeCommentTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface border border-border-soft rounded-xl w-full max-w-lg mx-4 flex flex-col h-96">
            <div className="p-4 border-b border-border-soft">
              <div className="font-display font-semibold text-text-hi">Task Clarifications</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(taskComments[activeCommentTask] || []).map((c) => (
                <div key={c.id} className={`flex ${c.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-2 rounded-lg text-sm ${
                    c.sender === 'admin'
                      ? 'bg-primary text-white'
                      : 'bg-bg-app border border-border-soft'
                  }`}>
                    {c.text}
                    <div className={`text-xs mt-1 ${c.sender === 'admin' ? 'text-white/70' : 'text-text-low'}`}>
                      {c.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              {(taskComments[activeCommentTask] || []).length === 0 && (
                <div className="text-center text-text-mid text-sm">No comments yet. Start the conversation.</div>
              )}
            </div>
            <div className="p-4 border-t border-border-soft">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type a clarification..."
                  className="flex-1 px-3 py-2 border border-border-soft rounded text-sm focus-ring"
                />
                <button
                  onClick={() => handleSendComment(activeCommentTask)}
                  className="px-3 py-2 bg-primary text-white rounded focus-ring"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button
              onClick={() => setActiveCommentTask(null)}
              className="p-2 text-text-mid text-sm hover:text-text-hi"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface border border-border-soft rounded-xl p-6 w-80">
            <h3 className="text-lg font-display font-semibold text-text-hi mb-4">Select Team Member</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {Object.entries(employees).map(([id, emp]) => (
                <button
                  key={id}
                  onClick={() => handleAssignMember(id)}
                  className="w-full flex items-center gap-3 p-2 rounded hover:bg-bg-app transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-accent-mint flex items-center justify-center text-white text-xs font-mono">
                    {emp.name?.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="font-body text-text-hi">{emp.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAssignModal(false)}
              className="mt-4 w-full px-4 py-2 border border-border-soft rounded text-sm focus-ring"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface border border-border-soft rounded-xl p-6 w-96">
            <h3 className="text-lg font-display font-semibold text-text-hi mb-4">
              {editingTask ? 'Edit Task' : 'Add Task'}
            </h3>
            <TaskForm
              task={editingTask}
              employees={employees}
              onSubmit={handleTaskSubmit}
              onCancel={() => {
                setShowTaskModal(false)
                setEditingTask(null)
              }}
            />
          </div>
        </div>
      )}

      {showEditProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface border border-border-soft rounded-xl p-6 w-96">
            <h3 className="text-lg font-display font-semibold text-text-hi mb-4">Edit Project</h3>
            <EditProjectModal
              project={project}
              onSubmit={handleEditProject}
              onCancel={() => setShowEditProject(false)}
            />
          </div>
        </div>
      )}
    </PageShell>
  )
}

function TaskForm({
  task,
  employees,
  onSubmit,
  onCancel,
}: {
  task?: Task | null
  employees: Record<string, Employee>
  onSubmit: (data: { title: string; assignee: string; status: 'To Do' | 'In Progress' | 'Completed' }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(task?.title || '')
  const [assignee, setAssignee] = useState(task?.assignee || '')
  const [status, setStatus] = useState<'To Do' | 'In Progress' | 'Completed'>(task?.status || 'To Do')

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-body text-text-low mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-border-soft rounded focus-ring text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-body text-text-low mb-1">Assignee</label>
        <select
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="w-full px-3 py-2 border border-border-soft rounded focus-ring text-sm"
        >
          <option value="">Select assignee</option>
          {Object.entries(employees).map(([id, emp]) => (
            <option key={id} value={id}>{emp.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-body text-text-low mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'To Do' | 'In Progress' | 'Completed')}
          className="w-full px-3 py-2 border border-border-soft rounded focus-ring text-sm"
        >
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSubmit({ title, assignee, status })}
          className="flex-1 px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 transition-colors focus-ring"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-border-soft rounded text-sm focus-ring"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function EditProjectModal({
  project,
  onSubmit,
  onCancel,
}: {
  project: Project
  onSubmit: (data: Partial<Project>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(project.name)
  const [category, setCategory] = useState(project.category)
  const [progress, setProgress] = useState(project.progress)

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-body text-text-low mb-1">Project Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-border-soft rounded focus-ring text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-body text-text-low mb-1">Category</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-border-soft rounded focus-ring text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-body text-text-low mb-1">Progress (%)</label>
        <input
          type="number"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="w-full px-3 py-2 border border-border-soft rounded focus-ring text-sm"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSubmit({ name, category, progress })}
          className="flex-1 px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 transition-colors focus-ring"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-border-soft rounded text-sm focus-ring"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}