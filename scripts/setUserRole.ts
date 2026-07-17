import { initializeApp, applicationDefault } from 'firebase-admin'
import { getAuth } from 'firebase-admin/auth'

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'hrcore-prod'
  const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://hrcore-prod-default-rtdb.asia-southeast1.firebasedatabase.app'
  
  const app = initializeApp({
    projectId,
    databaseURL,
    credential: applicationDefault(),
  })

  const uid = process.argv[2]
  const role = process.argv[3]
  
  if (!uid || !role) {
    console.error('Usage: npx tsx scripts/setUserRole.ts <uid> <role>')
    console.error('  role must be "admin" or "employee"')
    process.exit(1)
  }

  await getAuth(app).setCustomUserClaims(uid, { role })
  console.log(`Set role="${role}" for UID: ${uid}`)
}

main()