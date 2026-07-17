import { PageShell } from '../../components/PageShell'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { educationSchema } from '../../lib/validators'
import type { EducationFormData } from '../../lib/validators'
import { useAuth } from '../../context/AuthContext'
import { useEffect } from 'react'
import { getDatabase } from '../../firebase/config'
import { hrToast } from '../../components/HRCToast'

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

  useEffect(() => {
    if (user?.uid) {
      getDatabase().then((db: any) => {
        db.get(`education/${user.uid}`).then((snapshot: any) => {
          const data = snapshot.val() as EducationFormData | null
          if (data) {
            reset(data)
          }
        })
      })
    }
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
      </div>
    </PageShell>
  )
}