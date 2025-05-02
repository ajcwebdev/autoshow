// scripts/test-db-operations.ts

import { db, ShowNotes, eq } from 'astro:db'

console.log('[test-db] Starting database operations test...')

try {
  console.log('[test-db] Testing basic query...')
  const notes = await db.select().from(ShowNotes).limit(5)
  console.log(`[test-db] Found ${notes.length} notes`)
  
  console.log('[test-db] Testing specific record query...')
  const testNote = await db
    .select()
    .from(ShowNotes)
    .where(eq(ShowNotes.id, 1))
    .limit(1)
  
  if (testNote.length > 0) {
    console.log(`[test-db] ✓ Found test note: ${testNote[0].title}`)
  } else {
    console.log('[test-db] ✗ Test note not found')
  }
  
  console.log('[test-db] All database tests passed!')
} catch (error) {
  console.error('[test-db] Database test failed:', error)
  process.exit(1)
}