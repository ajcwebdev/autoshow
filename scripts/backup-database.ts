// scripts/backup-database.ts

import { execPromise, env, join, writeFileSync } from '../src/utils'

const createDatabaseBackup = async (): Promise<void> => {
  console.log('[backup-database] Starting database backup process...')
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFileName = `backup-${timestamp}.sql`
    const backupPath = join(process.cwd(), 'backups', backupFileName)
    
    console.log(`[backup-database] Creating backup at: ${backupPath}`)
    
    if (!env.DATABASE_URL) {
      console.error('[backup-database] DATABASE_URL not found in environment')
      throw new Error('DATABASE_URL not found')
    }
    
    console.log('[backup-database] Executing pg_dump command...')
    const pgDumpCommand = `pg_dump ${env.DATABASE_URL} > ${backupPath}`
    const { stderr } = await execPromise(pgDumpCommand)
    
    if (stderr) {
      console.error(`[backup-database] pg_dump errors: ${stderr}`)
    }
    
    console.log('[backup-database] Database backup completed successfully')
    console.log(`[backup-database] Backup saved to: ${backupPath}`)
    
    await createMetadata(backupPath, timestamp)
    
  } catch (error) {
    console.error('[backup-database] Failed to create backup:', error)
    throw error
  }
}

const createMetadata = async (backupPath: string, timestamp: string): Promise<void> => {
  console.log('[backup-database] Creating backup metadata...')
  
  const metadata = {
    timestamp,
    path: backupPath,
    databaseUrl: env.DATABASE_URL?.replace(/\/\/(.+?)@/g, '//*****@'),
    createdAt: new Date().toISOString()
  }
  
  const metadataPath = backupPath.replace('.sql', '.json')
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
  console.log(`[backup-database] Metadata saved to: ${metadataPath}`)
}

export default createDatabaseBackup