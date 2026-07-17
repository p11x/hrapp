import { PageShell } from '../../components/PageShell'
import { useAuth } from '../../context/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { personalDetailsSchema } from '../../lib/validators'
import type { PersonalDetailsFormData } from '../../lib/validators'
import { motion } from 'framer-motion'
import { Camera, Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getDatabase } from '../../firebase/config'
import { hrToast } from '../../components/HRCToast'

export function Profile() {
  const { user } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PersonalDetailsFormData>({
    resolver: zodResolver(personalDetailsSchema),
  })

  const selectedGender = watch('gender')

  useEffect(() => {
    if (user?.uid) {
      getDatabase().then(async (db: any) => {
        try {
          const snapshot = await db.get(`users/${user.uid}`)
          const data = snapshot.val() as Partial<PersonalDetailsFormData> & { avatar?: string } | null
          if (data) {
            reset({
              fullName: data.fullName || user.displayName || '',
              phone: data.phone || '',
              whatsapp: data.whatsapp || '',
              email: data.email || user.email || '',
              dob: data.dob || '',
              address: data.address || '',
              gender: data.gender ? (data.gender as 'Male' | 'Female' | 'Other') : undefined,
            })
            if (data.avatar) {
              setAvatarUrl(data.avatar)
            }
          } else {
            reset({
              fullName: user.displayName || '',
              email: user.email || '',
              phone: '',
              whatsapp: '',
              dob: '',
              address: '',
            })
          }
        } catch (error: any) {
          reset({ email: user.email || '' })
        } finally {
          setLoading(false)
        }
      })
    } else {
      setLoading(false)
    }
  }, [user?.uid, user?.email, user?.displayName, reset])

  const handleAvatarUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const url = URL.createObjectURL(file)
        setAvatarUrl(url)
      }
    }
    input.click()
  }

  const onSubmit = async (data: PersonalDetailsFormData) => {
    if (!user?.uid) return
    try {
      const db = await getDatabase()
      await (db as any).set(`users/${user.uid}`, {
        ...data,
        avatar: avatarUrl,
      })
      try {
        await (db as any).update(`employees/${user.uid}`, {
          name: data.fullName,
        })
      } catch (err) {
        console.warn('Failed to update name in employees node:', err)
      }
      hrToast.success('Details Saved', 'Personal details updated successfully')
    } catch (error: any) {
      hrToast.error('Save Failed', error?.message || 'Unable to update details')
    }
  }

  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
  }

  return loading ? (
    <PageShell title="Personal Details">
      <div className="text-center py-8 text-text-mid">Loading...</div>
    </PageShell>
  ) : (
    <PageShell title="Personal Details">
      <div className="max-w-2xl space-y-6">
        <motion.div
          className="bg-surface border border-border-soft rounded-xl p-6 flex flex-col items-center"
          whileHover={{ y: -2 }}
        >
          <div className="relative mb-3">
            <div className="w-24 h-24 bg-primary-dim border-2 border-primary rounded-full flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-mono font-semibold text-primary">
                  {getInitials(user?.email?.split('@')[0] || 'User')}
                </span>
              )}
            </div>
            <button
              onClick={handleAvatarUpload}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-accent-coral transition-colors focus-ring"
              aria-label="Change photo"
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-text-mid text-sm">Tap camera to change photo</p>
        </motion.div>

        <motion.div
          className="bg-surface border border-border-soft rounded-xl p-6"
          whileHover={{ y: -2 }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                FULL NAME <span className="text-accent-coral">*</span>
              </label>
              <input
                {...register('fullName')}
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                placeholder="John Doe"
              />
              {errors.fullName && (
                <p className="text-accent-coral text-sm mt-1">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                PHONE NUMBER <span className="text-accent-coral">*</span>
              </label>
              <input
                {...register('phone')}
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="text-accent-coral text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                WHATSAPP NUMBER
              </label>
              <input
                {...register('whatsapp')}
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                placeholder="Enter WhatsApp number"
              />
              {errors.whatsapp && (
                <p className="text-accent-coral text-sm mt-1">{errors.whatsapp.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                EMAIL ADDRESS <span className="text-accent-coral">*</span>
              </label>
              <input
                {...register('email')}
                readOnly
                className="w-full px-3 py-2 bg-bg-app border border-border-soft rounded text-text-mid focus:ring-2 focus:ring-primary/20 focus-ring cursor-not-allowed"
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="text-accent-coral text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                DATE OF BIRTH
              </label>
              <div className="relative">
                <input
                  {...register('dob')}
                  type="date"
                  className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring appearance-none"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-low pointer-events-none" />
              </div>
              {errors.dob && (
                <p className="text-accent-coral text-sm mt-1">{errors.dob.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                ADDRESS
              </label>
              <textarea
                {...register('address')}
                rows={3}
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring resize-none"
                placeholder="Enter your address"
              />
              {errors.address && (
                <p className="text-accent-coral text-sm mt-1">{errors.address.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-2 uppercase tracking-wider">
                GENDER
              </label>
              <div className="flex gap-2">
                {(['Male', 'Female', 'Other'] as const).map((g) => (
                  <label key={g} className="flex-1">
                    <input
                      type="radio"
                      value={g}
                      {...register('gender')}
                      className="hidden"
                    />
                    <span
                      className={`
                        block text-center py-2 px-4 rounded font-medium text-sm cursor-pointer transition-colors
                        ${
                          selectedGender === g
                            ? 'bg-primary text-white'
                            : 'border border-border-soft text-text-hi hover:bg-bg-app'
                        }
                        focus-ring
                      `}
                    >
                      {g}
                    </span>
                  </label>
                ))}
              </div>
              {errors.gender && (
                <p className="text-accent-coral text-sm mt-1">{errors.gender.message}</p>
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