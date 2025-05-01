// scripts/import-to-supabase.ts

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import { env } from '../src/utils'

const importToSupabase = async (): Promise<void> => {
  console.log('[import-supabase] Starting data import to Supabase...')
  
  try {
    if (!env.ASTRO_DB_REMOTE_URL || !env.ASTRO_DB_APP_TOKEN) {
      console.error('[import-supabase] Supabase credentials not found')
      throw new Error('Missing Supabase credentials')
    }
    
    const supabase = createClient(
      env.ASTRO_DB_REMOTE_URL,
      env.ASTRO_DB_APP_TOKEN
    )
    
    const exportPath = join(process.cwd(), 'migration-data', 'prisma-export.json')
    console.log(`[import-supabase] Reading export data from: ${exportPath}`)
    
    const exportedData = JSON.parse(readFileSync(exportPath, 'utf-8'))
    const { showNotes, embeddings } = exportedData
    
    console.log('[import-supabase] Starting batch import to Supabase...')
    
    const batchSize = 100
    let processedNotes = 0
    
    for (let i = 0; i < showNotes.length; i += batchSize) {
      const batch = showNotes.slice(i, i + batchSize)
      console.log(`[import-supabase] Processing show_notes batch ${i / batchSize + 1}`)
      
      const { error } = await supabase
        .from('show_notes')
        .insert(batch)
      
      if (error) {
        console.error(`[import-supabase] Error in batch ${i / batchSize + 1}:`, error)
        throw error
      }
      
      processedNotes += batch.length
      console.log(`[import-supabase] Imported ${processedNotes}/${showNotes.length} show_notes`)
    }
    
    let processedEmbeddings = 0
    
    for (let i = 0; i < embeddings.length; i += batchSize) {
      const batch = embeddings.slice(i, i + batchSize)
      console.log(`[import-supabase] Processing embeddings batch ${i / batchSize + 1}`)
      
      const { error } = await supabase
        .from('embeddings')
        .insert(batch)
      
      if (error) {
        console.error(`[import-supabase] Error in batch ${i / batchSize + 1}:`, error)
        throw error
      }
      
      processedEmbeddings += batch.length
      console.log(`[import-supabase] Imported ${processedEmbeddings}/${embeddings.length} embeddings`)
    }
    
    console.log('[import-supabase] Data import to Supabase completed successfully')
    
  } catch (error) {
    console.error('[import-supabase] Error importing to Supabase:', error)
    throw error
  }
}

export default importToSupabase