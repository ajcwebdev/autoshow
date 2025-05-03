// db/seed.ts

import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import { join } from 'path'

const execAsync = promisify(exec)
const logPrefix = '[db/seed]'

async function seed(): Promise<void> {
  console.log(`${logPrefix} Starting database seed process`)
  console.log(`${logPrefix} Current environment variables:`)
  console.log(`${logPrefix} - NODE_ENV: ${process.env.NODE_ENV || 'not set'}`)
  console.log(`${logPrefix} - Has DATABASE_URL: ${Boolean(process.env.DATABASE_URL)}`)
  console.log(`${logPrefix} - Has ASTRO_DB_REMOTE_URL: ${Boolean(process.env.ASTRO_DB_REMOTE_URL)}`)
  console.log(`${logPrefix} - Has ASTRO_DB_APP_TOKEN: ${Boolean(process.env.ASTRO_DB_APP_TOKEN)}`)
  
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
    console.log(`${logPrefix} DATABASE_URL is invalid or points to a local file: ${process.env.DATABASE_URL?.substring(0, 10)}...`)
    console.log(`${logPrefix} Getting Supabase connection from other environment variables`)
    
    try {
      const { stdout, stderr } = await execAsync('npx supabase status')
      console.log(`${logPrefix} Supabase status output: ${stdout}`)
      
      const match = stdout.match(/DB URL: (postgresql:\/\/postgres:postgres@[^/]+\/postgres)/)
      if (match && match[1]) {
        console.log(`${logPrefix} Extracted DB URL from Supabase status: ${match[1].substring(0, 20)}...`)
        process.env.DATABASE_URL = match[1]
      } else {
        console.error(`${logPrefix} Could not extract DB URL from Supabase status`)
      }
    } catch (err) {
      console.error(`${logPrefix} Error running Supabase status:`, err)
    }
  }
  
  console.log(`${logPrefix} Using DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 20)}...`)
  
  console.log(`${logPrefix} Reading migration SQL file`)
  try {
    const migrationPath = join(process.cwd(), 'db', 'migration-supabase.sql')
    console.log(`${logPrefix} Migration file path: ${migrationPath}`)
    
    const sql = await fs.readFile(migrationPath, 'utf8')
    console.log(`${logPrefix} Successfully read migration file: ${sql.length} bytes`)
    console.log(`${logPrefix} SQL preview: ${sql.substring(0, 100)}...`)
    
    console.log(`${logPrefix} Creating temporary SQL file with test record insertion`)
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
    console.log(`${logPrefix} Wrote temporary SQL file to: ${tmpFilePath}`)
    
    console.log(`${logPrefix} Attempting to use supabase CLI migration push`)
    try {
      const { stdout: pushOut, stderr: pushErr } = await execAsync('npx supabase migration up')
      console.log(`${logPrefix} Migration up stdout: ${pushOut}`)
      if (pushErr) console.error(`${logPrefix} Migration up stderr: ${pushErr}`)
      
      const { stdout: pushDbOut, stderr: pushDbErr } = await execAsync('npx supabase db push')
      console.log(`${logPrefix} DB push stdout: ${pushDbOut}`)
      if (pushDbErr) console.error(`${logPrefix} DB push stderr: ${pushDbErr}`)
      
      console.log(`${logPrefix} Migration successfully applied via Supabase CLI`)
    } catch (migrationError) {
      console.error(`${logPrefix} Error applying migrations via Supabase CLI:`, migrationError)
      
      if (process.env.DATABASE_URL?.startsWith('postgresql://')) {
        console.log(`${logPrefix} Falling back to direct psql execution with PostgreSQL URL`)
        
        try {
          const psqlCommand = `PGPASSWORD=${process.env.PGPASSWORD || 'postgres'} psql "${process.env.DATABASE_URL}" -f ${tmpFilePath}`
          const sanitizedCommand = psqlCommand.replace(/PGPASSWORD=\S+/, 'PGPASSWORD=*****').replace(process.env.DATABASE_URL, '[REDACTED]')
          console.log(`${logPrefix} Running psql command: ${sanitizedCommand}`)
          
          const { stdout, stderr } = await execAsync(psqlCommand)
          console.log(`${logPrefix} psql command stdout: ${stdout}`)
          if (stderr) console.log(`${logPrefix} psql command stderr: ${stderr}`)
          
          console.log(`${logPrefix} SQL executed successfully via psql`)
        } catch (psqlError) {
          console.error(`${logPrefix} Error running psql command:`, psqlError)
          
          console.log(`${logPrefix} Falling back to npx prisma db push`)
          try {
            const prismaPushCommand = 'npx prisma db push'
            console.log(`${logPrefix} Running prisma command: ${prismaPushCommand}`)
            
            const { stdout, stderr } = await execAsync(prismaPushCommand)
            console.log(`${logPrefix} Prisma command stdout: ${stdout}`)
            if (stderr) console.log(`${logPrefix} Prisma command stderr: ${stderr}`)
            
            console.log(`${logPrefix} DB schema applied successfully via Prisma`)
            
            const insertCommand = `npx prisma db execute --file ${tmpFilePath}`
            console.log(`${logPrefix} Running prisma execute command: ${insertCommand}`)
            
            const { stdout: execStdout, stderr: execStderr } = await execAsync(insertCommand)
            console.log(`${logPrefix} Prisma execute stdout: ${execStdout}`)
            if (execStderr) console.log(`${logPrefix} Prisma execute stderr: ${execStderr}`)
            
            console.log(`${logPrefix} Test record inserted successfully via Prisma`)
          } catch (prismaError) {
            console.error(`${logPrefix} Error running Prisma commands:`, prismaError)
            throw new Error(`All database migration methods failed. Last error: ${prismaError instanceof Error ? prismaError.message : String(prismaError)}`)
          }
        }
      } else {
        console.error(`${logPrefix} No valid PostgreSQL connection string available`)
        throw new Error('No valid database connection available')
      }
    }
    
    console.log(`${logPrefix} Cleaning up temporary file`)
    await fs.unlink(tmpFilePath).catch(e => console.error(`${logPrefix} Error removing temp file:`, e))
    console.log(`${logPrefix} Temporary file removed`)
    
    console.log(`${logPrefix} Database seed completed successfully`)
  } catch (error) {
    console.error(`${logPrefix} Unexpected error during seeding:`, error)
    if (error instanceof Error) {
      console.error(`${logPrefix} Error stack:`, error.stack)
    }
    throw error
  }
  
  return
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => {
      console.log(`${logPrefix} Seed completed successfully`)
      process.exit(0)
    })
    .catch((error) => {
      console.error(`${logPrefix} Seed failed:`, error)
      if (error instanceof Error) {
        console.error(`${logPrefix} Error name:`, error.name)
        console.error(`${logPrefix} Error message:`, error.message)
        console.error(`${logPrefix} Error stack:`, error.stack)
      } else {
        console.error(`${logPrefix} Non-Error object thrown:`, JSON.stringify(error, null, 2))
      }
      process.exit(1)
    })
}

export default seed