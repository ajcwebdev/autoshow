// scripts/post-deployment-verify.ts

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

const start = async (): Promise<void> => {
  log('=========================================')
  log('Starting post-deployment verification...')
  log('=========================================')

  try {
    log('Checking environment variables...')
    log(`- ASTRO_DB_REMOTE_URL: ${env.ASTRO_DB_REMOTE_URL ? 'set' : 'not set'}`)
    log(`- ASTRO_DB_APP_TOKEN: ${env.ASTRO_DB_APP_TOKEN ? 'set' : 'not set'}`)
    log(`- PRODUCTION_URL: ${env.PRODUCTION_URL ? 'set' : 'not set'}`)

    if (!env.ASTRO_DB_REMOTE_URL || !env.ASTRO_DB_APP_TOKEN) {
      throw new Error('Missing required Supabase credentials')
    }

    log('Initializing Supabase client...')
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

    log('=========================================')
    log('All verification checks complete!')
    log('=========================================')
  } catch (err) {
    error('Verification failed', err)
    process.exit(1)
  }
}

start().catch(err => {
  error('Unexpected error during verification', err)
  process.exit(1)
})