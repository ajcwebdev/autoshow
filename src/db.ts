// src/db.ts

import { l, err } from './utils'
import { db, ShowNotes, eq } from 'astro:db'
import type { ShowNoteType } from './types'

export interface DatabaseService {
  insertShowNote: (showNote: ShowNoteType) => Promise<any>
  getShowNote: (id: number) => Promise<any>
  getShowNotes: () => Promise<any[]>
}

export class AstroDbDatabaseService implements DatabaseService {
  private initialized = false
  private readonly logPrefix = '[AstroDbDatabaseService]'
  
  constructor() {
    l(`${this.logPrefix} Constructor called`)
    l(`${this.logPrefix} Database service created`)
  }
  
  async init() {
    l(`${this.logPrefix} init() called, initialized=${this.initialized}`)
    
    if (this.initialized) {
      l(`${this.logPrefix} Already initialized, returning early`)
      return this
    }
    
    try {
      l(`${this.logPrefix} Initializing database service...`)
      this.initialized = true
      l(`${this.logPrefix} Set initialized flag to true`)
      l(`${this.logPrefix} Initialized successfully`)
    } catch (error) {
      err(`${this.logPrefix} Failed to initialize:`, error)
      err(`${this.logPrefix} Error details:`, error instanceof Error ? error.message : String(error))
      err(`${this.logPrefix} Error stack:`, error instanceof Error ? error.stack : 'No stack trace')
      throw error
    }
    
    return this
  }
  
  async insertShowNote(showNote: ShowNoteType) {
    l(`${this.logPrefix} insertShowNote() called`)
    
    if (!this.initialized) {
      l(`${this.logPrefix} Database not initialized, calling init() before insert`)
      await this.init()
      l(`${this.logPrefix} Database initialization complete`)
    }
    
    l.dim('\n  Inserting show note into the database...')
    l(`${this.logPrefix} insertShowNote called with:`)
    l(`${this.logPrefix} * id: ${showNote.id}`)
    l(`${this.logPrefix} * title: ${showNote.title}`)
    l(`${this.logPrefix} * walletAddress: ${showNote.walletAddress}`)
    l(`${this.logPrefix} * mnemonic: ${showNote.mnemonic ? '[REDACTED]' : 'null'}`)
    
    const {
      showLink, channel, channelURL, title, description, publishDate, coverImage,
      frontmatter, prompt, transcript, llmOutput, walletAddress, mnemonic,
      llmService, llmModel, llmCost, transcriptionService, transcriptionModel,
      transcriptionCost, finalCost
    } = showNote
    
    l(`${this.logPrefix} Destructured show note properties`)
    
    try {
      l(`${this.logPrefix} Preparing insert data object`)
      
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
      
      l(`${this.logPrefix} Insert data prepared with these fields:`, Object.keys(insertData))
      l(`${this.logPrefix} Calling db.insert() with ShowNotes table`)
      
      const newRecord = await db.insert(ShowNotes).values(insertData).returning()
      
      l(`${this.logPrefix} db.insert() completed successfully`)
      l(`${this.logPrefix} Record inserted with ID:`, newRecord[0]?.id)
      l(`${this.logPrefix} Full record:`, newRecord[0])
      l.dim('    - Show note inserted successfully.\n')
      
      return newRecord[0]
    } catch (error) {
      err(`${this.logPrefix} Insert operation failed:`, error)
      
      if (error instanceof Error) {
        err(`${this.logPrefix} Database error details:`, error.message)
        err(`${this.logPrefix} Error stack:`, error.stack)
      }
      
      l.dim(`    - Failed to insert show note: ${error instanceof Error ? error.message : String(error)}\n`)
      l(`${this.logPrefix} Returning fallback object with original show note data`)
      return { ...showNote }
    }
  }
  
  async getShowNote(id: number) {
    l(`${this.logPrefix} getShowNote() called with ID: ${id}`)
    
    if (!this.initialized) {
      l(`${this.logPrefix} Database not initialized, calling init() before query`)
      await this.init()
      l(`${this.logPrefix} Database initialization complete`)
    }
    
    try {
      l(`${this.logPrefix} Building query to fetch show note with ID ${id}`)
      l(`${this.logPrefix} Executing db.select() with where clause for ID ${id}`)
      
      const records = await db
        .select()
        .from(ShowNotes)
        .where(eq(ShowNotes.id, id))
        .limit(1)
      
      l(`${this.logPrefix} Query execution complete`)
      l(`${this.logPrefix} Query returned ${records.length} records`)
      
      if (records.length === 0) {
        l(`${this.logPrefix} No record found for ID: ${id}`)
        l(`${this.logPrefix} Returning null as result`)
        return null
      }
      
      l(`${this.logPrefix} Found record with title: ${records[0].title}`)
      l(`${this.logPrefix} Returning found record`)
      return records[0]
    } catch (error) {
      err(`${this.logPrefix} Get operation failed:`, error)
      
      if (error instanceof Error) {
        err(`${this.logPrefix} Database error details:`, error.message)
        err(`${this.logPrefix} Error stack:`, error.stack)
      }
      
      l.dim(`    - Failed to get show note: ${error instanceof Error ? error.message : String(error)}\n`)
      l(`${this.logPrefix} Returning null due to error`)
      return null
    }
  }
  
  async getShowNotes() {
    l(`${this.logPrefix} getShowNotes() called to fetch all show notes`)
    
    if (!this.initialized) {
      l(`${this.logPrefix} Database not initialized, calling init() before query`)
      await this.init()
      l(`${this.logPrefix} Database initialization complete`)
    }
    
    try {
      l(`${this.logPrefix} Building query to fetch all show notes`)
      l(`${this.logPrefix} Executing db.select() with orderBy on publishDate`)
      
      const records = await db
        .select()
        .from(ShowNotes)
        .orderBy(ShowNotes.publishDate)
      
      l(`${this.logPrefix} Query execution complete`)
      l(`${this.logPrefix} Found ${records.length} records in total`)
      
      if (records.length > 0) {
        l(`${this.logPrefix} First record title: ${records[0].title}`)
        l(`${this.logPrefix} Last record title: ${records[records.length - 1].title}`)
      }
      
      l(`${this.logPrefix} Returning ${records.length} records`)
      return records
    } catch (error) {
      err(`${this.logPrefix} GetAll operation failed:`, error)
      
      if (error instanceof Error) {
        err(`${this.logPrefix} Database error details:`, error.message)
        err(`${this.logPrefix} Error stack:`, error.stack)
      }
      
      l.dim(`    - Failed to get show notes: ${error instanceof Error ? error.message : String(error)}\n`)
      l(`${this.logPrefix} Returning empty array due to error`)
      return []
    }
  }
}

l('[db.ts] Creating new AstroDbDatabaseService instance')
const dbServiceInstance = new AstroDbDatabaseService()
l('[db.ts] AstroDbDatabaseService instance created successfully')

export const dbService = dbServiceInstance
l('[db.ts] Exported dbService instance')