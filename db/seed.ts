// db/seed.ts

import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import { join } from 'path'
import { l, err } from '../src/utils'

const execAsync = promisify(exec)
const logPrefix = '[db/seed]'

async function seed(): Promise<void> {
  l(`${logPrefix} Starting database seed process`)
  l(`${logPrefix} Current environment variables:`)
  l(`${logPrefix} - NODE_ENV: ${process.env.NODE_ENV || 'not set'}`)
  l(`${logPrefix} - Has DATABASE_URL: ${Boolean(process.env.DATABASE_URL)}`)
  l(`${logPrefix} - Has ASTRO_DB_REMOTE_URL: ${Boolean(process.env.ASTRO_DB_REMOTE_URL)}`)
  l(`${logPrefix} - Has ASTRO_DB_APP_TOKEN: ${Boolean(process.env.ASTRO_DB_APP_TOKEN)}`)
  
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
    l(`${logPrefix} DATABASE_URL is invalid or points to a local file: ${process.env.DATABASE_URL?.substring(0, 10)}...`)
    l(`${logPrefix} Getting Supabase connection from other environment variables`)
    
    try {
      const { stdout } = await execAsync('npx supabase status')
      l(`${logPrefix} Supabase status output: ${stdout}`)
      
      const match = stdout.match(/DB URL: (postgresql:\/\/postgres:postgres@[^/]+\/postgres)/)
      if (match && match[1]) {
        l(`${logPrefix} Extracted DB URL from Supabase status: ${match[1].substring(0, 20)}...`)
        process.env.DATABASE_URL = match[1]
      } else {
        err(`${logPrefix} Could not extract DB URL from Supabase status`)
      }
    } catch (error) {
      err(`${logPrefix} Error running Supabase status:`, error)
    }
  }
  
  l(`${logPrefix} Using DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 20)}...`)
  
  l(`${logPrefix} Reading migration SQL file`)
  try {
    const migrationPath = join(process.cwd(), 'db', 'migration-supabase.sql')
    l(`${logPrefix} Migration file path: ${migrationPath}`)
    
    const sql = await fs.readFile(migrationPath, 'utf8')
    l(`${logPrefix} Successfully read migration file: ${sql.length} bytes`)
    l(`${logPrefix} SQL preview: ${sql.substring(0, 100)}...`)
    
    l(`${logPrefix} Creating temporary SQL file with test record insertion`)
    const seedSQL = `
      ${sql}
      
      -- Insert test record
      INSERT INTO show_notes (
        id, title, publish_date, transcript, show_link, 
        channel, wallet_address, llm_output, frontmatter
      ) VALUES (
        1, 'Test Show Note', '2024-01-01', 'Test transcript', 'https://example.com',
        'Test Channel', 'test-wallet', 'Test output', '---\ntitle: Test\n---'
      ) ON CONFLICT (id) DO NOTHING;
    `
    
    const tmpFilePath = join(process.cwd(), 'db', 'temp-migration.sql')
    await fs.writeFile(tmpFilePath, seedSQL, 'utf8')
    l(`${logPrefix} Wrote temporary SQL file to: ${tmpFilePath}`)
    
    l(`${logPrefix} Attempting to use supabase CLI migration push`)
    try {
      const { stdout: pushOut, stderr: pushErr } = await execAsync('npx supabase migration up')
      l(`${logPrefix} Migration up stdout: ${pushOut}`)
      if (pushErr) err(`${logPrefix} Migration up stderr: ${pushErr}`)
      
      const { stdout: pushDbOut, stderr: pushDbErr } = await execAsync('npx supabase db push')
      l(`${logPrefix} DB push stdout: ${pushDbOut}`)
      if (pushDbErr) err(`${logPrefix} DB push stderr: ${pushDbErr}`)
      
      l(`${logPrefix} Migration successfully applied via Supabase CLI`)
    } catch (migrationError) {
      err(`${logPrefix} Error applying migrations via Supabase CLI:`, migrationError)
      
      if (process.env.DATABASE_URL?.startsWith('postgresql://')) {
        l(`${logPrefix} Falling back to direct psql execution with PostgreSQL URL`)
        
        try {
          const psqlCommand = `PGPASSWORD=${process.env.PGPASSWORD || 'postgres'} psql "${process.env.DATABASE_URL}" -f ${tmpFilePath}`
          const sanitizedCommand = psqlCommand.replace(/PGPASSWORD=\S+/, 'PGPASSWORD=*****').replace(process.env.DATABASE_URL, '[REDACTED]')
          l(`${logPrefix} Running psql command: ${sanitizedCommand}`)
          
          const { stdout, stderr } = await execAsync(psqlCommand)
          l(`${logPrefix} psql command stdout: ${stdout}`)
          if (stderr) l(`${logPrefix} psql command stderr: ${stderr}`)
          
          l(`${logPrefix} SQL executed successfully via psql`)
        } catch (psqlError) {
          err(`${logPrefix} Error running psql command:`, psqlError)
          
          l(`${logPrefix} Falling back to npx prisma db push`)
          try {
            const prismaPushCommand = 'npx prisma db push'
            l(`${logPrefix} Running prisma command: ${prismaPushCommand}`)
            
            const { stdout, stderr } = await execAsync(prismaPushCommand)
            l(`${logPrefix} Prisma command stdout: ${stdout}`)
            if (stderr) l(`${logPrefix} Prisma command stderr: ${stderr}`)
            
            l(`${logPrefix} DB schema applied successfully via Prisma`)
            
            const insertCommand = `npx prisma db execute --file ${tmpFilePath}`
            l(`${logPrefix} Running prisma execute command: ${insertCommand}`)
            
            const { stdout: execStdout, stderr: execStderr } = await execAsync(insertCommand)
            l(`${logPrefix} Prisma execute stdout: ${execStdout}`)
            if (execStderr) l(`${logPrefix} Prisma execute stderr: ${execStderr}`)
            
            l(`${logPrefix} Test record inserted successfully via Prisma`)
          } catch (prismaError) {
            err(`${logPrefix} Error running Prisma commands:`, prismaError)
            throw new Error(`All database migration methods failed. Last error: ${prismaError instanceof Error ? prismaError.message : String(prismaError)}`)
          }
        }
      } else {
        err(`${logPrefix} No valid PostgreSQL connection string available`)
        throw new Error('No valid database connection available')
      }
    }
    
    l(`${logPrefix} Cleaning up temporary file`)
    await fs.unlink(tmpFilePath).catch(e => err(`${logPrefix} Error removing temp file:`, e))
    l(`${logPrefix} Temporary file removed`)
    
    l(`${logPrefix} Database seed completed successfully`)
  } catch (error) {
    err(`${logPrefix} Unexpected error during seeding:`, error)
    if (error instanceof Error) {
      err(`${logPrefix} Error stack:`, error.stack)
    }
    throw error
  }
  
  return
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => {
      l(`${logPrefix} Seed completed successfully`)
      process.exit(0)
    })
    .catch((error) => {
      err(`${logPrefix} Seed failed:`, error)
      if (error instanceof Error) {
        err(`${logPrefix} Error name:`, error.name)
        err(`${logPrefix} Error message:`, error.message)
        err(`${logPrefix} Error stack:`, error.stack)
      } else {
        err(`${logPrefix} Non-Error object thrown:`, JSON.stringify(error, null, 2))
      }
      process.exit(1)
    })
}

export default seed