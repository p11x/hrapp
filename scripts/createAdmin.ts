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

  try {
    const user = await getAuth(app).getUserByEmail('admin@hrcore.dev')
    await getAuth(app).updateUser(user.uid, { password: 'admin123' })
    console.log(`Password updated for UID: ${user.uid}`)
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      const user = await getAuth(app).createUser({
        email: 'admin@hrcore.dev',
        password: 'admin123',
      })
      await getAuth(app).setCustomUserClaims(user.uid, { role: 'admin' })
      console.log(`Created admin user: ${user.uid}`)
    } else {
      console.error('Error:', error.message)
    }
  }
}

main()