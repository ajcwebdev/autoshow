// src/db.ts

import { l } from './utils'
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
    console.log(`${this.logPrefix} Constructor called`)
    console.log(`${this.logPrefix} Database service created`)
  }
  
  async init() {
    console.log(`${this.logPrefix} init() called, initialized=${this.initialized}`)
    
    if (this.initialized) {
      console.log(`${this.logPrefix} Already initialized, returning early`)
      return this
    }
    
    try {
      console.log(`${this.logPrefix} Initializing database service...`)
      this.initialized = true
      console.log(`${this.logPrefix} Set initialized flag to true`)
      console.log(`${this.logPrefix} Initialized successfully`)
    } catch (error) {
      console.error(`${this.logPrefix} Failed to initialize:`, error)
      console.error(`${this.logPrefix} Error details:`, error instanceof Error ? error.message : String(error))
      console.error(`${this.logPrefix} Error stack:`, error instanceof Error ? error.stack : 'No stack trace')
      throw error
    }
    
    return this
  }
  
  async insertShowNote(showNote: ShowNoteType) {
    console.log(`${this.logPrefix} insertShowNote() called`)
    
    if (!this.initialized) {
      console.log(`${this.logPrefix} Database not initialized, calling init() before insert`)
      await this.init()
      console.log(`${this.logPrefix} Database initialization complete`)
    }
    
    l.dim('\n  Inserting show note into the database...')
    console.log(`${this.logPrefix} insertShowNote called with:`)
    console.log(`${this.logPrefix} * id: ${showNote.id}`)
    console.log(`${this.logPrefix} * title: ${showNote.title}`)
    console.log(`${this.logPrefix} * walletAddress: ${showNote.walletAddress}`)
    console.log(`${this.logPrefix} * mnemonic: ${showNote.mnemonic ? '[REDACTED]' : 'null'}`)
    
    const {
      showLink, channel, channelURL, title, description, publishDate, coverImage,
      frontmatter, prompt, transcript, llmOutput, walletAddress, mnemonic,
      llmService, llmModel, llmCost, transcriptionService, transcriptionModel,
      transcriptionCost, finalCost
    } = showNote
    
    console.log(`${this.logPrefix} Destructured show note properties`)
    
    try {
      console.log(`${this.logPrefix} Preparing insert data object`)
      
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
      
      console.log(`${this.logPrefix} Insert data prepared with these fields:`, Object.keys(insertData))
      console.log(`${this.logPrefix} Calling db.insert() with ShowNotes table`)
      
      const newRecord = await db.insert(ShowNotes).values(insertData).returning()
      
      console.log(`${this.logPrefix} db.insert() completed successfully`)
      console.log(`${this.logPrefix} Record inserted with ID:`, newRecord[0]?.id)
      console.log(`${this.logPrefix} Full record:`, newRecord[0])
      l.dim('    - Show note inserted successfully.\n')
      
      return newRecord[0]
    } catch (error) {
      console.error(`${this.logPrefix} Insert operation failed:`, error)
      
      if (error instanceof Error) {
        console.error(`${this.logPrefix} Database error details:`, error.message)
        console.error(`${this.logPrefix} Error stack:`, error.stack)
      }
      
      l.dim(`    - Failed to insert show note: ${error instanceof Error ? error.message : String(error)}\n`)
      console.log(`${this.logPrefix} Returning fallback object with original show note data`)
      return { ...showNote }
    }
  }
  
  async getShowNote(id: number) {
    console.log(`${this.logPrefix} getShowNote() called with ID: ${id}`)
    
    if (!this.initialized) {
      console.log(`${this.logPrefix} Database not initialized, calling init() before query`)
      await this.init()
      console.log(`${this.logPrefix} Database initialization complete`)
    }
    
    try {
      console.log(`${this.logPrefix} Building query to fetch show note with ID ${id}`)
      console.log(`${this.logPrefix} Executing db.select() with where clause for ID ${id}`)
      
      const records = await db
        .select()
        .from(ShowNotes)
        .where(eq(ShowNotes.id, id))
        .limit(1)
      
      console.log(`${this.logPrefix} Query execution complete`)
      console.log(`${this.logPrefix} Query returned ${records.length} records`)
      
      if (records.length === 0) {
        console.log(`${this.logPrefix} No record found for ID: ${id}`)
        console.log(`${this.logPrefix} Returning null as result`)
        return null
      }
      
      console.log(`${this.logPrefix} Found record with title: ${records[0].title}`)
      console.log(`${this.logPrefix} Returning found record`)
      return records[0]
    } catch (error) {
      console.error(`${this.logPrefix} Get operation failed:`, error)
      
      if (error instanceof Error) {
        console.error(`${this.logPrefix} Database error details:`, error.message)
        console.error(`${this.logPrefix} Error stack:`, error.stack)
      }
      
      l.dim(`    - Failed to get show note: ${error instanceof Error ? error.message : String(error)}\n`)
      console.log(`${this.logPrefix} Returning null due to error`)
      return null
    }
  }
  
  async getShowNotes() {
    console.log(`${this.logPrefix} getShowNotes() called to fetch all show notes`)
    
    if (!this.initialized) {
      console.log(`${this.logPrefix} Database not initialized, calling init() before query`)
      await this.init()
      console.log(`${this.logPrefix} Database initialization complete`)
    }
    
    try {
      console.log(`${this.logPrefix} Building query to fetch all show notes`)
      console.log(`${this.logPrefix} Executing db.select() with orderBy on publishDate`)
      
      const records = await db
        .select()
        .from(ShowNotes)
        .orderBy(ShowNotes.publishDate)
      
      console.log(`${this.logPrefix} Query execution complete`)
      console.log(`${this.logPrefix} Found ${records.length} records in total`)
      
      if (records.length > 0) {
        console.log(`${this.logPrefix} First record title: ${records[0].title}`)
        console.log(`${this.logPrefix} Last record title: ${records[records.length - 1].title}`)
      }
      
      console.log(`${this.logPrefix} Returning ${records.length} records`)
      return records
    } catch (error) {
      console.error(`${this.logPrefix} GetAll operation failed:`, error)
      
      if (error instanceof Error) {
        console.error(`${this.logPrefix} Database error details:`, error.message)
        console.error(`${this.logPrefix} Error stack:`, error.stack)
      }
      
      l.dim(`    - Failed to get show notes: ${error instanceof Error ? error.message : String(error)}\n`)
      console.log(`${this.logPrefix} Returning empty array due to error`)
      return []
    }
  }
}

console.log('[db.ts] Creating new AstroDbDatabaseService instance')
const dbServiceInstance = new AstroDbDatabaseService()
console.log('[db.ts] AstroDbDatabaseService instance created successfully')

export const dbService = dbServiceInstance
console.log('[db.ts] Exported dbService instance')