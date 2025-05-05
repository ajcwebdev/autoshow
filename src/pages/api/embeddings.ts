// src/server/embeddings.ts

// import { PrismaClient } from '@prisma/client'
// import {
//   env, fileURLToPath, readdir, readFile, readFileSync, join, dirname, isAbsolute, resolve, relative, writeFileSync
// } from '../../utils.ts'

// async function getAllMarkdownFiles(dir: string): Promise<string[]> {
//   const dirEntries = await readdir(dir, { withFileTypes: true })
//   const mdFiles: string[] = []
//   for (const entry of dirEntries) {
//     const fullPath = join(dir, entry.name)
//     if (entry.isDirectory()) {
//       const nestedFiles = await getAllMarkdownFiles(fullPath)
//       mdFiles.push(...nestedFiles)
//     } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
//       mdFiles.push(fullPath)
//     }
//   }
//   return mdFiles
// }

// async function embedText(text: string, apiKey: string): Promise<number[]> {
//   const resp = await fetch('https://api.openai.com/v1/embeddings', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${apiKey}`
//     },
//     body: JSON.stringify({
//       input: text,
//       model: 'text-embedding-3-large',
//       encoding_format: 'float'
//     })
//   })
//   if (!resp.ok) {
//     throw new Error(`OpenAI error: ${await resp.text()}`)
//   }
//   const json = await resp.json()
//   return json.data[0].embedding
// }

// async function callChatCompletion(userQuestion: string, fileContent: string, apiKey: string): Promise<string> {
//   const chatBody = {
//     model: 'o1-preview',
//     messages: [
//       {
//         role: 'user',
//         content: `Context:\n${fileContent}\n\nQuestion: ${userQuestion}`
//       }
//     ]
//   }
//   const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${apiKey}`
//     },
//     body: JSON.stringify(chatBody)
//   })
//   const chatJson = await chatRes.json()
//   console.log(JSON.stringify(chatJson, null, 2))
//   if (!chatRes.ok) {
//     throw new Error(`OpenAI Chat API error: ${JSON.stringify(chatJson)}`)
//   }
//   return chatJson.choices[0].message.content
// }

// export async function createEmbeds(customDir?: string): Promise<void> {
//   const __filename = fileURLToPath(import.meta.url)
//   const __dirname = dirname(__filename)
//   let baseDir: string
//   if (customDir) {
//     baseDir = isAbsolute(customDir)
//       ? customDir
//       : resolve(process.cwd(), customDir)
//   } else {
//     baseDir = resolve(__dirname, '..', '..', 'content')
//   }
//   const openaiApiKey = env['OPENAI_API_KEY']
//   if (!openaiApiKey) {
//     throw new Error('Please set the OPENAI_API_KEY environment variable.')
//   }
//   let mdFiles: string[] = []
//   try {
//     mdFiles = await getAllMarkdownFiles(baseDir)
//     if (!mdFiles.length) {
//       console.log(`No .md files found in ${baseDir}`)
//       return
//     }
//   } catch (err) {
//     throw new Error(`Error reading directory: ${baseDir} - ${err}`)
//   }
//   const embeddings: Record<string, number[]> = {}
//   for (const filePath of mdFiles) {
//     const content = await readFile(filePath, 'utf8')
//     const fileNameForLog = relative(process.cwd(), filePath)
//     try {
//       const embedding = await embedText(content, openaiApiKey)
//       embeddings[filePath] = embedding
//       console.log(`Created embedding for: ${fileNameForLog}`)
//     } catch (err) {
//       console.error(`Error creating embedding for ${filePath}:`, err)
//     }
//   }
//   writeFileSync('embeddings.json', JSON.stringify(embeddings, null, 2), 'utf8')
//   console.log(`Saved embeddings to "embeddings.json"`)
//   const db = new PrismaClient()
//   await db.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`)
//   await db.$executeRawUnsafe(`
//     CREATE TABLE IF NOT EXISTS embeddings (
//       filename TEXT PRIMARY KEY,
//       vector vector(3072) NOT NULL
//     )
//   `)
//   let count = 0
//   for (const [filename, floatArray] of Object.entries(embeddings)) {
//     const vectorString = `[${floatArray.join(',')}]`
//     await db.$executeRawUnsafe(`
//       INSERT INTO embeddings (filename, vector)
//       VALUES ($1, $2::vector(3072))
//       ON CONFLICT (filename)
//       DO UPDATE SET vector = EXCLUDED.vector
//     `, filename, vectorString)
//     count++
//   }
//   console.log(`Inserted ${count} embeddings into Postgres 'embeddings' table.`)
//   await db.$disconnect()
// }

// export async function queryEmbeddings(question: string, customDir?: string): Promise<void> {
//   if (!question) {
//     throw new Error('No question provided.')
//   }
//   const OPENAI_API_KEY = env['OPENAI_API_KEY']
//   if (!OPENAI_API_KEY) {
//     throw new Error('Please set the OPENAI_API_KEY environment variable.')
//   }
//   const __filename = fileURLToPath(import.meta.url)
//   const __dirname = dirname(__filename)
//   let baseDir: string
//   if (customDir) {
//     baseDir = isAbsolute(customDir)
//       ? customDir
//       : resolve(process.cwd(), customDir)
//   } else {
//     baseDir = resolve(__dirname, '..', '..', 'content')
//   }
//   const db = new PrismaClient()
//   try {
//     const queryEmbedding = await embedText(question, OPENAI_API_KEY)
//     const vectorString = `[${queryEmbedding.join(',')}]`
//     const sql = `
//       SELECT
//         filename,
//         vector <=> $1::vector(3072) AS distance
//       FROM embeddings
//       ORDER BY vector <=> $1::vector(3072)
//       LIMIT 5
//     `
//     const rows: { filename: string }[] = await db.$queryRawUnsafe(sql, vectorString)
//     console.log(`Top matches for: "${question}"`)
//     console.table(rows)
//     if (rows.length === 0) {
//       console.log('No matches found in the database.')
//       return
//     }
//     let combinedContent = ''
//     for (const row of rows) {
//       const filename = row.filename
//       const fileAbsolutePath = isAbsolute(filename)
//         ? filename
//         : join(baseDir, filename)
//       let fileContent = ''
//       try {
//         fileContent = readFileSync(fileAbsolutePath, 'utf8')
//       } catch (err) {
//         console.error(`Error reading file for context: ${fileAbsolutePath}`, err)
//       }
//       combinedContent += `\n\n---\n**File: ${filename}**\n${fileContent}\n`
//     }
//     const answer = await callChatCompletion(question, combinedContent, OPENAI_API_KEY)
//     console.log('Answer:\n', answer)
//   } finally {
//     await db.$disconnect()
//   }
// }