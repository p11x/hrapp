import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { getAuth, getDatabase } from '../firebase/config'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      const auth = await getAuth()
      
      const handleAuthChange = async (firebaseUser: User | null) => {
        setLoading(true)
        setUser(firebaseUser)
        if (firebaseUser) {
          try {
            let isAdminUser = false
            const token = await firebaseUser.getIdTokenResult(true)
            console.log('Auth token claims:', token.claims)
            isAdminUser = token.claims.role === 'admin'
            
            if (!isAdminUser) {
              const db = await getDatabase()
              // First verify the user exists in our DB, if not they were deleted
              const snap = await db.get(`users/${firebaseUser.uid}`)
              if (!snap.exists()) {
                if ((auth as any).signOut) {
                  await (auth as any).signOut()
                } else {
                  await signOut(auth)
                }
                return
              }
              const roleSnap = await db.get(`users/${firebaseUser.uid}/role`)
              if (roleSnap.exists()) {
                isAdminUser = roleSnap.val() === 'admin'
              }
            }
            
            setIsAdmin(isAdminUser)
          } catch (e) {
            console.error('Token result error:', e)
            setIsAdmin(false)
          }
        } else {
          setIsAdmin(false)
        }
        setLoading(false)
      }

      let unsubscribe: () => void
      if ((auth as any).onAuthStateChanged) {
        unsubscribe = (auth as any).onAuthStateChanged(handleAuthChange)
      } else {
        unsubscribe = onAuthStateChanged(auth, handleAuthChange)
      }
      
      return () => unsubscribe()
    }
    initAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    const auth = await getAuth()
    let cred: any
    if ((auth as any).signInWithEmailAndPassword) {
      const mockUser = await (auth as any).signInWithEmailAndPassword(email, password)
      cred = { user: mockUser }
    } else {
      cred = await signInWithEmailAndPassword(auth, email, password)
    }
    
    try {
      const token = await cred.user.getIdTokenResult(true)
      if (token.claims.role !== 'admin') {
        const db = await getDatabase()
        const snap = await db.get(`users/${cred.user.uid}`)
        if (!snap.exists()) {
          await signOut(auth)
          throw new Error('Your account has been disabled or deleted.')
        }
      }
    } catch (error: any) {
      if (error.message === 'Your account has been disabled or deleted.') {
        throw error
      }
    }
  }

  const signOutUser = async () => {
    try {
      const auth = await getAuth()
      if ((auth as any).signOut) {
        await (auth as any).signOut()
      } else {
        await signOut(auth)
      }
    } catch (e) {
      console.error('Sign out error:', e)
    } finally {
      sessionStorage.clear()
      localStorage.clear()
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signIn, signOutUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}