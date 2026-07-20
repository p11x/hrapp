import { PageShell } from '../../components/PageShell'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { educationSchema } from '../../lib/validators'
import type { EducationFormData } from '../../lib/validators'
import { useAuth } from '../../context/AuthContext'
import { useEffect, useState } from 'react'
import { getDatabase, getStorage } from '../../firebase/config'
import { hrToast } from '../../components/HRCToast'
import { FileText } from 'lucide-react'

interface DocumentStatus {
  uploaded: boolean
  url?: string
  filename?: string
}

const eduDocTypes = [
  { type: 'sslc', name: 'SSLC Certificate' },
  { type: 'hsc', name: '12th/PUC Certificate' },
  { type: 'degree', name: 'Degree Certificate' },
]

export function Education() {
  const { user } = useAuth()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
  })

  const [documents, setDocuments] = useState<Record<string, DocumentStatus>>({})
  const [uploading, setUploading] = useState<string | null>(null)
  const [loadingDocs, setLoadingDocs] = useState(true)

  useEffect(() => {
    let unsubDocs: (() => void) | null = null
    if (user?.uid) {
      getDatabase().then((db: any) => {
        db.get(`education/${user.uid}`).then((snapshot: any) => {
          const data = snapshot.val() as EducationFormData | null
          if (data) {
            reset(data)
          }
        })
        
        unsubDocs = db.onValue(`Documents/${user.uid}`, (snapshot: any) => {
          const data = snapshot.val() as Record<string, DocumentStatus> | null
          if (data) {
            setDocuments({
              sslc: data.sslc || { uploaded: false },
              hsc: data.hsc || { uploaded: false },
              degree: data.degree || { uploaded: false },
            })
          } else {
            setDocuments({
              sslc: { uploaded: false },
              hsc: { uploaded: false },
              degree: { uploaded: false },
            })
          }
          setLoadingDocs(false)
        })
      })
    }
    return () => { if (unsubDocs) unsubDocs() }
  }, [user?.uid, reset])

  const onSubmit = async (data: EducationFormData) => {
    if (!user?.uid) return
    try {
      const db = await getDatabase()
      await db.set(`education/${user.uid}`, data)
      hrToast.success('Education Saved', 'Education details updated successfully')
    } catch (error) {
      hrToast.error('Save Failed', 'Unable to update education details')
    }
  }

  const handleUpload = async (docType: string, file: File) => {
    if (!user?.uid) return
    setUploading(docType)
    try {
      const db = await getDatabase()
      const storage = await getStorage()
      const { ref: storageRef, uploadBytes, getDownloadURL } = await import('firebase/storage')
      
      const fileRef = storageRef(storage, `documents/${user.uid}/${docType}/${file.name}`)
      await uploadBytes(fileRef, file)
      const downloadUrl = await getDownloadURL(fileRef)

      const newDocData: DocumentStatus = {
        uploaded: true,
        url: downloadUrl,
        filename: file.name,
      }

      await db.set(`Documents/${user.uid}/${docType}`, newDocData)
      hrToast.success('Document Uploaded', `${file.name} has been uploaded successfully`)
    } catch (error: any) {
      console.error('Upload error:', error)
      hrToast.error('Upload Failed', 'There was an error uploading your document')
    } finally {
      setUploading(null)
    }
  }

  return (
    <PageShell title="Education">
      <div className="max-w-2xl">
        <motion.div
          className="bg-surface border border-border-soft rounded-xl p-6"
          whileHover={{ y: -2 }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                COLLEGE NAME <span className="text-accent-coral">*</span>
              </label>
              <input
                {...register('collegeName')}
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                placeholder="Enter college name"
              />
              {errors.collegeName && (
                <p className="text-accent-coral text-sm mt-1">{errors.collegeName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                DEGREE <span className="text-accent-coral">*</span>
              </label>
              <input
                {...register('degree')}
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                placeholder="Enter degree"
              />
              {errors.degree && (
                <p className="text-accent-coral text-sm mt-1">{errors.degree.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                GRADUATION YEAR <span className="text-accent-coral">*</span>
              </label>
              <input
                {...register('graduationYear')}
                type="number"
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                placeholder="Enter year (YYYY)"
              />
              {errors.graduationYear && (
                <p className="text-accent-coral text-sm mt-1">{errors.graduationYear.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                OVERALL CGPA/PERCENTAGE <span className="text-accent-coral">*</span>
              </label>
              <input
                {...register('cgpa')}
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                placeholder="e.g., 8.5 or 85%"
              />
              {errors.cgpa && (
                <p className="text-accent-coral text-sm mt-1">{errors.cgpa.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                COLLEGE ADDRESS <span className="text-accent-coral">*</span>
              </label>
              <input
                {...register('collegeAddress')}
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                placeholder="Enter college address"
              />
              {errors.collegeAddress && (
                <p className="text-accent-coral text-sm mt-1">{errors.collegeAddress.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                SPECIALIZATION/BRANCH
              </label>
              <input
                {...register('specialization')}
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                placeholder="Enter specialization"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                  FROM YEAR
                </label>
                <input
                  {...register('fromYear')}
                  type="number"
                  className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                  placeholder="YYYY"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                  TO YEAR
                </label>
                <input
                  {...register('toYear')}
                  type="number"
                  className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                  placeholder="YYYY"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                UNIVERSITY NAME
              </label>
              <input
                {...register('universityName')}
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                placeholder="Enter university name"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-primary text-white font-medium rounded hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 focus-ring"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Saving...
                </>
              ) : (
                'Save Education'
              )}
            </button>
          </form>
        </motion.div>

        <div className="mt-8">
          <h3 className="text-lg font-display font-semibold text-text-hi mb-3">Educational Documents</h3>
          <div className="bg-surface border border-border-soft rounded-xl overflow-hidden">
            {loadingDocs ? (
              <div className="p-8 text-center text-text-mid">Loading...</div>
            ) : (
              eduDocTypes.map((doc) => {
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
                        className={`px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors focus-ring inline-block ${
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
                            if (file) handleUpload(doc.type, file)
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
      </div>
    </PageShell>
  )
}