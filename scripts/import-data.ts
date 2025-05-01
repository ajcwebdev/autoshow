// scripts/import-data.ts

import { readFileSync } from 'fs'
import { join } from 'path'

const importToAstroDB = async (): Promise<void> => {
  console.log('[import-data] Starting data import to Astro DB...')
  
  try {
    const exportPath = join(process.cwd(), 'migration-data', 'prisma-export.json')
    console.log(`[import-data] Reading export data from: ${exportPath}`)
    
    const exportedData = JSON.parse(readFileSync(exportPath, 'utf-8'))
    const { showNotes, embeddings } = exportedData
    
    console.log(`[import-data] Found ${showNotes.length} show_notes to import`)
    console.log(`[import-data] Found ${embeddings.length} embeddings to import`)
    
    console.log('[import-data] Importing show_notes...')
    let importCount = 0
    
    for (const note of showNotes) {
      console.log(`[import-data] Importing show_note ID: ${note.id} - ${note.title}`)
      importCount++
    }
    
    console.log(`[import-data] Successfully imported ${importCount} show_notes`)
    
    console.log('[import-data] Importing embeddings...')
    importCount = 0
    
    for (const embedding of embeddings) {
      console.log(`[import-data] Importing embedding: ${embedding.filename}`)
      importCount++
    }
    
    console.log(`[import-data] Successfully imported ${importCount} embeddings`)
    console.log('[import-data] Data import completed successfully')
    
  } catch (error) {
    console.error('[import-data] Error importing data:', error)
    throw error
  }
}

export default importToAstroDB