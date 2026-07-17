import { initializeApp, getApps, deleteApp } from 'firebase/app'
import { getAuth as fbGetAuth } from 'firebase/auth'
import { getDatabase as fbGetDatabase, ref, onValue, get, set, remove, update } from 'firebase/database'
import { getStorage as fbGetStorage } from 'firebase/storage'

let firebaseApp: any = null
let _auth: any = null
let _database: any = null
let _storage: any = null
let _secondaryApp: any = null

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const hasValidConfig = () => {
  return import.meta.env.VITE_FIREBASE_API_KEY && 
         import.meta.env.VITE_FIREBASE_PROJECT_ID &&
         import.meta.env.VITE_FIREBASE_API_KEY.length > 20
}

export async function getFirebaseApp() {
  if (firebaseApp) return firebaseApp
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  }
  try {
    if (getApps().length === 0) {
      console.log('Initializing Firebase app with config:', { projectId: firebaseConfig.projectId, databaseURL: firebaseConfig.databaseURL })
      firebaseApp = initializeApp(firebaseConfig)
    } else {
      console.log('Firebase app already initialized')
      firebaseApp = getApps()[0]
    }
    return firebaseApp
  } catch (e) {
    console.error('Firebase init failed:', e)
    return null
  }
}

export async function getSecondaryAuth() {
  if (_secondaryApp) {
    return fbGetAuth(_secondaryApp)
  }
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  }
  _secondaryApp = initializeApp(firebaseConfig, 'secondary')
  return fbGetAuth(_secondaryApp)
}

export async function getSecondaryDatabase() {
  if (_secondaryApp) {
    const fbDb = fbGetDatabase(_secondaryApp)
    const dbSetCall = async (path: string, value: any) => set(ref(fbDb, path), value)
    return { set: dbSetCall }
  }
  return null
}

export async function deleteSecondaryApp() {
  if (_secondaryApp) {
    await deleteApp(_secondaryApp)
    _secondaryApp = null
  }
}

export async function getAuth() {
  if (_auth) return _auth
  if (useMock || !hasValidConfig()) {
    _auth = (await import('../mock/mockAuth')).mockAuth
    return _auth
  }
  const app = await getFirebaseApp()
  if (app) {
    _auth = fbGetAuth(app)
  } else {
    _auth = (await import('../mock/mockAuth')).mockAuth
  }
  return _auth
}

export async function getDatabase() {
  if (_database) return _database
  if (useMock || !hasValidConfig()) {
    _database = (await import('../mock/mockDb')).mockDb
    return _database
  }
  const app = await getFirebaseApp()
  if (app) {
    const fbDb = fbGetDatabase(app)
    const dbGetCall = async (path: string) => {
      const snap = await get(ref(fbDb, path))
      return { exists: () => snap.exists(), val: () => snap.val() }
    }
    const dbSetCall = async (path: string, value: any) => set(ref(fbDb, path), value)
    const dbUpdateCall = async (path: string, value: any) => update(ref(fbDb, path), value)
    const dbRemoveCall = async (path: string) => remove(ref(fbDb, path))
    const onValueCall = (path: string, callback: (snapshot: { val: () => any }) => void) => {
      const unsub = onValue(ref(fbDb, path), (snap: any) => callback({ val: () => snap.val() }))
      return unsub || (() => {})
    }
    _database = {
      get: dbGetCall,
      set: dbSetCall,
      update: dbUpdateCall,
      remove: dbRemoveCall,
      onValue: onValueCall,
    }
  } else {
    _database = (await import('../mock/mockDb')).mockDb
  }
  return _database
}

export async function getStorage() {
  if (_storage) return _storage
  if (useMock || !hasValidConfig()) {
    _storage = (await import('../mock/mockStorage')).mockStorage
    return _storage
  }
  const app = await getFirebaseApp()
  if (app) {
    _storage = fbGetStorage(app)
  } else {
    _storage = (await import('../mock/mockStorage')).mockStorage
  }
  return _storage
}