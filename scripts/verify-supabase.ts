// scripts/verify-supabase.ts

import { createClient } from '@supabase/supabase-js'
import { env } from '../src/utils'

const log = (message: string): void => {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

const error = (message: string, err?: unknown): void => {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`)
  if (err instanceof Error) {
    console.error(`[${new Date().toISOString()}] Stack trace: ${err.stack}`)
  }
}

const verifySupabase = async (): Promise<void> => {
  log('=========================================')
  log('Starting Supabase verification...')
  log('=========================================')

  try {
    log('Checking environment variables...')
    const remoteUrl = env.ASTRO_DB_REMOTE_URL
    const appToken = env.ASTRO_DB_APP_TOKEN

    if (!remoteUrl || !appToken) {
      throw new Error('Missing Supabase credentials')
    }

    log('✓ Credentials found')

    log('Initializing Supabase client...')
    const supabase = createClient(remoteUrl, appToken)
    log('✓ Client initialized')

    log('Testing database connection...')
    const { data: showNotes, error: showNotesError } = await supabase
      .from('show_notes')
      .select('id, title, publishDate')
      .limit(5)

    if (showNotesError) {
      error('Failed to query show_notes', showNotesError)
      throw showNotesError
    }

    log(`✓ Connected to show_notes table - found ${showNotes?.length || 0} records`)

    const { data: embeddings, error: embeddingsError } = await supabase
      .from('embeddings')
      .select('filename')
      .limit(5)

    if (embeddingsError) {
      error('Failed to query embeddings', embeddingsError)
      throw embeddingsError
    }

    log(`✓ Connected to embeddings table - found ${embeddings?.length || 0} records`)

    log('=========================================')
    log('Supabase verification completed successfully!')
    log('=========================================')
  } catch (err) {
    error('Verification failed', err)
    process.exit(1)
  }
}

verifySupabase().catch(err => {
  error('Unexpected error during verification', err)
  process.exit(1)
})