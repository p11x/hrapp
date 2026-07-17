import { initializeApp, applicationDefault } from 'firebase-admin'
import { getDatabase } from 'firebase-admin/database'
import { seedData } from '../src/mock/seedData.ts'

async function migrate() {
  try {
    const app = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'hrcore-prod',
      databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://hrcore-prod-default-rtdb.asia-southeast1.firebasedatabase.app',
      credential: applicationDefault(),
    })

    const db = getDatabase(app)
    console.log('Migrating seed data to Firebase Realtime Database...')
    await db.ref('/').set(seedData)
    console.log('Migration complete. Data pushed to root of Realtime Database.')
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

migrate()