// src/db.ts

/**
 * Database service abstraction layer
 * Provides conditional database operations based on environment
 *
 * Added new fields to the create call inside insertShowNote to store LLM and transcription details and costs.
 */

import { l } from './utils/logging.ts'
import { env } from './utils/node-utils.ts'

import type { ShowNote } from '../shared/types.ts'

/**
 * Interface for database operations
 */
export interface DatabaseService {
  /**
   * Inserts a show note into the database
   * @param showNote The show note to insert
   */
  insertShowNote: (showNote: ShowNote) => Promise<void>
  
  /**
   * Gets a show note by ID
   * @param id The ID of the show note to retrieve
   */
  getShowNote: (id: number) => Promise<any>
  
  /**
   * Gets all show notes
   */
  getShowNotes: () => Promise<any[]>
}

/**
 * No-op database service implementation for CLI usage
 * All methods are implemented but have no effect
 */
export class NoOpDatabaseService implements DatabaseService {
  async insertShowNote(_showNote: ShowNote) {
    l.dim('\n  CLI mode: Database operations disabled - skipping show note insertion')
    return Promise.resolve()
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

/**
 * Prisma database service implementation for server usage
 * Performs actual database operations using Prisma client
 */
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

  async insertShowNote(showNote: ShowNote) {
    if (!this.initialized) await this.init()
    if (!this.prismaClient) {
      l.dim('\n  Database unavailable - skipping show note insertion')
      return Promise.resolve()
    }
    l.dim('\n  Inserting show note into the database...')
    l.dim(`  * walletAddress: ${showNote.walletAddress}`)
    l.dim(`  * mnemonic: ${showNote.mnemonic}`)
    const {
      showLink, channel, channelURL, title, description, publishDate, coverImage,
      frontmatter, prompt, transcript, llmOutput, walletAddress, mnemonic
    } = showNote

    try {
      await this.prismaClient.show_notes.create({
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
    } catch (error) {
      l.dim(`    - Failed to insert show note: ${(error as Error).message}\n`)
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

/**
 * Determines if we're running in server mode or CLI mode
 */
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