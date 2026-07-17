import { initializeApp, applicationDefault } from 'firebase-admin'
import { getAuth } from 'firebase-admin/auth'

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'hrcore-prod'
  const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://hrcore-prod-default-rtdb.asia-southeast1.firebasedatabase.app'
  
  try {
    const app = initializeApp({
      projectId,
      databaseURL,
      credential: applicationDefault(),
    })

    const uid = process.argv[2]
    
    if (!uid) {
      console.error('Usage: npx tsx scripts/seedAdmin.ts <uid>')
      process.exit(1)
    }

    await getAuth(app).setCustomUserClaims(uid, { role: 'admin' })
    console.log(`Admin claim set successfully for UID: ${uid}`)
    process.exit(0)
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()