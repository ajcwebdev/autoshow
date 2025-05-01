// test/db-operations.ts

import { db, ShowNotes, eq } from 'astro:db'

console.log('Testing database operations...')

// Test insert
const newNote = await db.insert(ShowNotes).values({
  title: 'Test Note from Script',
  publishDate: '2024-01-02',
  transcript: 'Test transcript from script'
}).returning()

console.log('✓ Insert successful:', newNote[0]?.title)

// Test select
const notes = await db.select().from(ShowNotes)
console.log(`✓ Found ${notes.length} total notes`)

// Test update
await db.update(ShowNotes)
  .set({ title: 'Updated Title' })
  .where(eq(ShowNotes.id, notes[0].id))

console.log('✓ Update successful')

console.log('All database operations completed successfully!')