// src/db.ts

import { l } from './utils.ts'
import { env } from './utils.ts'
import type { ShowNoteType } from './types.ts'

export interface DatabaseService {
  insertShowNote: (showNote: ShowNoteType) => Promise<any>
  getShowNote: (id: number) => Promise<any>
  getShowNotes: () => Promise<any[]>
}

export class NoOpDatabaseService implements DatabaseService {
  async insertShowNote(_showNote: ShowNoteType) {
    l.dim('\n  CLI mode: Database operations disabled - skipping show note insertion')
    return Promise.resolve({ ..._showNote })
  }
  async getShowNote(_id: number) {
    l.dim('\n  CLI mode: Database operations disabled - cannot retrieve show notes')
    return Promise.resolve(null)
  }
  async getShowNotes() {
    l.dim('\n  CLI mode: Database operations disabled - cannot retrieve show notes')
    return Promise.resolve([])
  }
}

export class PrismaDatabaseService implements DatabaseService {
  private prismaClient: any | null = null
  private initialized = false

  constructor() {
    this.prismaClient = null
  }

  async init() {
    if (this.initialized) return this
    try {
      const { PrismaClient } = await import('@prisma/client')
      this.prismaClient = new PrismaClient()
      this.initialized = true
    } catch (error) {
      l.dim('\n  Warning: Could not initialize PrismaClient. Using NoOp database service instead.\n')
    }
    return this
  }

  async insertShowNote(showNote: ShowNoteType) {
    if (!this.initialized) await this.init()
    if (!this.prismaClient) {
      l.dim('\n  Database unavailable - skipping show note insertion')
      return Promise.resolve({ ...showNote })
    }
    l.dim('\n  Inserting show note into the database...')
    l.dim(`  * walletAddress: ${showNote.walletAddress}`)
    l.dim(`  * mnemonic: ${showNote.mnemonic}`)

    const {
      showLink, channel, channelURL, title, description, publishDate, coverImage,
      frontmatter, prompt, transcript, llmOutput, walletAddress, mnemonic
    } = showNote

    try {
      const newRecord = await this.prismaClient.show_notes.create({
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
          llmOutput: llmOutput ?? null,
          walletAddress: walletAddress ?? null,
          mnemonic: mnemonic ?? null,
          llmService: showNote.llmService ?? null,
          llmModel: showNote.llmModel ?? null,
          llmCost: showNote.llmCost ?? null,
          transcriptionService: showNote.transcriptionService ?? null,
          transcriptionModel: showNote.transcriptionModel ?? null,
          transcriptionCost: showNote.transcriptionCost ?? null,
          finalCost: showNote.finalCost ?? null
        }
      })
      l.dim('    - Show note inserted successfully.\n')
      return newRecord
    } catch (error) {
      l.dim(`    - Failed to insert show note: ${(error as Error).message}\n`)
      return { ...showNote }
    }
  }

  async getShowNote(id: number) {
    if (!this.initialized) await this.init()
    if (!this.prismaClient) return null

    try {
      return await this.prismaClient.show_notes.findUnique({
        where: {
          id: id
        }
      })
    } catch (error) {
      l.dim(`    - Failed to get show note: ${(error as Error).message}\n`)
      return null
    }
  }

  async getShowNotes() {
    if (!this.initialized) await this.init()
    if (!this.prismaClient) return []

    try {
      return await this.prismaClient.show_notes.findMany({
        orderBy: {
          publishDate: 'desc'
        }
      })
    } catch (error) {
      l.dim(`    - Failed to get show notes: ${(error as Error).message}\n`)
      return []
    }
  }
}

function isServerMode() {
  return env['DATABASE_URL'] !== undefined ||
         env['PGHOST'] !== undefined ||
         env['SERVER_MODE'] === 'true'
}

let dbServiceInstance: DatabaseService | null = null

if (isServerMode()) {
  l.dim('  Server mode detected - initializing database service')
  dbServiceInstance = new PrismaDatabaseService()
} else {
  l.dim('  CLI mode detected - using no-op database service')
  dbServiceInstance = new NoOpDatabaseService()
}

export const dbService = dbServiceInstance