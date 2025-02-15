// src/utils/embeddings/create-embed.ts

import path from 'path'
import { fileURLToPath } from 'url'
import { readdir, readFile } from 'fs/promises'
import fs from 'fs'
import { env } from 'node:process'
import { PrismaClient } from '@prisma/client'

/**
 * Creates embeddings for all .md files found in the ../content directory
 * and stores them in both a JSON file and a Postgres table using pgvector.
 * This function replicates the logic of the original create-embeddings-and-sqlite.js script.
 *
 * @async
 * @function createEmbeddingsAndSQLite
 * @returns {Promise<void>} Promise that resolves when embeddings are created and stored
 * @throws {Error} If the OPENAI_API_KEY is missing or an error occurs in file reading/writing
 */
export async function createEmbeddingsAndSQLite(): Promise<void> {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const contentDir = path.resolve(__dirname, '..', '..', '..', 'content')

  const openaiApiKey = env['OPENAI_API_KEY']
  if (!openaiApiKey) {
    throw new Error('Please set the OPENAI_API_KEY environment variable.')
  }

  let mdFiles = []
  try {
    const files = await readdir(contentDir)
    mdFiles = files.filter(file => file.toLowerCase().endsWith('.md'))
    if (!mdFiles.length) {
      console.log('No .md files found in the content directory.')
      return
    }
  } catch (err) {
    throw new Error(`Error reading directory: ${contentDir} - ${err}`)
  }

  const embeddings: Record<string, number[]> = {}
  for (const file of mdFiles) {
    const filePath = path.join(contentDir, file)
    const content = await readFile(filePath, 'utf8')
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          input: content,
          model: 'text-embedding-3-large',
          encoding_format: 'float'
        })
      })
      const json = await response.json()
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${JSON.stringify(json)}`)
      }
      embeddings[file] = json.data?.[0]?.embedding ?? []
      console.log(`Created embedding for: ${file}`)
    } catch (err) {
      console.error(`Error creating embedding for ${file}:`, err)
    }
  }

  fs.writeFileSync('embeddings.json', JSON.stringify(embeddings, null, 2), 'utf8')
  console.log(`Saved embeddings to "embeddings.json"`)

  const db = new PrismaClient()

  // Create the vector extension and table if they don't already exist
  await db.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`)
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS embeddings (
      filename TEXT PRIMARY KEY,
      vector vector(3072) NOT NULL
    )
  `)

  let count = 0
  for (const [filename, floatArray] of Object.entries(embeddings)) {
    // Convert embedding array to the pgvector format: [0.123,0.456,...]
    const vectorString = `[${floatArray.join(',')}]`
    await db.$executeRawUnsafe(`
      INSERT INTO embeddings (filename, vector)
      VALUES ($1, $2::vector(3072))
      ON CONFLICT (filename)
      DO UPDATE SET vector = EXCLUDED.vector
    `, [filename, vectorString])
    count++
  }
  console.log(`Inserted ${count} embeddings into Postgres 'embeddings' table.`)

  await db.$disconnect()
}