// src/db.ts

/**
 * Contains the database initialization and show note insertion logic.
 *
 * @module db
 */

import { PrismaClient } from '@prisma/client'
import { l } from './utils/logging'

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
 * A PrismaClient instance used to store show notes
 */
export const db = new PrismaClient()

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

  await db.show_notes.create({
    data: {
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
    }
  })

  l.dim('    - Show note inserted successfully.\n')
}