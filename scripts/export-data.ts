// scripts/export-data.ts

import { writeFileSync } from 'fs'
import { join } from 'path'

const exportPrismaData = async (): Promise<void> => {
  console.log('[export-data] Starting Prisma data export...')
  
  try {
    console.log('[export-data] Connecting to Prisma database...')
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    console.log('[export-data] Exporting show_notes data...')
    const showNotes = await prisma.show_notes.findMany()
    console.log(`[export-data] Found ${showNotes.length} show_notes records`)
    
    console.log('[export-data] Exporting embeddings data...')
    const embeddings = await prisma.embeddings.findMany()
    console.log(`[export-data] Found ${embeddings.length} embeddings records`)
    
    const exportData = {
      showNotes,
      embeddings,
      exportedAt: new Date().toISOString()
    }
    
    const exportPath = join(process.cwd(), 'migration-data', 'prisma-export.json')
    writeFileSync(exportPath, JSON.stringify(exportData, null, 2))
    console.log(`[export-data] Data exported to: ${exportPath}`)
    
    await prisma.$disconnect()
    console.log('[export-data] Prisma client disconnected')
    
  } catch (error) {
    console.error('[export-data] Error exporting data:', error)
    throw error
  }
}

export default exportPrismaData