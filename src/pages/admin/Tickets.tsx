import { PageShell } from '../../components/PageShell'
import { Send } from 'lucide-react'
import { useState, useEffect } from 'react'
import { hrToast } from '../../components/HRCToast'
import { getDatabase } from '../../firebase/config'

interface Attachment {
  id: string
  name: string
  type: string
  url?: string
}

interface Comment {
  id: string
  author: string
  avatar: string
  text: string
  timestamp: string
}

interface Ticket {
  id: string
  employee: string
  avatar?: string
  status: 'open' | 'in-progress' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  subject: string
  description: string
  images: Attachment[]
  files: Attachment[]
  comments: Comment[]
}

const handleDownload = (url?: string, filename?: string) => {
  if (url) {
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'document'
    a.click()
  }
}

export function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    let unsub: (() => void) | null = null
    getDatabase().then((db: any) => {
      unsub = db.onValue('tickets', (snapshot: any) => {
        const data = snapshot.val() as Record<string, Omit<Ticket, 'id'>> | undefined
        if (data) {
          const ticketList = Object.entries(data).map(([id, t]) => ({
          ...t,
          id,
          images: t.images || [],
          files: t.files || [],
          comments: t.comments || []
        } as Ticket))
          setTickets(ticketList)
          if (!selectedTicket && ticketList.length > 0) {
            setSelectedTicket(ticketList[0])
          }
        } else {
          setTickets([])
          setSelectedTicket(null)
        }
      })
    })
    return () => { if (unsub) unsub() }
  }, [])

  const handleStatusChange = async (ticketId: string, status: 'open' | 'in-progress' | 'resolved') => {
    const db = await getDatabase()
    await (db as any).set(`tickets/${ticketId}/status`, status)
    hrToast.success('Status Updated', `Ticket status changed to ${status}`)
  }

  const handleSendComment = async (ticketId: string) => {
    if (!newComment.trim()) return
    const db = await getDatabase()
    const comment: Comment = {
      id: `cmt-${Date.now()}`,
      author: 'Admin',
      avatar: 'A',
      text: newComment,
      timestamp: 'Just now',
    }
    const ticket = tickets.find(t => t.id === ticketId)
    if (ticket) {
      const updatedComments = [...ticket.comments, comment]
      await (db as any).set(`tickets/${ticketId}/comments`, updatedComments)
      setNewComment('')
      hrToast.success('Reply Sent', 'Your reply has been sent')
    }
  }

  if (!selectedTicket) {
    return (
      <PageShell title="Support Tickets">
        <div className="text-center py-8 text-text-mid">No tickets found</div>
      </PageShell>
    )
  }

  return (
    <PageShell title="Support Tickets">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-bg-surface border border-border-soft rounded-xl p-4">
            <h3 className="font-display font-semibold text-text-hi mb-3">All Tickets</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedTicket?.id === ticket.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border-soft hover:bg-bg-app'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-body font-medium text-text-hi text-sm">{ticket.subject}</span>
                  </div>
                  <div className="text-text-mid text-xs">{ticket.employee}</div>
                  <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs ${
                    ticket.status === 'resolved' ? 'bg-accent-mint/20 text-accent-mint' :
                    ticket.status === 'in-progress' ? 'bg-accent-amber/20 text-accent-amber' :
                    'bg-text-low/20 text-text-low'
                  }`}>
                    {ticket.status === 'in-progress' ? 'In Progress' : ticket.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <select
              value={selectedTicket.status}
              onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as any)}
              className={`px-3 py-1 rounded-full text-xs font-medium border-border-soft ${
                selectedTicket.status === 'in-progress' ? 'bg-accent-amber/20 text-accent-amber' :
                selectedTicket.status === 'resolved' ? 'bg-accent-mint/20 text-accent-mint' :
                'bg-text-low/20 text-text-low'
              }`}
            >
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              selectedTicket.priority === 'high' ? 'bg-accent-coral/20 text-accent-coral' :
              selectedTicket.priority === 'medium' ? 'bg-accent-amber/20 text-accent-amber' :
              'bg-accent-mint/20 text-accent-mint'
            }`}>
              {selectedTicket.priority} priority
            </span>
          </div>

          <h2 className="text-xl font-display font-semibold text-text-hi mb-2">{selectedTicket.subject}</h2>
          <p className="text-text-mid font-body mb-6">{selectedTicket.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-text-low mb-3">Bug Image Attached</h3>
              <div className="flex flex-col gap-2">
                {(selectedTicket.images || []).map((img) => (
                  <div key={img.id} className="flex items-center gap-3 p-3 bg-bg-surface border border-border-soft rounded-lg">
                    <div className="w-10 h-10 bg-accent-coral rounded-lg flex items-center justify-center text-white">
                      🖼
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-text-hi font-medium text-sm truncate">{img.name}</div>
                    </div>
                    <button
                      disabled={!img.url}
                      onClick={() => handleDownload(img.url, img.name)}
                      className={`px-3 py-1 rounded text-xs focus-ring ${
                        img.url
                          ? 'border border-primary text-primary hover:bg-primary/10'
                          : 'border border-border-soft text-text-low cursor-not-allowed'
                      }`}
                      title={!img.url ? 'Demo data — no file attached' : undefined}
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-text-low mb-3">Bug File Attached</h3>
              <div className="flex flex-col gap-2">
                {(selectedTicket.files || []).map((file) => (
                  <div key={file.id} className="flex items-center gap-3 p-3 bg-bg-surface border border-border-soft rounded-lg">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-text-hi font-medium text-sm truncate">{file.name}</div>
                    </div>
                    <button
                      disabled={!file.url}
                      onClick={() => handleDownload(file.url, file.name)}
                      className={`px-3 py-1 rounded text-xs focus-ring ${
                        file.url
                          ? 'border border-primary text-primary hover:bg-primary/10'
                          : 'border border-border-soft text-text-low cursor-not-allowed'
                      }`}
                      title={!file.url ? 'Demo data — no file attached' : undefined}
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-bg-surface border border-border-soft rounded-xl flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-64">
              {(selectedTicket.comments || []).map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-mint flex items-center justify-center text-white text-xs font-mono flex-shrink-0">
                    {comment.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-body font-medium text-text-hi">{comment.author}</span>
                      <span className="text-text-low text-xs font-mono">{comment.timestamp}</span>
                    </div>
                    <p className="text-text-mid text-sm font-body">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border-soft">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Type your reply..."
                className="w-full h-24 resize-none border border-border-soft rounded-lg p-3 text-sm focus-ring mb-2"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => handleSendComment(selectedTicket?.id)}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium flex items-center gap-2 focus-ring text-sm"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}