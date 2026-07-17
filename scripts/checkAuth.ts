import { initializeApp, applicationDefault } from 'firebase-admin'
import { getAuth } from 'firebase-admin/auth'

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'hrcore-prod'
  
  initializeApp({
    projectId,
    credential: applicationDefault(),
  })

  const auth = getAuth()
  const tenantOrConfig = await auth.tenantManager().getAuth()
  console.log('Auth config:', { 
    tenantId: tenantOrConfig.tenantId,
    // List providers is not directly available, check project config instead
  })
  
  // Try to get project config to see if email/password is enabled
  try {
    const config = await auth.getProjectConfig()
    console.log('Project config:', config)
  } catch (e) {
    console.error('Could not get project config:', e)
  }
}

main()