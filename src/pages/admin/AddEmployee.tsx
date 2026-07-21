import { PageShell } from '../../components/PageShell'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { hrToast } from '../../components/HRCToast'

const addEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  companyName: z.string().min(1, 'Company Name is required'),
  position: z.string().min(1, 'Position / Job Title is required'),
  role: z.enum(['employee', 'admin']),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type AddEmployeeFormData = z.infer<typeof addEmployeeSchema>

export function AddEmployee() {
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AddEmployeeFormData>({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: { role: 'employee' },
  })

  const selectedRole = watch('role', 'employee')

  const onSubmit = async (data: AddEmployeeFormData) => {
    setLoading(true)
    try {
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
      if (!apiKey) throw new Error('Missing Firebase API Key')
      
      // Use Identity Toolkit REST API to create user without affecting current auth state
      const signUpRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          returnSecureToken: true
        })
      })
      
      const signUpData = await signUpRes.json()
      if (!signUpRes.ok) {
        throw new Error(signUpData.error?.message || 'Failed to create user account')
      }
      
      const uid = signUpData.localId
      
      const { getDatabase } = await import('../../firebase/config')
      const primaryDb = await getDatabase()
      
      // The admin writes to the user profile
      await (primaryDb as any).set(`users/${uid}`, {
        id: uid,
        email: data.email,
        fullName: data.name,
        companyName: data.companyName,
        position: data.position,
        role: data.role
      })
      
      // The admin writes to the company employee directory
      await (primaryDb as any).set(`employees/${uid}`, {
        name: data.name,
        companyName: data.companyName,
        position: data.position,
        role: data.role,
      })
      
      hrToast.success('Employee Created', `${data.name} has been added successfully`)
      reset()
    } catch (error: any) {
      hrToast.error('Creation Failed', error?.message || 'Unable to create employee')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell title="Add Employee">
      <div className="max-w-md">
        <motion.div
          className="bg-surface border border-border-soft rounded-xl p-6"
          whileHover={{ y: -2 }}
        >
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                NAME <span className="text-accent-coral">*</span>
              </label>
              <input
                {...register('name')}
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                placeholder="Enter employee name"
              />
              {errors.name && (
                <p className="text-accent-coral text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                EMAIL <span className="text-accent-coral">*</span>
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                placeholder="Enter email"
              />
              {errors.email && (
                <p className="text-accent-coral text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                COMPANY NAME <span className="text-accent-coral">*</span>
              </label>
              <input
                {...register('companyName')}
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                placeholder="Enter company name"
              />
              {errors.companyName && (
                <p className="text-accent-coral text-sm mt-1">{errors.companyName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                POSITION / JOB TITLE <span className="text-accent-coral">*</span>
              </label>
              <input
                {...register('position')}
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                placeholder="Enter job title"
              />
              {errors.position && (
                <p className="text-accent-coral text-sm mt-1">{errors.position.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-2 uppercase tracking-wider">
                ACCOUNT ROLE
              </label>
              <div className="flex gap-2">
                {(['employee', 'admin'] as const).map((role) => (
                  <label key={role} className="flex-1">
                    <input
                      type="radio"
                      value={role}
                      {...register('role')}
                      className="hidden"
                    />
                    <span
                      className={`
                        block text-center py-2 px-4 rounded font-medium text-sm cursor-pointer transition-colors
                        ${selectedRole === role ? 'bg-primary-dim text-primary' : 'border border-border-soft text-text-hi hover:bg-bg-app'}
                        focus-ring
                      `}
                    >
                      {role === 'employee' ? 'Employee' : 'Admin'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-1.5 uppercase tracking-wider">
                PASSWORD <span className="text-accent-coral">*</span>
              </label>
              <input
                {...register('password')}
                type="password"
                className="w-full px-3 py-2 bg-surface border border-border-soft rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                placeholder="Enter password (min 6 chars)"
              />
              {errors.password && (
                <p className="text-accent-coral text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-white font-medium rounded hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 focus-ring"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Employee
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </PageShell>
  )
}