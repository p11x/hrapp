import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '../lib/validators'
import type { LoginFormData } from '../lib/validators'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'


export function Login() {
  const { signIn, user, isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (user && !loading) {
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/employee/dashboard', { replace: true })
      }
    }
  }, [user, isAdmin, navigate, loading])

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data.email, data.password)
      toast.success('Welcome back', {
        style: {
          background: '#FFFFFF',
          border: '1px solid #EAEBF3',
          color: '#1E1B2E',
        },
      })
    } catch (error: any) {
      console.error('Login error:', error)
      const msg = error?.message || error?.code || 'Invalid credentials'
      toast.error(msg, {
        style: {
          background: '#FFFFFF',
          border: '1px solid #EAEBF3',
          color: '#1E1B2E',
        },
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F5F6FB' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white border rounded-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6" style={{ borderColor: '#EAEBF3' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-display font-bold text-lg">
              V
            </div>
            <h1 className="text-2xl font-display font-semibold text-text-hi">
              Vepcone Soft Systems
            </h1>
          </div>



          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-mid mb-2">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-3 py-2 bg-white border rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                style={{ borderColor: '#EAEBF3' }}
                placeholder="you@company.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-accent-coral text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-mid mb-2">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                className="w-full px-3 py-2 bg-white border rounded text-text-hi focus:outline-none focus:border-primary transition-colors focus-ring"
                style={{ borderColor: '#EAEBF3' }}
                placeholder="••••••••"
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-accent-coral text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 bg-primary text-white font-medium rounded hover:bg-primary/90 transition-colors disabled:opacity-50 focus-ring"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}