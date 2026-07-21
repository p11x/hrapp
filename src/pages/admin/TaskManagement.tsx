import { PageShell } from '../../components/PageShell'

import { Check, Edit, Plus, Paperclip, MessageSquare, Send } from 'lucide-react'
import { useState, useEffect } from 'react'
import { hrToast } from '../../components/HRCToast'
import { getDatabase } from '../../firebase/config'

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

interface Project {
  id: string
  name: string
  progress: number
}

export function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [employees, setEmployees] = useState<Record<string, Employee>>({})
  const [removedMembers, setRemovedMembers] = useState<Set<string>>(new Set())
  const [projects, setProjects] = useState<Record<string, Project>>({})
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [activeCommentTask, setActiveCommentTask] = useState<string | null>(null)
  const [taskComments, setTaskComments] = useState<Record<string, TaskComment[]>>({})
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    const unsubs: Array<() => void> = []
    getDatabase().then((db: any) => {
      unsubs.push(db.onValue('tasks', (snapshot: any) => {
        const data = snapshot.val() as Record<string, Task> | undefined
        if (data) {
          setTasks(Object.entries(data).map(([id, t]) => ({ ...t, id })))
        } else {
          setTasks([])
        }
      }))

      unsubs.push(db.onValue('employees', (snapshot: any) => {
        const data = snapshot.val() as Record<string, Employee> | undefined
        if (data) setEmployees(data)
      }))

      unsubs.push(db.onValue('projects', (snapshot: any) => {
        const data = snapshot.val() as Record<string, Project> | undefined
        if (data) setProjects(data)
      }))
    })
    return () => { unsubs.forEach(u => u()) }
  }, [])

  useEffect(() => {
    let unsub: (() => void) | null = null
    getDatabase().then((db: any) => {
      unsub = db.onValue('taskComments', (snapshot: any) => {
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
      })
    })
    return () => { if (unsub) unsub() }
  }, [])

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
        projectId: '',
        assignee: taskData.assignee,
        attachments: 0,
        comments: 0,
      }
      await (db as any).set(`tasks/${newTask.id}`, newTask)
      hrToast.success('Task Created', 'New task added')
    }
    setShowTaskModal(false)
    setEditingTask(null)
  }

  const handleStatusChange = async (taskId: string, status: 'To Do' | 'In Progress' | 'Completed') => {
    try {
      const db = await getDatabase()
      const task = tasks.find(t => t.id === taskId)
      if (task) {
        await (db as any).update(`tasks/${taskId}`, { status })
        hrToast.success('Status Updated', `Task moved to ${status}`)
      }
    } catch (error: any) {
      hrToast.error('Update Failed', error?.message || 'Could not update task')
    }
  }

  const handleMarkComplete = async (taskId: string) => {
    await handleStatusChange(taskId, 'Completed')
  }

  const projectProgress = Object.entries(projects).map(([projectId, p]) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId)
    const completedCount = projectTasks.filter(t => t.status === 'Completed').length
    const progress = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0
    return {
      projectId,
      name: p.name,
      progress,
      color: progress === 100 ? 'bg-accent-mint' : progress >= 70 ? 'bg-primary' : 'bg-accent-amber',
    }
  })

  const inProgressTasks = tasks.filter(t => t.status === 'In Progress')
  const todoTasks = tasks.filter(t => t.status === 'To Do')
  const completedTasks = tasks.filter(t => t.status === 'Completed')

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

  return (
    <PageShell title="Task Management">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text-low mb-2">Task Progress</h3>
          {projectProgress.length === 0 && (
            <div className="text-text-mid text-sm">No projects with tasks</div>
          )}
          {projectProgress.map((proj) => (
            <div key={proj.projectId} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-body text-text-hi">{proj.name}</span>
                <span className="font-mono text-text-mid">{proj.progress}%</span>
              </div>
              <div className="w-full h-2 bg-bg-app rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${proj.color}`} style={{ width: `${proj.progress}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-sm font-medium text-text-low mb-2">Recent Activity</h3>
          <div className="space-y-2 font-mono text-xs">
            <div>10:30 - Alice completed task #12</div>
            <div>09:15 - Bob moved task to review</div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-text-low mb-2">Allocated Members</h3>
          <div className="space-y-2">
            {Object.entries(employees)
              .filter(([id]) => !removedMembers.has(id))
              .slice(0, 2)
              .map(([id, emp]) => (
              <div key={id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent-mint flex items-center justify-center text-white text-xs font-mono">
                    {emp.name[0]}
                  </div>
                  <div>
                    <div className="font-body text-text-hi text-sm">{emp.name}</div>
                    <div className="text-text-mid text-xs">{emp.position}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setRemovedMembers(prev => new Set([...prev, id]))}
                  className="px-2 py-1 rounded-full bg-accent-coral/20 text-accent-coral text-xs font-medium focus-ring"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div />
        <button
          onClick={() => setShowTaskModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium flex items-center gap-2 focus-ring text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{ label: 'To Do', tasks: todoTasks }, { label: 'In Progress', tasks: inProgressTasks }, { label: 'Completed', tasks: completedTasks }].map((column) => (
          <div 
            key={column.label} 
            className="bg-bg-surface border border-border-soft rounded-xl p-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const taskId = e.dataTransfer.getData('taskId')
              if (taskId) {
                handleStatusChange(taskId, column.label as 'To Do' | 'In Progress' | 'Completed')
              }
            }}
          >
            <h3 className="font-display font-semibold text-text-hi mb-4">{column.label}</h3>
            <div className="space-y-3">
              {column.tasks.length === 0 && (
                <div className="text-center py-4 text-text-mid text-xs">No tasks</div>
              )}
              {column.tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                  className="bg-bg-app border-l-4 border-primary rounded-lg p-3 cursor-grab active:cursor-grabbing hover:translate-x-0.5 transition-transform"
                >
                  <h4 className="font-body font-medium text-text-hi text-sm mb-1">{task.title}</h4>
                  <p className="text-text-mid text-xs mb-2">{task.description}</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-low flex items-center gap-1">
                      <Paperclip className="w-3 h-3" /> {task.attachments}
                      <MessageSquare className="w-3 h-3 ml-2" /> {task.comments}
                    </span>
                    <span className="px-2 py-0.5 bg-primary-dim text-primary rounded text-xs">
                      {projects[task.projectId]?.name || 'No Project'}
                    </span>
                  </div>
                  <div className="flex justify-end gap-1 mt-2">
                    {task.status !== 'Completed' && (
                      <button
                        onClick={() => handleMarkComplete(task.id)}
                        className="p-1 rounded hover:bg-bg-app focus-ring"
                        aria-label="Mark Complete"
                      >
                        <Check className="w-3 h-3 text-accent-mint" />
                      </button>
                    )}
                    <button
                      onClick={() => setActiveCommentTask(task.id)}
                      className="p-1 rounded hover:bg-bg-app focus-ring"
                      aria-label="Clarify"
                    >
                      <MessageSquare className="w-3 h-3 text-text-low" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingTask(task)
                        setShowTaskModal(true)
                      }}
                      className="p-1 rounded hover:bg-bg-app focus-ring"
                      aria-label="Edit"
                    >
                      <Edit className="w-3 h-3 text-text-low" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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