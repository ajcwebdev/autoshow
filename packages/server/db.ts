// packages/server/db.ts

import { DatabaseSync } from 'node:sqlite'

// Initialize the database connection
export const db = new DatabaseSync('show_notes.db', { open: true })

// Create the show_notes table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS show_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    content TEXT NOT NULL
  )
`)