type User = {
  uid: string
  email: string | null
  emailVerified: boolean
  displayName: string | null
  photoURL: string | null
  getIdTokenResult: () => Promise<{ claims: { role?: string } }>
}

type Listener = (user: User | null) => void

let currentUser: User | null = null
let listeners: Listener[] = []

const adminUser: User = {
  uid: 'admin-001',
  email: 'admin@vepcone.dev',
  emailVerified: true,
  displayName: 'Admin User',
  photoURL: null,
  getIdTokenResult: async () => ({ claims: { role: 'admin' } }),
}

const employeeUsers: Record<string, User> = {
  'emp-001': {
    uid: 'emp-001',
    email: 'alice@vepcone.dev',
    emailVerified: true,
    displayName: 'Alice Chen',
    photoURL: null,
    getIdTokenResult: async () => ({ claims: {} }),
  },
  'emp-002': {
    uid: 'emp-002',
    email: 'bob@vepcone.dev',
    emailVerified: true,
    displayName: 'Bob Rivera',
    photoURL: null,
    getIdTokenResult: async () => ({ claims: {} }),
  },
  'emp-003': {
    uid: 'emp-003',
    email: 'carol@vepcone.dev',
    emailVerified: true,
    displayName: 'Carol Kim',
    photoURL: null,
    getIdTokenResult: async () => ({ claims: {} }),
  },
  'emp-004': {
    uid: 'emp-004',
    email: 'david@vepcone.dev',
    emailVerified: true,
    displayName: 'David Park',
    photoURL: null,
    getIdTokenResult: async () => ({ claims: {} }),
  },
  'emp-005': {
    uid: 'emp-005',
    email: 'eve@vepcone.dev',
    emailVerified: true,
    displayName: 'Eve Martinez',
    photoURL: null,
    getIdTokenResult: async () => ({ claims: {} }),
  },
  'emp-006': {
    uid: 'emp-006',
    email: 'frank@vepcone.dev',
    emailVerified: true,
    displayName: 'Frank Wilson',
    photoURL: null,
    getIdTokenResult: async () => ({ claims: {} }),
  },
  'emp-007': {
    uid: 'emp-007',
    email: 'sunny@gmail.com',
    emailVerified: true,
    displayName: 'Sunny',
    photoURL: null,
    getIdTokenResult: async () => ({ claims: {} }),
  },
}

const validCredentials: Record<string, string> = {
  'admin@vepcone.dev': 'admin123',
  'alice@vepcone.dev': 'password',
  'bob@vepcone.dev': 'password',
  'carol@vepcone.dev': 'password',
  'david@vepcone.dev': 'password',
  'eve@vepcone.dev': 'password',
  'frank@vepcone.dev': 'password',
  'sunny@gmail.com': '123456',
}

const restoreSession = () => {
  const stored = sessionStorage.getItem('mock-auth-user')
  if (stored) {
    const { email } = JSON.parse(stored)
    const found = email === 'admin@vepcone.dev' ? adminUser : Object.values(employeeUsers).find(u => u.email === email)
    if (found) currentUser = found
  }
}

restoreSession()

export const mockAuth = {
  currentUser: () => currentUser,

  signInWithEmailAndPassword: async (email: string, password: string): Promise<User> => {
    if (validCredentials[email] !== password) {
      throw new Error('Firebase: Error (auth/invalid-credential).')
    }
    const found = email === 'admin@vepcone.dev' ? adminUser : Object.values(employeeUsers).find(u => u.email === email)
    currentUser = found ?? null
    sessionStorage.setItem('mock-auth-user', JSON.stringify({ email }))
    listeners.forEach((l) => l(currentUser))
    return currentUser as User
  },

  createUserWithEmailAndPassword: async (email: string, password: string, role?: string): Promise<User> => {
    if (validCredentials[email]) {
      throw new Error('Firebase: Error (auth/email-already-in-use).')
    }
    const uid = `emp-${Date.now()}`
    const newUser: User = {
      uid,
      email,
      emailVerified: true,
      displayName: null,
      photoURL: null,
      getIdTokenResult: async () => ({ claims: role === 'admin' ? { role: 'admin' } : {} }),
    }
    employeeUsers[uid] = newUser
    validCredentials[email] = password
    currentUser = newUser
    sessionStorage.setItem('mock-auth-user', JSON.stringify({ email }))
    listeners.forEach((l) => l(currentUser))
    return newUser
  },

  signOut: async () => {
    currentUser = null
    sessionStorage.removeItem('mock-auth-user')
    listeners.forEach((l) => l(null))
  },

  onAuthStateChanged: (callback: Listener) => {
    listeners.push(callback)
    callback(currentUser)
    return () => {
      listeners = listeners.filter((l) => l !== callback)
    }
  },
}