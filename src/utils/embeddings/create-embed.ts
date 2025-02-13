// src/utils/embeddings.ts

import path from 'path'
import { fileURLToPath } from 'url'
import { readdir, readFile } from 'fs/promises'
import fs from 'fs'
import { env } from 'node:process'
import Database from 'better-sqlite3'
import * as sqliteVec from 'sqlite-vec'

/**
 * Creates embeddings for all .md files found in the ../content directory
 * and stores them in both a JSON file and an SQLite database. This function
 * replicates the logic of the original create-embeddings-and-sqlite.js script.
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

  const db = new Database('embeddings.db')
  sqliteVec.load(db)
  db.exec(`
    CREATE TABLE IF NOT EXISTS embeddings (
      filename TEXT PRIMARY KEY,
      vector BLOB
    ) STRICT
  `)

  const insert = db.prepare('INSERT OR REPLACE INTO embeddings (filename, vector) VALUES (?, ?)')
  let count = 0
  for (const [filename, floatArray] of Object.entries(embeddings)) {
    const float32 = new Float32Array(floatArray)
    const blob = new Uint8Array(float32.buffer)
    insert.run(filename, blob)
    count++
  }
  console.log(`Inserted ${count} embeddings into 'embeddings.db'.`)
  db.close()
}