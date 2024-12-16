#!/usr/bin/env node

// scripts/read-and-query-embeddings.js

import fs from 'fs'
import Database from 'better-sqlite3'
import * as sqliteVec from 'sqlite-vec'
import { env } from 'node:process'
import path from 'path'
import { fileURLToPath } from 'url'

// Extract the user's question from CLI arguments
const question = process.argv.slice(2).join(' ')
if (!question) {
  console.error('Usage: node read-and-query-embeddings.js "<question>"')
  process.exit(1)
}

// Check for OPENAI_API_KEY
const OPENAI_API_KEY = env['OPENAI_API_KEY']
if (!OPENAI_API_KEY) {
  console.error('Please set the OPENAI_API_KEY environment variable.')
  process.exit(1)
}

// Hard-coded location for top-level content and DB file
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const contentDir = path.resolve(__dirname, '..', 'content')
const dbFile = 'embeddings.db'

// Open the SQLite database
const db = new Database(dbFile)
// Load sqlite-vec extension
sqliteVec.load(db)

// Main async function
async function main() {
  try {
    // Embed the user's question with OpenAI
    const queryEmbedding = new Float32Array(await embedText(question))
    // Convert the float32 array to a BLOB
    const queryBlob = new Uint8Array(queryEmbedding.buffer)
    // SQL to get the top 3 similar files by cosine distance
    const sql = `
      SELECT
        filename,
        vec_distance_cosine(vector, :query) AS distance
      FROM embeddings
      ORDER BY distance
      LIMIT 3
    `
    // Execute the query
    const rows = db.prepare(sql).all({ query: queryBlob })
    console.log(`Top matches for: "${question}"`)
    console.table(rows)
    if (rows.length === 0) {
      console.log('No matches found in the database.')
      return
    }
    // Pick the top match
    const topDoc = rows[0]
    const topFilename = topDoc.filename
    const contentPath = path.join(contentDir, topFilename)
    let fileContent = ''
    // Read the top .md file
    try {
      fileContent = fs.readFileSync(contentPath, 'utf8')
    } catch (err) {
      console.error(`Error reading file for context: ${contentPath}`, err)
    }
    // Call ChatCompletion with the file's text
    const answer = await callChatCompletion(question, fileContent)
    console.log('Answer:\n', answer)
  } finally {
    db.close()
  }
}

// Embed text with OpenAI
async function embedText(text) {
  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small',
      encoding_format: 'float'
    })
  })
  if (!resp.ok) {
    throw new Error(`OpenAI error: ${await resp.text()}`)
  }
  const json = await resp.json()
  return json.data[0].embedding
}

// Call the ChatCompletion API to get an answer
async function callChatCompletion(userQuestion, fileContent) {
  const chatBody = {
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that answers questions based on the provided text.'
      },
      {
        role: 'user',
        content: `Context:\n${fileContent}\n\nQuestion: ${userQuestion}`
      }
    ]
  }
  const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(chatBody)
  })
  const chatJson = await chatRes.json()
  if (!chatRes.ok) {
    throw new Error(`OpenAI Chat API error: ${JSON.stringify(chatJson)}`)
  }
  return chatJson.choices[0].message.content
}

// Run main function
main().catch(err => {
  console.error(err)
  process.exit(1)
})