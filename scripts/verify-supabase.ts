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
  } else if (err) {
    console.error(`[${new Date().toISOString()}] Error details: ${JSON.stringify(err)}`)
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

    log(`✓ Credentials found: URL=${remoteUrl.substring(0, 20)}...`)

    log('Initializing Supabase client...')
    const supabase = createClient(remoteUrl, appToken)
    log('✓ Client initialized')

    log('Checking Supabase connection...')
    const { data: tablesList, error: tablesError } = await supabase.rpc('get_tables')
    
    if (tablesError) {
      log('Failed to get table list using RPC, trying alternative method...')
      
      // Try a simple query to verify connection
      const { data: healthCheck, error: healthError } = await supabase.from('_dummy_query').select('*').limit(1).match(() => ({ data: null, error: null }))
      
      if (healthError) {
        log('Basic connection test failed')
        error('Connection failed', healthError)
        throw new Error(`Connection test failed: ${healthError.message}`)
      } else {
        log('✓ Basic connection working but unable to list tables')
      }
    } else {
      log(`✓ Successfully connected to Supabase - found ${tablesList?.length || 0} tables`)
      if (tablesList && tablesList.length > 0) {
        log(`Available tables: ${tablesList.join(', ')}`)
      }
    }

    log('Testing show_notes table...')
    try {
      const { data: showNotesCheck, error: showNotesCheckError } = await supabase
        .from('show_notes')
        .select('count')
        .limit(1)
        .single()
      
      if (showNotesCheckError) {
        log('❌ show_notes table query failed')
        error('show_notes table check failed', showNotesCheckError)
        
        if (showNotesCheckError.message.includes('does not exist')) {
          log('DIAGNOSIS: The show_notes table does not exist yet')
          log('SOLUTION: Run `npm run db:push:remote` to create the table schema')
        } else if (showNotesCheckError.message.includes('permission denied')) {
          log('DIAGNOSIS: Permission issues with the show_notes table')
          log('SOLUTION: Check Supabase RLS policies or use service role key')
        } else {
          log(`DIAGNOSIS: Unknown error with show_notes table: ${showNotesCheckError.message}`)
        }
      } else {
        log(`✓ show_notes table exists and is accessible`)
        const count = showNotesCheck?.count || 0
        log(`Found ${count} records in show_notes table`)
      }
    } catch (queryError) {
      error('Failed to test show_notes table', queryError)
    }

    log('Testing embeddings table...')
    try {
      const { data: embeddingsCheck, error: embeddingsCheckError } = await supabase
        .from('embeddings')
        .select('count')
        .limit(1)
        .single()
      
      if (embeddingsCheckError) {
        log('❌ embeddings table query failed')
        error('embeddings table check failed', embeddingsCheckError)
        
        if (embeddingsCheckError.message.includes('does not exist')) {
          log('DIAGNOSIS: The embeddings table does not exist yet')
          log('SOLUTION: Run `npm run db:push:remote` to create the table schema')
        } else {
          log(`DIAGNOSIS: Unknown error with embeddings table: ${embeddingsCheckError.message}`)
        }
      } else {
        log(`✓ embeddings table exists and is accessible`)
        const count = embeddingsCheck?.count || 0
        log(`Found ${count} records in embeddings table`)
      }
    } catch (queryError) {
      error('Failed to test embeddings table', queryError)
    }

    // Provide recommendations based on verification
    log('=========================================')
    log('Verification complete - Next steps:')
    log('=========================================')
    log('1. If tables do not exist: Run `npm run db:push:remote`')
    log('2. To verify tables after creation: Run this script again')
    log('3. To import data: Run `npx tsx scripts/import-to-supabase.ts`')
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