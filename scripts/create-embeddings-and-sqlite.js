#!/usr/bin/env node

// scripts/create-embeddings-and-sqlite.js

import path from 'path'
import { fileURLToPath } from 'url'
import { readdir, readFile } from 'fs/promises'
import fs from 'fs'
import { env } from 'node:process'
import Database from 'better-sqlite3'
import * as sqliteVec from 'sqlite-vec'

// Hard-coded filenames for the JSON output and database file
const outputJSON = 'embeddings.json'  // where we'll save all embeddings
const dbFile = 'embeddings.db'  // where we'll store embeddings in SQLite

async function main() {
  // Derive the current script directory
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  // Always assume ../content is top-level next to scripts
  const contentDir = path.resolve(__dirname, '..', 'content')

  // Check for an OpenAI API key
  const openaiApiKey = env['OPENAI_API_KEY']
  if (!openaiApiKey) {
    console.error('Please set the OPENAI_API_KEY environment variable.')
    process.exit(1)
  }

  // Read the top-level content directory and filter .md files
  let mdFiles = []
  try {
    const files = await readdir(contentDir)
    mdFiles = files.filter(file => file.toLowerCase().endsWith('.md'))
    if (!mdFiles.length) {
      console.log('No .md files found in the content directory.')
      process.exit(0)
    }
  } catch (err) {
    console.error(`Error reading directory: ${contentDir}`, err)
    process.exit(1)
  }

  // Create an object to hold filename -> embedding
  const embeddings = {}
  // Loop over .md files, call OpenAI for each
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
          model: 'text-embedding-3-small',
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

  // Write the embeddings to a JSON file
  fs.writeFileSync(outputJSON, JSON.stringify(embeddings, null, 2), 'utf8')
  console.log(`Saved embeddings to "${outputJSON}"`)

  // Create or open the SQLite database
  const db = new Database(dbFile)
  // Load the sqlite-vec extension
  sqliteVec.load(db)
  // Ensure embeddings table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS embeddings (
      filename TEXT PRIMARY KEY,
      vector BLOB
    ) STRICT
  `)
  // Prepare insert statement
  const insert = db.prepare('INSERT OR REPLACE INTO embeddings (filename, vector) VALUES (?, ?)')
  let count = 0
  // Insert embeddings into the table
  for (const [filename, floatArray] of Object.entries(embeddings)) {
    const float32 = new Float32Array(floatArray)
    const blob = new Uint8Array(float32.buffer)
    insert.run(filename, blob)
    count++
  }
  console.log(`Inserted ${count} embeddings into "${dbFile}".`)
  db.close()
}

main()