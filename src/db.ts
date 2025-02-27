// src/db.ts

/**
 * Database service abstraction layer
 * Provides conditional database operations based on environment
 * 
 * @module db
 */

import { l } from './utils/logging'
import { env } from 'node:process'

import type { ShowNote } from './utils/types'

// Don't import PrismaClient at the top level to avoid connection attempts in CLI mode

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
  async insertShowNote(_showNote: ShowNote): Promise<void> {
    l.dim('\n  CLI mode: Database operations disabled - skipping show note insertion')
    return Promise.resolve()
  }
  
  async getShowNote(_id: number): Promise<any> {
    l.dim('\n  CLI mode: Database operations disabled - cannot retrieve show notes')
    return Promise.resolve(null)
  }
  
  async getShowNotes(): Promise<any[]> {
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
    // We'll initialize the prisma client in an async init method
    this.prismaClient = null
  }
  
  /**
   * Initializes the Prisma client asynchronously
   */
  async init() {
    if (this.initialized) return this
    
    try {
      const { PrismaClient } = await import('@prisma/client')
      this.prismaClient = new PrismaClient()
      this.initialized = true
    } catch (error) {
      l.dim('\n  Warning: Could not initialize PrismaClient. Using NoOp database service instead.\n')
      // Don't rethrow - we'll operate in NoOp mode if PrismaClient fails
    }
    
    return this
  }
  
  async insertShowNote(showNote: ShowNote): Promise<void> {
    if (!this.initialized) await this.init()
    
    // If initialization failed, operate in silent no-op mode
    if (!this.prismaClient) {
      l.dim('\n  Database unavailable - skipping show note insertion')
      return Promise.resolve()
    }
    
    l.dim('\n  Inserting show note into the database...')

    const {
      showLink, channel, channelURL, title, description, publishDate, coverImage,
      frontmatter, prompt, transcript, llmOutput
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
          llmOutput: llmOutput ?? null
        }
      })
      l.dim('    - Show note inserted successfully.\n')
    } catch (error) {
      l.dim(`    - Failed to insert show note: ${(error as Error).message}\n`)
      // Don't rethrow - we want to continue even if the database operation fails
    }
  }
  
  async getShowNote(id: number): Promise<any> {
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
  
  async getShowNotes(): Promise<any[]> {
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
function isServerMode(): boolean {
  return env['DATABASE_URL'] !== undefined || 
         env['PGHOST'] !== undefined ||
         env['SERVER_MODE'] === 'true'
}

/**
 * Creates the appropriate database service based on the environment
 */
let dbServiceInstance: DatabaseService | null = null

// Instead of lazily creating the service, create it immediately
// This avoids race conditions in initialization
if (isServerMode()) {
  l.dim('  Server mode detected - initializing database service')
  dbServiceInstance = new PrismaDatabaseService()
  // Don't await the init() here - it will be called when needed
} else {
  l.dim('  CLI mode detected - using no-op database service')
  dbServiceInstance = new NoOpDatabaseService()
}

export const dbService = dbServiceInstance