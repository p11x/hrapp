import { PageShell } from '../../components/PageShell'

import { Paperclip, MessageSquare, Send } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getDatabase } from '../../firebase/config'
import { hrToast } from '../../components/HRCToast'
import { useAuth } from '../../context/AuthContext'

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

interface Project {
  id: string
  name: string
}

export function Tasks() {
  const { user } = useAuth()
  const userId = user?.uid || 'emp-001'
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Record<string, Project>>({})
  const [loading, setLoading] = useState(true)
  const [taskComments, setTaskComments] = useState<Record<string, TaskComment[]>>({})
  const [activeCommentTask, setActiveCommentTask] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    let unsubTasks: (() => void) | null = null
    let unsubProjects: (() => void) | null = null
    let unsubComments: (() => void) | null = null
    getDatabase().then((db: any) => {
      unsubTasks = db.onValue('tasks', (snapshot: any) => {
        const data = snapshot.val() as Record<string, Task> | undefined
        if (data) {
          setTasks(Object.entries(data).map(([id, t]) => ({ ...t, id })))
        } else {
          setTasks([])
        }
        setLoading(false)
      })

      unsubProjects = db.onValue('projects', (snapshot: any) => {
        const data = snapshot.val() as Record<string, Project> | undefined
        if (data) setProjects(data)
      })

      unsubComments = db.onValue('taskComments', (snapshot: any) => {
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

    return () => {
      if (unsubTasks) unsubTasks()
      if (unsubProjects) unsubProjects()
      if (unsubComments) unsubComments()
    }
  }, [])

  const myTasks = tasks.filter(t => t.assignee === userId)
  const todoTasks = myTasks.filter(t => t.status === 'To Do')
  const inProgressTasks = myTasks.filter(t => t.status === 'In Progress')
  const completedTasks = myTasks.filter(t => t.status === 'Completed')

  const handleStatusChange = async (taskId: string, status: 'To Do' | 'In Progress' | 'Completed') => {
    try {
      const db = await getDatabase()
      const task = tasks.find(t => t.id === taskId)
      if (task) {
        await db.update(`tasks/${taskId}`, { status })
        hrToast.success('Status Updated', `Task moved to ${status}`)
      }
    } catch (error: any) {
      hrToast.error('Update Failed', error?.message || 'Could not update task')
    }
  }

  const handleMarkComplete = async (taskId: string) => {
    await handleStatusChange(taskId, 'Completed')
  }

  const handleSendComment = async (taskId: string) => {
    if (!newComment.trim()) return
    const db = await getDatabase()
    const comment: TaskComment = {
      id: `cmt-${Date.now()}`,
      sender: userId,
      text: newComment,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    const existing = taskComments[taskId] || []
    await db.set(`taskComments/${taskId}`, [...existing, comment])
    setNewComment('')
    hrToast.success('Comment Sent', 'Your clarification has been sent')
  }

  return (
    <PageShell title="My Tasks">
      {loading ? (
        <div className="p-6 text-center text-text-mid">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
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
                      {task.projectId && (
                        <span className="px-2 py-0.5 bg-primary-dim text-primary rounded text-xs">
                          {projects[task.projectId]?.name || 'No Project'}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      {task.status !== 'Completed' && (
                        <button
                          onClick={() => handleMarkComplete(task.id)}
                          className="px-2 py-1 rounded text-xs font-medium focus-ring bg-accent-mint/10 text-accent-mint"
                        >
                          Mark Complete
                        </button>
                      )}
                      <button
                        onClick={() => setActiveCommentTask(task.id)}
                        className="p-1 rounded hover:bg-bg-app focus-ring"
                        aria-label="Clarify"
                      >
                        <MessageSquare className="w-3 h-3 text-text-low" />
                      </button>
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as 'To Do' | 'In Progress' | 'Completed')}
                        className="px-2 py-1 text-xs border border-border-soft rounded focus-ring"
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeCommentTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface border border-border-soft rounded-xl w-full max-w-lg mx-4 flex flex-col h-96">
            <div className="p-4 border-b border-border-soft">
              <div className="font-display font-semibold text-text-hi">Task Clarifications</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(taskComments[activeCommentTask] || []).map((c) => (
                <div key={c.id} className={`flex ${c.sender === userId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-2 rounded-lg text-sm ${
                    c.sender === userId
                      ? 'bg-primary text-white'
                      : 'bg-bg-app border border-border-soft'
                  }`}>
                    {c.text}
                    <div className={`text-xs mt-1 ${c.sender === userId ? 'text-white/70' : 'text-text-low'}`}>
                      {c.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              {(taskComments[activeCommentTask] || []).length === 0 && (
                <div className="text-center text-text-mid text-sm">No comments yet.</div>
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
    </PageShell>
  )
}