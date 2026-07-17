import { PageShell } from '../../components/PageShell'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bankDetailsSchema } from '../../lib/validators'
import type { BankDetailsFormData } from '../../lib/validators'
import { useAuth } from '../../context/AuthContext'
import { useEffect } from 'react'
import { getDatabase } from '../../firebase/config'
import { hrToast } from '../../components/HRCToast'

export function BankDetails() {
  const { user } = useAuth()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BankDetailsFormData>({
    resolver: zodResolver(bankDetailsSchema),
  })

  useEffect(() => {
    if (user?.uid) {
      getDatabase().then((db: any) => {
        db.get(`bankDetails/${user.uid}`).then((snapshot: any) => {
          const data = snapshot.val() as BankDetailsFormData | null
          if (data) {
            reset(data)
          }
        })
      })
    }
  }, [user?.uid, reset])

  const onSubmit = async (data: BankDetailsFormData) => {
    if (!user?.uid) return
    try {
      const db = await getDatabase()
      await db.set(`bankDetails/${user.uid}`, data)
      hrToast.success('Bank Details Saved', 'Bank details updated successfully')
    } catch (error) {
      hrToast.error('Save Failed', 'Unable to update bank details')
    }
  }

  return (
    <PageShell title="Bank Details">
      <div className="max-w-2xl">
        <motion.div
          className="bg-surface border border-border-soft rounded-xl p-6"
          whileHover={{ y: -2 }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                ACCOUNT NUMBER <span className="text-accent-coral">*</span>
              </label>
              <input
                {...register('accountNumber')}
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring font-mono"
                placeholder="Enter account number"
              />
              {errors.accountNumber && (
                <p className="text-accent-coral text-sm mt-1">{errors.accountNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                BANK NAME <span className="text-accent-coral">*</span>
              </label>
              <input
                {...register('bankName')}
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                placeholder="Enter bank name"
              />
              {errors.bankName && (
                <p className="text-accent-coral text-sm mt-1">{errors.bankName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                BRANCH <span className="text-accent-coral">*</span>
              </label>
              <input
                {...register('branch')}
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                placeholder="Enter branch"
              />
              {errors.branch && (
                <p className="text-accent-coral text-sm mt-1">{errors.branch.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                IFSC CODE <span className="text-accent-coral">*</span>
              </label>
              <input
                {...register('ifscCode')}
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring font-mono"
                placeholder="Enter IFSC code"
              />
              {errors.ifscCode && (
                <p className="text-accent-coral text-sm mt-1">{errors.ifscCode.message}</p>
              )}
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
                'Save Details'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </PageShell>
  )
}