import { PageShell } from '../../components/PageShell'
import { motion } from 'framer-motion'
import { ChevronLeft, Eye, Download, Send, User, Phone, Mail, Calendar, MapPin, FileText, X, Trash2 } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { getDatabase, getStorage } from '../../firebase/config'
import { hrToast } from '../../components/HRCToast'

interface EducationData {
  collegeName: string
  degree: string
  graduationYear: string
  cgpa: string
  collegeAddress: string
  specialization?: string
  fromYear?: string
  toYear?: string
  universityName?: string
}

interface EmployeeProfileData {
  name: string
  email: string
  phone?: string
  whatsapp?: string
  dob?: string
  gender?: string
  address?: string
  uanNumber?: string
  employeeCode?: string
  position?: string
}

interface DocumentStatus {
  uploaded: boolean
  url?: string
  filename?: string
}

interface EmployeeSeed {
  name?: string
  uanNumber?: string
  employeeCode?: string
  position?: string
}

interface UserSeed {
  email?: string
  phone?: string
  fullName?: string
  dob?: string
  gender?: string
  address?: string
  whatsapp?: string
  employeeCode?: string
  position?: string
}

interface OfferLetter {
  id: string
  employeeId: string
  employeeName: string
  sent: boolean
  date: string
  url: string
}

interface Payslip {
  id: string
  employeeId: string
  employeeName: string
  sent: boolean
  month: string
  url: string
}

export function EmployeeProfile() {
  const { employeeId } = useParams<{ employeeId: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<EmployeeProfileData | null>(null)
  const [education, setEducation] = useState<EducationData | null>(null)
  const [bankDetails, setBankDetails] = useState<{ accountNumber: string; bankName: string; branch: string; ifscCode: string } | null>(null)
  const [documents, setDocuments] = useState<Record<string, DocumentStatus>>({})
  const [loading, setLoading] = useState(true)
  const [sendingOffer, setSendingOffer] = useState(false)
  const [sendingPayslip, setSendingPayslip] = useState(false)
  const [offerLetter, setOfferLetter] = useState<OfferLetter | null>(null)
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const offerFileRef = useRef<HTMLInputElement>(null)
  const payslipFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!employeeId) return
      const db = await getDatabase()
      const employeeData = await (db as any).get(`employees/${employeeId}`)
      const userData = await (db as any).get(`users/${employeeId}`)
      const docsData = await (db as any).get(`Documents/${employeeId}`)
      const eduData = await (db as any).get(`education/${employeeId}`)
      const bankData = await (db as any).get(`bankDetails/${employeeId}`)

      if (employeeData.exists()) {
        const empVal = employeeData.val() as EmployeeSeed | null
        const userVal = userData.val() as UserSeed & { whatsapp?: string } | null
        setProfile({
          name: empVal?.name || userVal?.fullName || 'Unknown',
          email: userVal?.email || '',
          phone: userVal?.phone || undefined,
          whatsapp: userVal?.whatsapp || undefined,
          dob: userVal?.dob || undefined,
          gender: userVal?.gender || undefined,
          address: userVal?.address || undefined,
          uanNumber: empVal?.uanNumber || undefined,
          employeeCode: empVal?.employeeCode || userVal?.employeeCode || undefined,
          position: empVal?.position || userVal?.position || undefined,
        })
      }

      if (eduData.exists()) {
        setEducation(eduData.val() as EducationData | null)
      }

      if (bankData.exists()) {
        setBankDetails(bankData.val() as { accountNumber: string; bankName: string; branch: string; ifscCode: string } | null)
      }

      if (docsData.exists()) {
        const docs = docsData.val() as Record<string, DocumentStatus>
        setDocuments({
          ...docs,
          aadhaar: docs.aadhaar || { uploaded: false },
          pan: docs.pan || { uploaded: false },
          resume: docs.resume || { uploaded: false },
          photo: docs.photo || { uploaded: false },
          signature: docs.signature || { uploaded: false },
          sslc: docs.sslc || { uploaded: false },
          hsc: docs.hsc || { uploaded: false },
          degree: docs.degree || { uploaded: false },
        })
      }

      const offerSnap = await (db as any).get('OfferLetters')
      const offerData = offerSnap.val() as Record<string, OfferLetter> | null
      if (offerData) {
        const myOffer = Object.values(offerData).find((o: OfferLetter) => o.employeeId === employeeId && o.sent)
        setOfferLetter(myOffer || null)
      }

      const payslipSnap = await (db as any).get('Payslips')
      const payslipData = payslipSnap.val() as Record<string, Payslip> | null
      if (payslipData) {
        const myPayslips = Object.values(payslipData).filter((p: Payslip) => p.employeeId === employeeId && p.sent)
        setPayslips(myPayslips)
      }

      setLoading(false)
    }

    fetchData()
  }, [employeeId])

  const handleSendOffer = async () => {
    offerFileRef.current?.click()
  }

  const handleOfferFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !employeeId) return
    
    setSendingOffer(true)
    try {
      const db = await getDatabase()
      const storage = await getStorage()
      const { ref: storageRef, uploadBytes, getDownloadURL } = await import('firebase/storage')
      
      const fileRef = storageRef(storage, `offerletters/${employeeId}/${file.name}`)
      await uploadBytes(fileRef, file)
      const downloadUrl = await getDownloadURL(fileRef)
      
      const offerData: OfferLetter = {
        id: `offer-${Date.now()}`,
        employeeId,
        employeeName: profile?.name || '',
        sent: true,
        date: new Date().toISOString().split('T')[0],
        url: downloadUrl,
      }
      await (db as any).set(`OfferLetters/${offerData.id}`, offerData)
      hrToast.success('Offer Letter Sent', 'Offer letter sent to employee successfully')
    } catch (error: any) {
      hrToast.error('Send Failed', error?.message || 'Unable to send offer letter')
    } finally {
      setSendingOffer(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleSendPayslip = async () => {
    payslipFileRef.current?.click()
  }

  const handlePayslipFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !employeeId) return
    
    setSendingPayslip(true)
    try {
      const db = await getDatabase()
      const storage = await getStorage()
      const { ref: storageRef, uploadBytes, getDownloadURL } = await import('firebase/storage')
      
      const fileRef = storageRef(storage, `payslips/${employeeId}/${file.name}`)
      await uploadBytes(fileRef, file)
      const downloadUrl = await getDownloadURL(fileRef)
      
      const payslipData: Payslip = {
        id: `payslip-${Date.now()}`,
        employeeId,
        employeeName: profile?.name || '',
        sent: true,
        month: 'February 2024',
        url: downloadUrl,
      }
      await (db as any).set(`Payslips/${payslipData.id}`, payslipData)
      hrToast.success('Payslip Sent', 'Payslip sent to employee successfully')
    } catch (error: any) {
      hrToast.error('Send Failed', error?.message || 'Unable to send payslip')
    } finally {
      setSendingPayslip(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleDeleteEmployee = async () => {
    if (!employeeId) return
    
    try {
      const db = await getDatabase()
      
      await (db as any).remove(`employees/${employeeId}`)
      await (db as any).set(`users/${employeeId}/deactivated`, true)
      await (db as any).remove(`attendance/${employeeId}`)
      await (db as any).set(`Documents/${employeeId}/deactivated`, true)
      
      const tasksSnap = await (db as any).get('tasks')
      const tasks = tasksSnap.val() as Record<string, { assignee?: string; projectId?: string }> | null
      if (tasks) {
        for (const [taskId, task] of Object.entries(tasks)) {
          if (task.assignee === employeeId) {
            await (db as any).set(`tasks/${taskId}/assignee`, null)
          }
        }
      }

      const projectsSnap = await (db as any).get('projects')
      const projects = projectsSnap.val() as Record<string, { members?: string[] }> | null
      if (projects) {
        for (const [projId, proj] of Object.entries(projects)) {
          if (proj.members?.includes(employeeId)) {
            const updatedMembers = proj.members.filter((m: string) => m !== employeeId)
            await (db as any).set(`projects/${projId}/members`, updatedMembers)
          }
        }
      }

      hrToast.success('Employee Deleted', `${profile?.name || 'Employee'} has been removed`)
      setShowDeleteConfirm(false)
      navigate('/admin/employees')
    } catch (error: any) {
      hrToast.error('Delete Failed', error?.message || 'Unable to delete employee')
    }
  }

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

  const getAvatarInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const docRows = [
    { key: 'aadhaar', label: 'Aadhaar' },
    { key: 'pan', label: 'PAN' },
    { key: 'resume', label: 'Resume' },
    { key: 'photo', label: 'Photo' },
    { key: 'signature', label: 'Signature' },
  ]

  const eduDocRows = [
    { key: 'sslc', label: 'SSLC Certificate' },
    { key: 'hsc', label: '12th/PUC Certificate' },
    { key: 'degree', label: 'Degree Certificate' },
  ]

  if (loading) {
    return (
      <PageShell title="Employee Profile">
        <div className="text-center py-8 text-text-mid">Loading...</div>
      </PageShell>
    )
  }

  if (!profile) {
    return (
      <PageShell title="Employee Profile">
        <div className="text-center py-8 text-text-mid">Employee not found</div>
      </PageShell>
    )
  }

  return (
    <PageShell title={profile.name}>
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-bg-surface border border-border-soft rounded-xl p-6 max-w-sm"
          >
            <h3 className="text-lg font-semibold text-text-hi mb-4">Delete Employee?</h3>
            <p className="text-text-mid mb-6">
              Are you sure you want to delete {profile?.name}? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-border-soft rounded text-text-hi hover:bg-bg-app transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEmployee}
                className="flex-1 px-4 py-2 bg-accent-coral text-white rounded hover:bg-accent-coral/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <input
        ref={offerFileRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleOfferFileSelected}
      />
      <input
        ref={payslipFileRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handlePayslipFileSelected}
      />
      
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-bg-app transition-colors focus-ring"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5 text-text-low" />
        </button>
        <div>
          <h2 className="text-xl font-display font-semibold text-text-hi">Employee Profile</h2>
          <p className="text-text-mid text-sm">Full details and documents</p>
        </div>
      </div>

      <div className="space-y-4">
        <motion.div
          className="bg-bg-surface border border-border-soft rounded-xl p-6"
          whileHover={{ y: -2 }}
        >
          <h3 className="text-lg font-display font-semibold text-text-hi mb-4">Identity</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-mono">
              {getAvatarInitials(profile.name)}
            </div>
            <div>
              <div className="text-xl font-display font-semibold text-text-hi">{profile.name}</div>
              <div className="text-text-mid flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {profile.email}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-bg-surface border border-border-soft rounded-xl p-6"
          whileHover={{ y: -2 }}
        >
          <h3 className="text-lg font-display font-semibold text-text-hi mb-4">Personal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: User, label: 'Full Name', value: profile.name },
              { icon: null, label: 'Employee Code', value: profile.employeeCode || '—' },
              { icon: null, label: 'Role', value: profile.position || '—' },
              { icon: Phone, label: 'Phone', value: profile.phone || '—' },
              { icon: null, label: 'WhatsApp', value: profile.whatsapp || '—' },
              { icon: Mail, label: 'Email', value: profile.email },
              { icon: Calendar, label: 'DOB', value: profile.dob || '—' },
              { icon: null, label: 'Gender', value: profile.gender || '—' },
              { icon: MapPin, label: 'Address', value: profile.address || '—', fullWidth: true },
            ].map((item, i) => (
              <div key={i} className={item.fullWidth ? 'md:col-span-2' : ''}>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-text-low w-32">{item.label}</span>
                  <span className="text-text-hi font-body">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="bg-bg-surface border border-border-soft rounded-xl p-6"
          whileHover={{ y: -2 }}
        >
          <h3 className="text-lg font-display font-semibold text-text-hi mb-4">Education</h3>
          {education ? (
            <div className="space-y-2">
              <div className="flex gap-2 text-sm">
                <span className="text-text-low w-32">College</span>
                <span className="text-text-hi font-body">{education.collegeName}</span>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="text-text-low w-32">Degree</span>
                <span className="text-text-hi font-body">{education.degree}</span>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="text-text-low w-32">Year</span>
                <span className="text-text-hi font-body">{education.graduationYear}</span>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="text-text-low w-32">CGPA</span>
                <span className="text-text-hi font-body">{education.cgpa}</span>
              </div>
            </div>
          ) : (
            <div className="text-text-mid">Not provided</div>
          )}
        </motion.div>

        <motion.div
          className="bg-bg-surface border border-border-soft rounded-xl p-6"
          whileHover={{ y: -2 }}
        >
          <h3 className="text-lg font-display font-semibold text-text-hi mb-4">Bank Details</h3>
          {bankDetails ? (
            <div className="space-y-2">
              <div className="flex gap-2 text-sm">
                <span className="text-text-low w-32">Account</span>
                <span className="text-text-hi font-mono">XXXXXX{bankDetails.accountNumber.slice(-4)}</span>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="text-text-low w-32">Bank</span>
                <span className="text-text-hi font-body">{bankDetails.bankName}</span>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="text-text-low w-32">Branch</span>
                <span className="text-text-hi font-body">{bankDetails.branch}</span>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="text-text-low w-32">IFSC</span>
                <span className="text-text-hi font-mono">{bankDetails.ifscCode}</span>
              </div>
            </div>
          ) : (
            <div className="text-text-mid">Not provided</div>
          )}
        </motion.div>

        <motion.div
          className="bg-bg-surface border border-border-soft rounded-xl p-6"
          whileHover={{ y: -2 }}
        >
          <h3 className="text-lg font-display font-semibold text-text-hi mb-4">Provident Fund</h3>
          <div className="space-y-2">
            <div className="flex gap-2 text-sm">
              <span className="text-text-low w-32">UAN Number</span>
              <span className="text-text-hi font-mono">{profile.uanNumber || 'Not provided'}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-bg-surface border border-border-soft rounded-xl p-6"
          whileHover={{ y: -2 }}
        >
          <h3 className="text-lg font-display font-semibold text-text-hi mb-4">Documents</h3>
          <div className="divide-y divide-border-soft">
            {docRows.map((doc) => {
              const docStatus = documents[doc.key] || { uploaded: false }
              return (
                <div key={doc.key} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-text-low" />
                    <span className="text-text-hi font-body">{doc.label}</span>
                  </div>
                  {docStatus.uploaded ? (
                    <div className="flex items-center gap-2 text-accent-mint">
                      <button
                        onClick={() => handleView(docStatus.url)}
                        className="p-1.5 rounded bg-accent-mint/10 hover:bg-accent-mint/20 transition-colors focus-ring"
                        aria-label="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(docStatus.url, docStatus.filename)}
                        className="p-1.5 rounded bg-accent-mint/10 hover:bg-accent-mint/20 transition-colors focus-ring"
                        aria-label="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-text-low flex items-center gap-1">
                      <X className="w-4 h-4" />
                      Not uploaded
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          className="bg-bg-surface border border-border-soft rounded-xl p-6"
          whileHover={{ y: -2 }}
        >
          <h3 className="text-lg font-display font-semibold text-text-hi mb-4">Educational Documents</h3>
          <div className="divide-y divide-border-soft">
            {eduDocRows.map((doc) => {
              const docStatus = documents[doc.key] || { uploaded: false }
              return (
                <div key={doc.key} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-text-low" />
                    <span className="text-text-hi font-body">{doc.label}</span>
                  </div>
                  {docStatus.uploaded ? (
                    <div className="flex items-center gap-2 text-accent-mint">
                      <button
                        onClick={() => handleView(docStatus.url)}
                        className="p-1.5 rounded bg-accent-mint/10 hover:bg-accent-mint/20 transition-colors focus-ring"
                        aria-label="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(docStatus.url, docStatus.filename)}
                        className="p-1.5 rounded bg-accent-mint/10 hover:bg-accent-mint/20 transition-colors focus-ring"
                        aria-label="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-text-low flex items-center gap-1">
                      <X className="w-4 h-4" />
                      Not uploaded
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          className="bg-bg-surface border border-border-soft rounded-xl p-6"
          whileHover={{ y: -2 }}
        >
          <h3 className="text-lg font-display font-semibold text-text-hi mb-4">Send to Employee</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-text-hi font-body">Offer Letter</span>
              <div className="flex items-center gap-2">
                {offerLetter ? (
                  <span className="text-accent-mint text-sm">Sent on {offerLetter.date}</span>
                ) : (
                  <span className="text-text-low text-sm">Not sent yet</span>
                )}
                <button
                  onClick={handleSendOffer}
                  disabled={sendingOffer}
                  className="px-3 py-1.5 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 transition-colors focus-ring flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  {offerLetter ? 'Send Again' : 'Send'}
                </button>
              </div>
            </div>
            {offerLetter && (
              <div className="flex items-center gap-2 pl-4">
                <button
                  onClick={() => handleView(offerLetter.url)}
                  className="px-2 py-1 bg-accent-mint/10 text-accent-mint rounded text-xs font-medium hover:bg-accent-mint/20 transition-colors focus-ring"
                >
                  View
                </button>
                <button
                  onClick={() => handleDownload(offerLetter.url, 'offer-letter.pdf')}
                  className="px-2 py-1 bg-accent-mint/10 text-accent-mint rounded text-xs font-medium hover:bg-accent-mint/20 transition-colors focus-ring"
                >
                  Download
                </button>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="text-text-hi font-body">Payslip</span>
              <div className="flex items-center gap-2">
                <span className="text-text-low text-sm">{payslips.length} sent</span>
                <button
                  onClick={handleSendPayslip}
                  disabled={sendingPayslip}
                  className="px-3 py-1.5 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 transition-colors focus-ring flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  Send New
                </button>
              </div>
            </div>
            {payslips.length > 0 && (
              <div className="pl-4 space-y-1">
                {payslips.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="text-text-mid text-xs">{p.month}</span>
                    <button
                      onClick={() => handleView(p.url)}
                      className="px-2 py-1 bg-accent-mint/10 text-accent-mint rounded text-xs font-medium hover:bg-accent-mint/20 transition-colors focus-ring"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(p.url, `${p.month}-payslip.pdf`)}
                      className="px-2 py-1 bg-accent-mint/10 text-accent-mint rounded text-xs font-medium hover:bg-accent-mint/20 transition-colors focus-ring"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          className="flex justify-end mt-4"
          whileHover={{ y: -2 }}
        >
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-accent-coral text-white rounded font-medium hover:bg-accent-coral/90 transition-colors flex items-center gap-2 focus-ring"
          >
            <Trash2 className="w-4 h-4" />
            Delete Employee
          </button>
        </motion.div>
      </div>
    </PageShell>
  )
}