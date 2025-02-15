// src/db.ts

/**
 * Contains the database initialization and show note insertion logic.
 *
 * @module db
 */

import pg from 'pg'
import { type Pool as PoolType } from 'pg'
import { l } from './utils/logging'

const { Pool } = pg

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
 * A pg Pool instance used to store show notes
 */
export const db: PoolType = new Pool({
  host: process.env['PGHOST'],
  user: process.env['PGUSER'],
  password: process.env['PGPASSWORD'],
  database: process.env['PGDATABASE'],
  port: process.env['PGPORT'] ? Number(process.env['PGPORT']) : undefined
})

// Create the show_notes table if it doesn't already exist
void (async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS show_notes (
      id SERIAL PRIMARY KEY,
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
})()

/**
 * Inserts a new show note row into the show_notes table
 *
 * @param {ShowNote} showNote - The show note data to insert
 */
export async function insertShowNote(showNote: ShowNote) {
  l.dim('\n  Inserting show note into the database...')

  const {
    showLink, channel, channelURL, title, description, publishDate, coverImage, frontmatter, prompt, transcript, llmOutput
  } = showNote

  await db.query(`
    INSERT INTO show_notes (
      showLink, channel, channelURL, title, description, publishDate, coverImage, frontmatter, prompt, transcript, llmOutput
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [
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
  ])

  l.dim('    - Show note inserted successfully.\n')
}