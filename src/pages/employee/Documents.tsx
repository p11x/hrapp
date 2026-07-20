import { PageShell } from '../../components/PageShell'
import { motion } from 'framer-motion'
import { FileText, Mail, DollarSign, Eye, Download } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getDatabase, getStorage } from '../../firebase/config'
import { hrToast } from '../../components/HRCToast'
import { useAuth } from '../../context/AuthContext'

interface DocumentStatus {
  uploaded: boolean
  url?: string
  filename?: string
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

const sendDocTypes: Array<{ type: 'aadhaar' | 'pan' | 'resume' | 'photo' | 'signature'; name: string }> = [
  { type: 'aadhaar', name: 'Aadhaar Card' },
  { type: 'pan', name: 'PAN Card' },
  { type: 'resume', name: 'Resume' },
  { type: 'photo', name: 'Photo' },
  { type: 'signature', name: 'Signature' },
]

export function Documents() {
  const { user } = useAuth()
  const userId = user?.uid || 'emp-001'
  const [documents, setDocuments] = useState<Record<string, DocumentStatus>>({})
  const [offerLetter, setOfferLetter] = useState<OfferLetter | null>(null)
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [uanNumber, setUanNumber] = useState('')
  const [isEditingUan, setIsEditingUan] = useState(false)

  useEffect(() => {
    let unsubDocs: (() => void) | null = null
    let unsubOffers: (() => void) | null = null
    let unsubPayslips: (() => void) | null = null
    let unsubEmployee: (() => void) | null = null
    
    getDatabase().then((db: any) => {
      unsubEmployee = db.onValue(`employees/${userId}`, (snapshot: any) => {
        const data = snapshot.val()
        if (data?.uanNumber) {
          setUanNumber(data.uanNumber)
        }
      })

      unsubDocs = db.onValue('Documents', (snapshot: any) => {
        const data = snapshot.val() as Record<string, Record<string, DocumentStatus>> | undefined
        if (data && data[userId]) {
          setDocuments({
            aadhaar: data[userId].aadhaar || { uploaded: false },
            pan: data[userId].pan || { uploaded: false },
            resume: data[userId].resume || { uploaded: false },
            photo: data[userId].photo || { uploaded: false },
            signature: data[userId].signature || { uploaded: false },
          })
        } else {
          setDocuments({
            aadhaar: { uploaded: false },
            pan: { uploaded: false },
            resume: { uploaded: false },
            photo: { uploaded: false },
            signature: { uploaded: false },
          })
        }
        setLoading(false)
      })

      unsubOffers = db.onValue('OfferLetters', (snapshot: any) => {
        const offers = snapshot.val() as Record<string, OfferLetter> | undefined
        if (offers) {
          const myOffer = Object.values(offers).find((o: any) => o.employeeId === userId && o.sent)
          setOfferLetter(myOffer || null)
        }
      })

      unsubPayslips = db.onValue('Payslips', (snapshot: any) => {
        const psl = snapshot.val() as Record<string, Payslip> | undefined
        if (psl) {
          const myPayslips = Object.values(psl).filter((p: any) => p.employeeId === userId && p.sent)
          setPayslips(myPayslips as Payslip[])
        }
      })
    })

    return () => {
      if (unsubDocs) unsubDocs()
      if (unsubOffers) unsubOffers()
      if (unsubPayslips) unsubPayslips()
      if (unsubEmployee) unsubEmployee()
    }
  }, [userId])

  const handleSaveUan = async () => {
    if (!uanNumber.trim()) {
      hrToast.error('Validation Error', 'UAN Number cannot be empty')
      return
    }
    try {
      const db = await getDatabase()
      await db.update(`employees/${userId}`, {
        uanNumber: uanNumber.trim(),
      })
      await db.update(`users/${userId}`, {
        uanNumber: uanNumber.trim(),
      })
      setIsEditingUan(false)
      hrToast.success('Saved', 'UAN Number saved successfully')
    } catch (error: any) {
      console.error('Failed to save UAN:', error)
      hrToast.error('Save Failed', 'Unable to save UAN Number')
    }
  }

  const handleUpload = async (docType: string, file: File) => {
    if (!user?.uid) return
    setUploading(docType)
    try {
      const db = await getDatabase()
      const storage = await getStorage()
      const { ref: storageRef, uploadBytes, getDownloadURL } = await import('firebase/storage')
      
      const fileRef = storageRef(storage, `documents/${userId}/${docType}/${file.name}`)
      await uploadBytes(fileRef, file)
      const downloadUrl = await getDownloadURL(fileRef)

      const newDocData: DocumentStatus = {
        uploaded: true,
        url: downloadUrl,
        filename: file.name,
      }

      await db.set(`Documents/${userId}/${docType}`, newDocData)
      hrToast.success('Document Uploaded', `${file.name} has been uploaded successfully`)
    } catch (error: any) {
      hrToast.error('Upload Failed', error?.message || 'Unable to upload document')
    } finally {
      setUploading(null)
    }
  }

  const handleDownload = (url?: string, filename?: string) => {
    if (url) {
      const a = document.createElement('a')
      a.href = url
      a.download = filename || 'document'
      a.click()
    }
  }

  return (
    <PageShell title="My Documents">
      <div className="max-w-2xl space-y-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-text-hi mb-3">Send to Company</h3>
          <div className="bg-surface border border-border-soft rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-text-mid">Loading...</div>
            ) : (
              sendDocTypes.map((doc) => {
                const docStatus = documents[doc.type] || { uploaded: false }
                return (
                  <motion.div
                    key={doc.type}
                    className={`flex items-center justify-between p-4 transition-colors ${
                      docStatus.uploaded ? 'bg-accent-mint/5' : ''
                    }`}
                    whileHover={{ x: 2 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-dim rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-text-hi font-body font-medium">{doc.name}</div>
                        <div className={`text-sm ${docStatus.uploaded ? 'text-accent-mint' : 'text-text-mid'}`}>
                          {docStatus.uploaded ? '✓ Uploaded' : 'Not uploaded'}
                        </div>
                      </div>
                    </div>
                    <div>
                      {uploading === doc.type && (
                        <span className="text-sm text-text-mid mr-2">Uploading...</span>
                      )}
                      <label
                        className={`px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors focus-ring ${
                          docStatus.uploaded
                            ? 'border border-accent-mint text-accent-mint hover:bg-accent-mint/10'
                            : 'border border-primary text-primary hover:bg-primary-dim'
                        }`}
                      >
                        {docStatus.uploaded ? 'Replace' : 'Upload'}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleUpload(doc.type, file)
                            }
                          }}
                        />
                      </label>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-display font-semibold text-text-hi mb-3">Received from Company</h3>
          <div className="bg-surface border border-border-soft rounded-xl overflow-hidden">
            <motion.div
              className="flex items-center justify-between p-4"
              whileHover={{ x: 2 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-dim rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-text-hi font-body font-medium">Offer Letter</div>
                  <div className="text-sm text-text-mid">
                    {offerLetter ? 'Received' : 'Not yet received'}
                  </div>
                </div>
              </div>
              {offerLetter && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.open(offerLetter.url, '_blank')}
                    className="px-3 py-1.5 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 transition-colors focus-ring flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(offerLetter.url, 'offer-letter.pdf')}
                    className="px-3 py-1.5 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 transition-colors focus-ring flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                </div>
              )}
            </motion.div>

            <motion.div
              className="flex flex-col p-4 border-t border-border-soft"
              whileHover={{ x: 2 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary-dim rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div className="text-text-hi font-body font-medium">Payslips ({payslips.length})</div>
              </div>
              {payslips.length > 0 ? (
                <div className="ml-12 space-y-1">
                  {payslips.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-1">
                      <span className="text-text-mid text-sm">{p.month}</span>
                      <button
                        onClick={() => handleDownload(p.url, `${p.month}-payslip.pdf`)}
                        className="px-3 py-1 bg-primary text-white rounded text-xs font-medium hover:bg-primary/90 transition-colors focus-ring"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ml-12">
                  <span className="text-text-mid italic">No payslips received yet</span>
                </div>
              )}
            </motion.div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-display font-semibold text-text-hi mb-3">Provident Fund</h3>
          <div className="bg-surface border border-border-soft rounded-xl overflow-hidden p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-dim rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-text-hi font-body font-medium">UAN Number</div>
                  <div className="text-sm text-text-mid">
                    Submit your Universal Account Number
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open('https://unifiedportal-mem.epfindia.gov.in/memberinterface/', '_blank')}
                  className="px-4 py-1.5 border border-primary text-primary hover:bg-primary-dim rounded-full text-sm font-medium transition-colors focus-ring"
                >
                  Generate UAN
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-border-soft">
              {!isEditingUan && uanNumber ? (
                <div className="flex items-center justify-between bg-bg-app p-3 rounded-lg border border-border-soft">
                  <div>
                    <span className="text-xs font-bold text-text-low uppercase tracking-wider block mb-1">Your UAN</span>
                    <span className="font-mono font-bold text-text-hi text-lg">{uanNumber}</span>
                  </div>
                  <button
                    onClick={() => setIsEditingUan(true)}
                    className="px-4 py-1.5 border border-border-soft hover:bg-surface rounded-lg text-sm font-medium transition-colors focus-ring"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={uanNumber}
                    onChange={(e) => setUanNumber(e.target.value)}
                    placeholder="Enter 12-digit UAN"
                    className="flex-1 px-4 py-2 bg-bg-app border border-border-soft rounded-lg text-sm text-text-hi focus-ring"
                    maxLength={12}
                  />
                  <div className="flex gap-2">
                    {isEditingUan && uanNumber && (
                      <button
                        onClick={() => setIsEditingUan(false)}
                        className="px-4 py-2 border border-border-soft hover:bg-surface rounded-lg text-sm font-medium transition-colors focus-ring"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={handleSaveUan}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors focus-ring"
                    >
                      Submit UAN
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}