// src/utils/embeddings/query-embed.ts

import { PrismaClient } from '@prisma/client'
import {
  env, fileURLToPath, readFileSync, join, dirname, isAbsolute, resolve
} from '../node-utils.ts'

/**
 * Queries the previously created embeddings in Postgres to find the top matches
 * for a given question using pgvector's cosine distance operator (<=>).
 * It also calls the ChatCompletion API to provide an answer using the text content
 * of the top matching file. This function replicates the logic of the original
 * read-and-query-embeddings.js script, but leverages pgvector instead of sqlite-vec.
 *
 * @async
 * @function queryEmbeddings
 * @param {string} question - The user's question to embed and query
 * @param {string} [customDir] - An optional directory path if files are stored relatively
 * @returns {Promise<void>} Promise that resolves when the query is complete
 * @throws {Error} If the OPENAI_API_KEY is missing
 */
export async function queryEmbeddings(question: string, customDir?: string): Promise<void> {
  if (!question) {
    throw new Error('No question provided.')
  }

  const OPENAI_API_KEY = env['OPENAI_API_KEY']
  if (!OPENAI_API_KEY) {
    throw new Error('Please set the OPENAI_API_KEY environment variable.')
  }

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)

  // Determine the base directory for reading files if customDir is provided.
  // Otherwise default to the "content" directory, matching create-embed behavior.
  let baseDir: string
  if (customDir) {
    baseDir = isAbsolute(customDir)
      ? customDir
      : resolve(process.cwd(), customDir)
  } else {
    baseDir = resolve(__dirname, '..', '..', '..', 'content')
  }

  const db = new PrismaClient()

  try {
    const queryEmbedding = await embedText(question, OPENAI_API_KEY)
    // Convert the embedding to the pgvector format
    const vectorString = `[${queryEmbedding.join(',')}]`

    // Use the <=> operator for cosine distance
    const sql = `
      SELECT
        filename,
        vector <=> $1::vector(3072) AS distance
      FROM embeddings
      ORDER BY vector <=> $1::vector(3072)
      LIMIT 5
    `
    // Pass 'vectorString' directly as a single parameter
    const rows: { filename: string }[] = await db.$queryRawUnsafe(sql, vectorString)

    console.log(`Top matches for: "${question}"`)
    console.table(rows)
    if (rows.length === 0) {
      console.log('No matches found in the database.')
      return
    }

    let combinedContent = ''
    for (const row of rows) {
      /**
       * If the stored filename is absolute, read it directly.
       * Otherwise, join it with baseDir (the directory used during embedding).
       */
      const filename = row.filename
      const fileAbsolutePath = isAbsolute(filename)
        ? filename
        : join(baseDir, filename)

      let fileContent = ''
      try {
        fileContent = readFileSync(fileAbsolutePath, 'utf8')
      } catch (err) {
        console.error(`Error reading file for context: ${fileAbsolutePath}`, err)
      }
      combinedContent += `\n\n---\n**File: ${filename}**\n${fileContent}\n`
    }

    const answer = await callChatCompletion(question, combinedContent, OPENAI_API_KEY)
    console.log('Answer:\n', answer)
  } finally {
    await db.$disconnect()
  }
}

/**
 * Embeds text using the OpenAI API, returning the vector as a number array.
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