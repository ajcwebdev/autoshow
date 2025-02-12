// src/db.ts

/**
 * Contains the database initialization and show note insertion logic.
 *
 * @module db
 */

import Database from 'better-sqlite3'
import { l } from './utils/logging'

import type { Database as DatabaseType } from 'better-sqlite3'

/**
 * Represents a single show note record in the database
 */
export type ShowNote = {
  showLink: string
  channel: string
  channelURL: string
  title: string
  description: string
  publishDate: string
  coverImage: string
  frontmatter: string
  prompt: string
  transcript: string
  llmOutput: string
}

/**
 * A better-sqlite3 Database instance used to store show notes
 */
export const db: DatabaseType = new Database('show_notes.db')

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
 * Inserts a new show note row into the show_notes table
 *
 * @param {ShowNote} showNote - The show note data to insert
 */
export function insertShowNote(showNote: ShowNote) {
  l.dim('\n  Inserting show note into the database...')

  const {
    showLink, channel, channelURL, title, description, publishDate, coverImage, frontmatter, prompt, transcript, llmOutput
  } = showNote

  db.prepare(`
    INSERT INTO show_notes (
      showLink, channel, channelURL, title, description, publishDate, coverImage, frontmatter, prompt, transcript, llmOutput
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
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

  l.dim('    - Show note inserted successfully.\n')
}