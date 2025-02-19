// src/db.ts

/**
 * Contains the database initialization and show note insertion logic.
 *
 * @module db
 */

import { PrismaClient } from '@prisma/client'
import { l } from './utils/logging'

import type { ShowNote } from './utils/types'

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
    showLink, channel, channelURL, title, description, publishDate, coverImage,
    frontmatter, prompt, transcript, llmOutput
  } = showNote

  await db.show_notes.create({
    data: {
      showLink: showLink ?? null,
      channel: channel ?? null,
      channelURL: channelURL ?? null,
      title,
      description: description ?? null,
      publishDate,
      coverImage: coverImage ?? null,
      frontmatter: frontmatter ?? null,
      prompt: prompt ?? null,
      transcript: transcript ?? null,
      llmOutput: llmOutput ?? null
    }
  })

  l.dim('    - Show note inserted successfully.\n')
}