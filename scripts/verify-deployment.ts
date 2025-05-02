// scripts/verify-deployment.ts

import { env } from '../src/utils'

console.log('[verify-deployment] Starting deployment verification...')

const requiredEnvVars = [
  'DATABASE_URL',
  'SERVER_MODE',
  'ASTRO_DB_REMOTE_URL',
  'ASTRO_DB_APP_TOKEN',
  'AWS_REGION',
  'S3_BUCKET_NAME'
]

let missingVars = 0

requiredEnvVars.forEach(varName => {
  if (!env[varName]) {
    console.error(`[verify-deployment] Missing environment variable: ${varName}`)
    missingVars++
  } else {
    console.log(`[verify-deployment] ✓ ${varName} is set`)
  }
})

if (missingVars > 0) {
  console.error(`[verify-deployment] ✗ ${missingVars} required environment variables are missing`)
  process.exit(1)
} else {
  console.log('[verify-deployment] ✓ All required environment variables are set')
}