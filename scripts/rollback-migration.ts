// scripts/rollback-migration.ts

import { db, ShowNotes } from 'astro:db'
import { readdir, readFileSync, join } from '../src/utils'

console.log('[rollback] Starting migration rollback...')

try {
  const backupPath = join(process.cwd(), 'backups')
  console.log(`[rollback] Looking for latest backup in ${backupPath}`)
  
  const files = await readdir(backupPath)
  const latestBackup = files
    .filter(f => f.endsWith('.sql'))
    .sort()
    .pop()
  
  if (!latestBackup) {
    throw new Error('No backup file found')
  }
  
  console.log(`[rollback] Using backup: ${latestBackup}`)
  
  console.log('[rollback] Clearing current data...')
  await db.delete(ShowNotes)
  
  console.log('[rollback] Restoring from backup...')
  const backupSql = readFileSync(join(backupPath, latestBackup), 'utf-8')
  
  console.log('[rollback] Rollback completed!')
} catch (error) {
  console.error('[rollback] Rollback failed:', error)
  process.exit(1)
}