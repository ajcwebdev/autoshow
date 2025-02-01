// src/server/db.ts

/**
 * Database and ShowNote utilities for Autoshow.
 * Initializes a SQLite database and provides helper functions
 * for inserting and retrieving show note data.
 *
 * @packageDocumentation
 */

import { DatabaseSync } from 'node:sqlite'
import type { ShowNote } from './utils/types/step-types'

/**
 * Initialize the database connection.
 * Creates the show_notes table if it doesn't exist.
 */
export const db = new DatabaseSync('show_notes.db', { open: true })

db.exec(`
  CREATE TABLE IF NOT EXISTS show_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    showLink TEXT,
    channel TEXT,
    channelURL TEXT,
    title TEXT NOT NULL,
    description TEXT,
    publishDate TEXT NOT NULL,
    coverImage TEXT,
    frontmatter TEXT,
    prompt TEXT,
    transcript TEXT,
    llmOutput TEXT
  )
`)

/**
 * Insert new show note row into database.
 * @param {ShowNote} showNote - The show note data to insert
 */
export function insertShowNote(showNote: ShowNote): void {
  const {
    showLink, channel, channelURL, title, description, publishDate, coverImage, frontmatter, prompt, transcript, llmOutput
  } = showNote

  const insert = db.prepare(`
    INSERT INTO show_notes (
      showLink, channel, channelURL, title, description, publishDate, coverImage, frontmatter, prompt, transcript, llmOutput
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insert.run(
    showLink,
    channel,
    channelURL,
    title,
    description,
    publishDate,
    coverImage,
    frontmatter,
    prompt,
    transcript,
    llmOutput
  )
}