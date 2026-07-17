require('dotenv').config()
const apiKey = process.env.VITE_FIREBASE_API_KEY
async function test() {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      returnSecureToken: true
    })
  })
  const data = await res.json()
  console.log(data)
}
test()
