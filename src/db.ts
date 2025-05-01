// src/db.ts

import { l } from './utils'
import { env } from './utils'
import { db, ShowNotes, eq } from 'astro:db'
import type { ShowNoteType } from './types'

export interface DatabaseService {
  insertShowNote: (showNote: ShowNoteType) => Promise<any>
  getShowNote: (id: number) => Promise<any>
  getShowNotes: () => Promise<any[]>
}

export class NoOpDatabaseService implements DatabaseService {
  async insertShowNote(_showNote: ShowNoteType) {
    l.dim('\n  CLI mode: Database operations disabled - skipping show note insertion')
    console.log(`[NoOpDatabaseService] insertShowNote called with title: ${_showNote.title}`)
    console.log(`[NoOpDatabaseService] Returning mock show note object`)
    return Promise.resolve({ ..._showNote })
  }
  
  async getShowNote(_id: number) {
    l.dim('\n  CLI mode: Database operations disabled - cannot retrieve show notes')
    console.log(`[NoOpDatabaseService] getShowNote called with ID: ${_id}`)
    console.log(`[NoOpDatabaseService] Returning null`)
    return Promise.resolve(null)
  }
  
  async getShowNotes() {
    l.dim('\n  CLI mode: Database operations disabled - cannot retrieve show notes')
    console.log(`[NoOpDatabaseService] getShowNotes called`)
    console.log(`[NoOpDatabaseService] Returning empty array`)
    return Promise.resolve([])
  }
}

export class AstroDbDatabaseService implements DatabaseService {
  private initialized = false
  
  constructor() {
    console.log('[AstroDbDatabaseService] Constructor called')
  }
  
  async init() {
    if (this.initialized) {
      console.log('[AstroDbDatabaseService] Already initialized')
      return this
    }
    
    try {
      console.log('[AstroDbDatabaseService] Initializing...')
      this.initialized = true
      console.log('[AstroDbDatabaseService] Initialized successfully')
    } catch (error) {
      console.error('[AstroDbDatabaseService] Failed to initialize:', error)
      throw error
    }
    
    return this
  }
  
  async insertShowNote(showNote: ShowNoteType) {
    if (!this.initialized) {
      console.log('[AstroDbDatabaseService] Initializing before insert')
      await this.init()
    }
    
    l.dim('\n  Inserting show note into the database...')
    console.log(`[AstroDbDatabaseService] insertShowNote called with:`)
    console.log(`  * id: ${showNote.id}`)
    console.log(`  * title: ${showNote.title}`)
    console.log(`  * walletAddress: ${showNote.walletAddress}`)
    console.log(`  * mnemonic: ${showNote.mnemonic}`)
    
    const {
      showLink, channel, channelURL, title, description, publishDate, coverImage,
      frontmatter, prompt, transcript, llmOutput, walletAddress, mnemonic,
      llmService, llmModel, llmCost, transcriptionService, transcriptionModel,
      transcriptionCost, finalCost
    } = showNote
    
    try {
      console.log('[AstroDbDatabaseService] Attempting to insert into ShowNotes table')
      
      const insertData = {
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
        llmService: llmService ?? null,
        llmModel: llmModel ?? null,
        llmCost: llmCost ?? null,
        transcriptionService: transcriptionService ?? null,
        transcriptionModel: transcriptionModel ?? null,
        transcriptionCost: transcriptionCost ?? null,
        finalCost: finalCost ?? null
      }
      
      console.log('[AstroDbDatabaseService] Insert data prepared:', Object.keys(insertData))
      
      const newRecord = await db.insert(ShowNotes).values(insertData).returning()
      
      console.log('[AstroDbDatabaseService] Record inserted successfully:', newRecord)
      l.dim('    - Show note inserted successfully.\n')
      
      return newRecord[0]
    } catch (error) {
      console.error('[AstroDbDatabaseService] Insert failed:', error)
      
      if (error instanceof Error) {
        console.error('[AstroDbDatabaseService] Database error details:', error.message)
      }
      
      l.dim(`    - Failed to insert show note: ${error instanceof Error ? error.message : String(error)}\n`)
      return { ...showNote }
    }
  }
  
  async getShowNote(id: number) {
    if (!this.initialized) {
      console.log('[AstroDbDatabaseService] Initializing before get')
      await this.init()
    }
    
    console.log(`[AstroDbDatabaseService] getShowNote called with ID: ${id}`)
    
    try {
      console.log('[AstroDbDatabaseService] Querying ShowNotes table')
      
      const records = await db
        .select()
        .from(ShowNotes)
        .where(eq(ShowNotes.id, id))
        .limit(1)
      
      console.log(`[AstroDbDatabaseService] Query returned ${records.length} records`)
      
      if (records.length === 0) {
        console.log(`[AstroDbDatabaseService] No record found for ID: ${id}`)
        return null
      }
      
      console.log(`[AstroDbDatabaseService] Found record: ${records[0].title}`)
      return records[0]
    } catch (error) {
      console.error('[AstroDbDatabaseService] Get failed:', error)
      
      if (error instanceof Error) {
        console.error('[AstroDbDatabaseService] Database error details:', error.message)
      }
      
      l.dim(`    - Failed to get show note: ${error instanceof Error ? error.message : String(error)}\n`)
      return null
    }
  }
  
  async getShowNotes() {
    if (!this.initialized) {
      console.log('[AstroDbDatabaseService] Initializing before getAll')
      await this.init()
    }
    
    console.log('[AstroDbDatabaseService] getShowNotes called')
    
    try {
      console.log('[AstroDbDatabaseService] Querying all ShowNotes')
      
      const records = await db
        .select()
        .from(ShowNotes)
        .orderBy(ShowNotes.publishDate)
      
      console.log(`[AstroDbDatabaseService] Found ${records.length} records`)
      
      return records
    } catch (error) {
      console.error('[AstroDbDatabaseService] GetAll failed:', error)
      
      if (error instanceof Error) {
        console.error('[AstroDbDatabaseService] Database error details:', error.message)
      }
      
      l.dim(`    - Failed to get show notes: ${error instanceof Error ? error.message : String(error)}\n`)
      return []
    }
  }
}

function isServerMode() {
  console.log('[dbService] Checking server mode...')
  console.log('[dbService] DATABASE_URL:', env['DATABASE_URL'] ? 'set' : 'not set')
  console.log('[dbService] PGHOST:', env['PGHOST'] ? 'set' : 'not set')
  console.log('[dbService] SERVER_MODE:', env['SERVER_MODE'])
  
  const isServer = env['DATABASE_URL'] !== undefined ||
         env['PGHOST'] !== undefined ||
         env['SERVER_MODE'] === 'true'
  
  console.log('[dbService] Server mode result:', isServer)
  return isServer
}

let dbServiceInstance: DatabaseService | null = null

if (isServerMode()) {
  console.log('[dbService] Server mode detected - initializing AstroDbDatabaseService')
  l.dim('  Server mode detected - initializing database service')
  dbServiceInstance = new AstroDbDatabaseService()
} else {
  console.log('[dbService] CLI mode detected - using NoOpDatabaseService')
  l.dim('  CLI mode detected - using no-op database service')
  dbServiceInstance = new NoOpDatabaseService()
}

export const dbService = dbServiceInstance