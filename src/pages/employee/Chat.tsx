import { PageShell } from '../../components/PageShell'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Send, Plus, Search } from 'lucide-react'
import { getDatabase } from '../../firebase/config'
import { hrToast } from '../../components/HRCToast'
import { useAuth } from '../../context/AuthContext'

interface Message {
  id: string
  sender: string
  text: string
  timestamp: string
}

interface Thread {
  id: string
  participants: string[]
  messages: Message[]
}

interface Employee {
  id: string
  name: string
}

export function Chat() {
  const { user } = useAuth()
  const userId = user?.uid || 'emp-001'
  const [activeThread, setActiveThread] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [employees, setEmployees] = useState<Record<string, Employee>>({})
  const [threads, setThreads] = useState<Thread[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let unsubChat: (() => void) | null = null
    let unsubEmp: (() => void) | null = null
    getDatabase().then((db: any) => {
      unsubChat = db.onValue('messages_Chat', (snapshot: any) => {
        const data = snapshot.val() as Record<string, { id: string; participants: string[]; messages: Message[] }> | undefined
        if (data) {
          const myThreads = Object.entries(data)
            .filter(([_, t]) => (t as Thread).participants?.includes(userId))
            .map(([id, t]) => ({ ...t, id, messages: (t as Thread).messages || [] }))
          setThreads(myThreads)
        } else {
          setThreads([])
        }
      })

      unsubEmp = db.onValue('employees', (snapshot: any) => {
        const data = snapshot.val() as Record<string, { name: string }> | undefined
        if (data) {
          const formatted: Record<string, Employee> = {}
          Object.entries(data).forEach(([id, emp]) => {
            formatted[id] = { id, name: (emp as { name: string }).name }
          })
          setEmployees(formatted)
        } else {
          setEmployees({})
        }
      })
    })
    return () => {
      if (unsubChat) unsubChat()
      if (unsubEmp) unsubEmp()
    }
  }, [userId])

  const getThreadName = (thread: Thread) => {
    const otherParticipants = thread.participants.filter(p => p !== userId)
    if (otherParticipants.length > 0) {
      const names = otherParticipants.map(p => employees[p]?.name || (p === 'admin-001' ? 'Admin' : p)).join(', ')
      return names
    }
    return 'Unknown'
  }

  const getThreadAvatar = (thread: Thread) => {
    const otherParticipants = thread.participants.filter(p => p !== userId)
    if (otherParticipants.length > 0) {
      return otherParticipants.map(p => {
        if (p === 'admin-001') return 'A'
        return employees[p]?.name?.split(' ').map((n: string) => n[0]).join('') || '?'
      }).join('')
    }
    return '?'
  }

  const getThreadLastSeen = (thread: Thread) => {
    const msgs = thread.messages
    if (msgs.length === 0) return ''
    return msgs[msgs.length - 1].timestamp
  }

  const getThreadLastMessage = (thread: Thread) => {
    const msgs = thread.messages
    if (msgs.length === 0) return 'No messages yet'
    const last = msgs[msgs.length - 1]
    return last.text
  }

  const selectedThread = threads.find((t) => t.id === activeThread)

  const handleSend = async () => {
    if (!newMessage.trim() || !activeThread) return
    const db = await getDatabase()
    const thread = threads.find(t => t.id === activeThread)
    if (thread) {
      const existing = thread.messages || []
      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        sender: userId,
        text: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      await db.set(`messages_Chat/${activeThread}/messages`, [...existing, newMsg])
      setNewMessage('')
      hrToast.success('Message Sent', 'Your message has been sent')
    }
  }

  const getOrCreateThread = (otherUserId: string) => {
    const sortedIds = [userId, otherUserId].sort()
    const threadId = `thread-${sortedIds.join('-')}`
    let thread = threads.find(t => t.participants.includes(otherUserId) && t.participants.includes(userId))
    if (!thread) {
      const checkExisting = async () => {
        const db = await getDatabase()
        const existingThreads = await db.get('messages_Chat')
        const existingData = existingThreads.val() as Record<string, Thread> | undefined
        if (existingData) {
          const found = Object.entries(existingData).find(([_, t]) => {
            const participants = (t as Thread).participants || []
            return participants.includes(userId) && participants.includes(otherUserId) && participants.length === 2
          })
          if (found) {
            setActiveThread(found[0])
            return
          }
        }
        const newThread: Thread = {
          id: threadId,
          participants: [userId, otherUserId],
          messages: [],
        }
        await db.set(`messages_Chat/${threadId}`, newThread)
        setActiveThread(threadId)
      }
      checkExisting()
    } else {
      setActiveThread(thread.id)
    }
    setShowNewChatModal(false)
    setSearchQuery('')
  }

  const allParticipants = Object.entries(employees)

  return (
    <PageShell title="Chats">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        <div className="bg-bg-surface border border-border-soft rounded-xl flex flex-col">
          <div className="p-4 border-b border-border-soft flex justify-between items-center">
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-1.5 rounded-lg border border-border-soft text-sm font-medium focus-ring bg-primary text-white">
                Chats
              </button>
            </div>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-1.5 rounded-lg hover:bg-bg-app transition-colors focus-ring"
              aria-label="New Conversation"
            >
              <Plus className="w-4 h-4 text-primary" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {threads.map((thread) => (
              <motion.button
                key={thread.id}
                onClick={() => setActiveThread(thread.id)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-bg-app transition-colors border-b border-border-soft ${
                  activeThread === thread.id ? 'bg-primary-dim' : ''
                }`}
                whileHover={{ x: 2 }}
              >
                <div className="w-10 h-10 rounded-full bg-accent-mint flex items-center justify-center text-white font-mono">
                  {getThreadAvatar(thread)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body font-medium text-text-hi truncate">{getThreadName(thread)}</div>
                  <div className="text-text-mid text-xs truncate">{getThreadLastMessage(thread)}</div>
                </div>
                <div className="text-text-low text-xs">{getThreadLastSeen(thread)}</div>
              </motion.button>
            ))}
            {threads.length === 0 && (
              <div className="text-center py-8 text-text-mid">No conversations yet — start one</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-bg-surface border border-border-soft rounded-xl flex flex-col">
          {selectedThread ? (
            <>
              <div className="p-4 border-b border-border-soft">
                <div className="font-display font-semibold text-text-hi">{getThreadName(selectedThread)}</div>
                <div className="text-text-mid text-xs">Active conversation</div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedThread.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === userId ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] p-3 rounded-lg ${
                      msg.sender === userId
                        ? 'bg-primary text-white'
                        : 'bg-bg-app border border-border-soft'
                    }`}>
                      <div className="text-sm font-body">{msg.text}</div>
                      <div className={`text-xs mt-1 ${
                        msg.sender === userId ? 'text-white/70' : 'text-text-low'
                      }`}>{msg.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-border-soft">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-border-soft rounded-lg text-sm focus-ring"
                  />
                  <button
                    onClick={handleSend}
                    className="px-4 py-2 bg-primary text-white rounded-lg focus-ring"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-mid font-body">
              Select a conversation or start a new one
            </div>
          )}
        </div>
      </div>

      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface border border-border-soft rounded-xl p-6 w-96 max-h-96 flex flex-col">
            <h3 className="text-lg font-display font-semibold text-text-hi mb-4">Start New Conversation</h3>
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-mid" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees..."
                className="w-full pl-10 pr-3 py-2 border border-border-soft rounded focus-ring text-sm"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {allParticipants
                .filter(([id, emp]) => id !== userId && emp.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(([id, emp]) => (
                  <button
                    key={id}
                    onClick={() => getOrCreateThread(id)}
                    className="w-full flex items-center gap-3 p-2 rounded hover:bg-bg-app transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-accent-mint flex items-center justify-center text-white text-xs font-mono">
                      {employees[id]?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                    </div>
                    <span className="font-body text-text-hi">{emp.name}</span>
                  </button>
                ))}
              {allParticipants.filter(([id]) => id !== userId).length === 0 && (
                <div className="text-center py-4 text-text-mid text-sm">No other employees found</div>
              )}
            </div>
            <button
              onClick={() => setShowNewChatModal(false)}
              className="mt-4 w-full px-4 py-2 border border-border-soft rounded text-sm focus-ring"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </PageShell>
  )
}