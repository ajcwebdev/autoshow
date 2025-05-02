// scripts/verify-deployment.ts

import { env } from '../src/utils'
import { createClient } from '@supabase/supabase-js'

const log = (message: string): void => {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

const error = (message: string, err?: unknown): void => {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`)
  if (err instanceof Error) {
    console.error(`[${new Date().toISOString()}] Stack trace: ${err.stack}`)
  } else if (err) {
    console.error(`[${new Date().toISOString()}] Error details: ${String(err)}`)
  }
}

const verifyEnvironmentVariables = (): void => {
  log('Checking environment variables...')
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'SERVER_MODE',
    'ASTRO_DB_REMOTE_URL',
    'ASTRO_DB_APP_TOKEN',
    'AWS_REGION',
    'S3_BUCKET_NAME',
    'PRODUCTION_URL'
  ]
  
  let missingVars = 0
  
  requiredEnvVars.forEach(varName => {
    if (!env[varName]) {
      error(`Missing environment variable: ${varName}`)
      missingVars++
    } else {
      log(`✓ ${varName} is set`)
    }
  })
  
  if (missingVars > 0) {
    throw new Error(`${missingVars} required environment variables are missing`)
  }
  
  log('✓ All required environment variables are set')
}

const testDatabaseConnection = async (): Promise<void> => {
  log('Initializing Supabase client...')
  
  if (!env.ASTRO_DB_REMOTE_URL || !env.ASTRO_DB_APP_TOKEN) {
    throw new Error('Missing required Supabase credentials')
  }
  
  const supabase = createClient(
    env.ASTRO_DB_REMOTE_URL,
    env.ASTRO_DB_APP_TOKEN
  )
  
  log('Testing database connection...')
  const { data, error: dbError } = await supabase
    .from('show_notes')
    .select('count')
    .limit(1)
    .single()
  
  if (dbError) {
    throw new Error(`Database connection failed: ${dbError.message}`)
  }
  
  log(`✓ Database connected successfully - ${data ? 'data found' : 'no data'}`)
}

const testProductionEndpoints = async (): Promise<void> => {
  log('Testing production endpoints...')
  const prodUrl = env.PRODUCTION_URL || 'https://your-app.railway.app'
  log(`Using production URL: ${prodUrl}`)
  
  try {
    const response = await fetch(`${prodUrl}/api/show-notes`)
    log(`API response status: ${response.status}`)
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }
    
    const data = await response.json()
    log(`✓ Production API is healthy - found ${data.showNotes?.length || 0} notes`)
  } catch (fetchError) {
    error('Failed to test production API', fetchError)
    throw fetchError
  }
}

const runVerification = async (): Promise<void> => {
  log('=========================================')
  log('Starting deployment verification...')
  log('=========================================')
  
  try {
    // Step 1: Verify environment variables
    verifyEnvironmentVariables()
    
    // Step 2: Test database connection
    await testDatabaseConnection()
    
    // Step 3: Test production endpoints
    await testProductionEndpoints()
    
    log('=========================================')
    log('All verification checks complete!')
    log('=========================================')
  } catch (err) {
    error('Verification failed', err)
    process.exit(1)
  }
}

// Run the verification process
runVerification().catch(err => {
  error('Unexpected error during verification', err)
  process.exit(1)
})