// src/utils/embeddings/create-embed.ts

import { PrismaClient } from '@prisma/client'
import {
  env, fileURLToPath, readdir, readFile, join, dirname, isAbsolute, resolve, relative, writeFileSync
} from '../node-utils.ts'

/**
 * Recursively finds all .md files in the specified directory and any nested subdirectories.
 *
 * @async
 * @function getAllMarkdownFiles
 * @param {string} dir - The directory path in which to search for markdown files
 * @returns {Promise<string[]>} - A Promise that resolves to an array of absolute paths to .md files
 * @throws {Error} If reading a directory entry fails
 */
async function getAllMarkdownFiles(dir: string): Promise<string[]> {
  const dirEntries = await readdir(dir, { withFileTypes: true })
  const mdFiles: string[] = []

  for (const entry of dirEntries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      const nestedFiles = await getAllMarkdownFiles(fullPath)
      mdFiles.push(...nestedFiles)
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      mdFiles.push(fullPath)
    }
  }

  return mdFiles
}

/**
 * Creates embeddings for all .md files found in the specified directory (recursively),
 * or defaults to the "../content" directory if none is given. The embeddings are stored
 * in both a JSON file and in the Postgres table using pgvector.
 *
 * @async
 * @function createEmbeds
 * @param {string} [customDir] - An optional directory path to recursively scan for .md files
 * @returns {Promise<void>} Promise that resolves when embeddings are created and stored
 * @throws {Error} If the OPENAI_API_KEY is missing or an error occurs in file reading/writing
 */
export async function createEmbeds(customDir?: string): Promise<void> {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)

  // Determine the directory to scan
  let baseDir: string
  if (customDir) {
    // If customDir is absolute, use it directly; otherwise resolve from current working directory
    baseDir = isAbsolute(customDir)
      ? customDir
      : resolve(process.cwd(), customDir)
  } else {
    // Default to the "content" directory if no custom path is provided
    baseDir = resolve(__dirname, '..', '..', '..', 'content')
  }

  const openaiApiKey = env['OPENAI_API_KEY']
  if (!openaiApiKey) {
    throw new Error('Please set the OPENAI_API_KEY environment variable.')
  }

  let mdFiles: string[] = []
  try {
    mdFiles = await getAllMarkdownFiles(baseDir)
    if (!mdFiles.length) {
      console.log(`No .md files found in ${baseDir}`)
      return
    }
  } catch (err) {
    throw new Error(`Error reading directory: ${baseDir} - ${err}`)
  }

  const embeddings: Record<string, number[]> = {}
  for (const filePath of mdFiles) {
    const content = await readFile(filePath, 'utf8')
    const fileNameForLog = relative(process.cwd(), filePath)
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
      embeddings[filePath] = json.data?.[0]?.embedding ?? []
      console.log(`Created embedding for: ${fileNameForLog}`)
    } catch (err) {
      console.error(`Error creating embedding for ${filePath}:`, err)
    }
  }

  writeFileSync('embeddings.json', JSON.stringify(embeddings, null, 2), 'utf8')
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
    `, filename, vectorString)
    count++
  }
  console.log(`Inserted ${count} embeddings into Postgres 'embeddings' table.`)

  await db.$disconnect()
}