import { PageShell } from '../../components/PageShell'
import { Eye, Download, Search, User } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { getDatabase } from '../../firebase/config'

interface DocumentStatus {
  uploaded: boolean
  url?: string
  filename?: string
}

interface EmployeeDocStatus {
  id: string
  name: string
  employeeId: string
  avatar: string
  docs: {
    aadhaar: DocumentStatus
    pan: DocumentStatus
    resume: DocumentStatus
    photo: DocumentStatus
    signature: DocumentStatus
    sslc: DocumentStatus
    hsc: DocumentStatus
    degree: DocumentStatus
  }
}

const docTypes = [
  { key: 'aadhaar', label: 'AADHAAR' },
  { key: 'pan', label: 'PAN' },
  { key: 'resume', label: 'RESUME' },
  { key: 'photo', label: 'PHOTO' },
  { key: 'signature', label: 'SIGNATURE' },
  { key: 'sslc', label: 'SSLC' },
  { key: 'hsc', label: '12TH/PUC' },
  { key: 'degree', label: 'DEGREE' },
]

export function DocumentCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [docsData, setDocsData] = useState<Record<string, any> | null>(null)
  const [empData, setEmpData] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubDocs: (() => void) | null = null
    let unsubEmp: (() => void) | null = null
    getDatabase().then((db: any) => {
      unsubDocs = db.onValue('Documents', (snapshot: any) => {
        setDocsData(snapshot.val() || {})
      })

      unsubEmp = db.onValue('employees', (empSnap: any) => {
        setEmpData(empSnap.val() || {})
      })
    })

    return () => {
      if (unsubDocs) unsubDocs()
      if (unsubEmp) unsubEmp()
    }
  }, [])

  useEffect(() => {
    if (docsData !== null && empData !== null) {
      setLoading(false)
    }
  }, [docsData, empData])

  const employees = useMemo<EmployeeDocStatus[]>(() => {
    if (!empData) return []
    return Object.entries(empData).map(([empId, empInfo]: [string, any]) => {
      let name = empInfo?.name || empInfo?.fullName

      // Handle fallback nicely if name is empty or looks like a Firebase UID
      const isUid = !name || (name.length > 20 && /^[a-zA-Z0-9_-]+$/.test(name))
      if (isUid) {
        const email = empInfo?.email
        if (email) {
          const prefix = email.split('@')[0]
          name = prefix.charAt(0).toUpperCase() + prefix.slice(1)
        } else {
          // Check for seeded ID
          const seededNames: Record<string, string> = {
            'emp-007': 'Sunny',
            'emp-008': 'Pavan'
          }
          name = seededNames[empId] || `Employee (${empId.slice(-4)})`
        }
      }

      const avatar = name.split(' ').map((n: string) => n ? n[0] : '').join('').slice(0, 2).toUpperCase() || 'E'
      const empDocs = docsData?.[empId] || {}

      return {
        id: empId,
        name,
        employeeId: empInfo?.employeeId || empInfo?.employeeCode || empId,
        avatar,
        docs: {
          aadhaar: empDocs?.aadhaar || { uploaded: false },
          pan: empDocs?.pan || { uploaded: false },
          resume: empDocs?.resume || { uploaded: false },
          photo: empDocs?.photo || { uploaded: false },
          signature: empDocs?.signature || { uploaded: false },
          sslc: empDocs?.sslc || { uploaded: false },
          hsc: empDocs?.hsc || { uploaded: false },
          degree: empDocs?.degree || { uploaded: false },
        }
      }
    })
  }, [docsData, empData])

  const handleView = (url?: string) => {
    if (url) window.open(url, '_blank')
  }

  const handleDownload = (url?: string, filename?: string) => {
    if (url) {
      const a = document.createElement('a')
      a.href = url
      a.download = filename || 'document'
      a.click()
    }
  }

  const filteredEmployees = employees.filter(
    (e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.employeeId.includes(searchQuery)
  )

  return (
    <PageShell title="Document Center">
      <div className="flex justify-between items-center mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-low" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employees..."
            className="pl-10 pr-4 py-2 rounded-full border border-border-soft bg-bg-surface text-sm focus-ring w-64"
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-surface border border-border-soft rounded-full">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm font-body text-text-hi">Admin</span>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-xl overflow-hidden">
        <table className="w-full font-body text-sm">
          <thead className="bg-bg-app">
            <tr>
              <th className="text-left p-4 font-medium text-text-low w-64">EMPLOYEE</th>
              {docTypes.map((doc) => (
                <th key={doc.key} className="text-center p-4 font-medium text-text-low min-w-24">
                  {doc.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={docTypes.length + 1} className="p-8 text-center text-text-mid">Loading...</td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.id} className="border-t border-border-soft hover:bg-bg-app transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-mint flex items-center justify-center text-white text-xs font-mono">
                        {emp.avatar}
                      </div>
                      <div>
                        <div className="font-body font-medium text-text-hi">{emp.name}</div>
                        <div className="font-mono text-text-mid text-sm">{emp.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  {docTypes.map((doc) => {
                    const docStatus = emp.docs[doc.key as keyof typeof emp.docs]
                    const isUploaded = docStatus.uploaded
                    return (
                      <td key={doc.key} className="p-4 text-center min-w-24">
                        {isUploaded ? (
                          <div className="flex gap-1 justify-center">
                            <button 
                              onClick={() => handleView(docStatus.url)}
                              className="p-1.5 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors focus-ring" 
                              aria-label={`View ${doc.label}`}
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => handleDownload(docStatus.url, docStatus.filename)}
                              className="p-1.5 rounded bg-accent-mint/20 text-accent-mint hover:bg-accent-mint/30 transition-colors focus-ring" 
                              aria-label={`Download ${doc.label}`}
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 text-text-low">
                            <span className="text-lg">🕒</span>
                            <span className="text-sm">Pending</span>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}