// src/utils/embeddings/query-embed.ts

import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { env } from 'node:process'
import Database from 'better-sqlite3'
import * as sqliteVec from 'sqlite-vec'

/**
 * Queries the previously created embeddings database to find the top matches
 * for a given question. It also calls the ChatCompletion API to provide an
 * answer using the text content of the top matching file. This function
 * replicates the logic of the original read-and-query-embeddings.js script.
 *
 * @async
 * @function queryEmbeddings
 * @param {string} question - The user's question to embed and query
 * @returns {Promise<void>} Promise that resolves when the query is complete
 * @throws {Error} If the OPENAI_API_KEY is missing
 */
export async function queryEmbeddings(question: string): Promise<void> {
  if (!question) {
    throw new Error('No question provided.')
  }

  const OPENAI_API_KEY = env['OPENAI_API_KEY']
  if (!OPENAI_API_KEY) {
    throw new Error('Please set the OPENAI_API_KEY environment variable.')
  }

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const contentDir = path.resolve(__dirname, '..', '..', '..', 'content')

  const db = new Database('embeddings.db')
  sqliteVec.load(db)

  try {
    const queryEmbedding = new Float32Array(await embedText(question, OPENAI_API_KEY))
    const queryBlob = new Uint8Array(queryEmbedding.buffer)
    const sql = `
      SELECT
        filename,
        vec_distance_cosine(vector, :query) AS distance
      FROM embeddings
      ORDER BY distance
      LIMIT 5
    `
    const rows = db.prepare(sql).all({ query: queryBlob })
    console.log(`Top matches for: "${question}"`)
    console.table(rows)
    if (rows.length === 0) {
      console.log('No matches found in the database.')
      return
    }

    let combinedContent = ''
    for (const row of rows) {
      const filename = (row as { filename: string }).filename
      const contentPath = path.join(contentDir, filename)
      let fileContent = ''
      try {
        fileContent = fs.readFileSync(contentPath, 'utf8')
      } catch (err) {
        console.error(`Error reading file for context: ${contentPath}`, err)
      }
      combinedContent += `\n\n---\n**File: ${filename}**\n${fileContent}\n`
    }
    const answer = await callChatCompletion(question, combinedContent, OPENAI_API_KEY)
    console.log('Answer:\n', answer)
  } finally {
    db.close()
  }
}

/**
 * Embeds text using the OpenAI API, returning the vector (Float32Array) as a plain number array.
 *
 * @async
 * @function embedText
 * @param {string} text - The text to embed
 * @param {string} apiKey - The OpenAI API key
 * @returns {Promise<number[]>} Array of floats representing the text embedding
 * @throws {Error} If the API call fails
 */
async function embedText(text: string, apiKey: string): Promise<number[]> {
  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-large',
      encoding_format: 'float'
    })
  })
  if (!resp.ok) {
    throw new Error(`OpenAI error: ${await resp.text()}`)
  }
  const json = await resp.json()
  return json.data[0].embedding
}

/**
 * Calls the ChatCompletion API to generate an answer to the user's question using the text content.
 *
 * @async
 * @function callChatCompletion
 * @param {string} userQuestion - The question asked by the user
 * @param {string} fileContent - The content used for context
 * @param {string} apiKey - The OpenAI API key
 * @returns {Promise<string>} The assistant's answer from the ChatCompletion API
 * @throws {Error} If the API call fails
 */
async function callChatCompletion(userQuestion: string, fileContent: string, apiKey: string): Promise<string> {
  const chatBody = {
    model: 'o1-preview',
    messages: [
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
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(chatBody)
  })
  const chatJson = await chatRes.json()
  console.log(JSON.stringify(chatJson, null, 2))
  if (!chatRes.ok) {
    throw new Error(`OpenAI Chat API error: ${JSON.stringify(chatJson)}`)
  }
  return chatJson.choices[0].message.content
}