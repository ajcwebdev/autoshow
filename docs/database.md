# How Autoshow's Database Works

## Regular Usage & Writing to Postgres (Prisma)

### Overview

Your primary workflow uses **Fastify** to accept incoming HTTP requests and delegates the creation of show notes to **Prisma**. You no longer manually manage a connection pool; instead, you use a single `PrismaClient` instance to perform database operations.

The key components are:

- **`fastify.ts`**: Defines your Fastify server and routes, including `/api/process`, `/show-notes`, and `/show-notes/:id`.
- **`handleProcessRequest`**: Receives, validates, and dispatches the request to the appropriate handler.
- **`runLLMFromPromptFile`** or **`runLLM`** (in `05-run-llm.ts`): Orchestrates the final LLM run and calls `insertShowNote`.
- **`db.ts`**: Exports a `PrismaClient` instance and an `insertShowNote` function that uses **Prisma** to create a row in the `show_notes` table.

### Database Setup with Prisma

```ts
// src/db.ts

import { PrismaClient } from '@prisma/client'
import { l } from './utils/logging'

export type ShowNote = {
  showLink: string
  channel: string
  channelURL: string
  title: string
  description: string
  publishDate: string
  coverImage: string
  frontmatter: string
  prompt: string
  transcript: string
  llmOutput: string
}

// Create a single PrismaClient instance
export const db = new PrismaClient()

// Insert function
export async function insertShowNote(showNote: ShowNote) {
  l.dim('\n  Inserting show note into the database...')

  const {
    showLink,
    channel,
    channelURL,
    title,
    description,
    publishDate,
    coverImage,
    frontmatter,
    prompt,
    transcript,
    llmOutput
  } = showNote

  // Leverage Prisma's create() to insert a row in show_notes
  await db.show_notes.create({
    data: {
      showLink,
      channel,
      channelURL,
      title,
      description,
      publishDate,
      coverImage,
      frontmatter,
      prompt,
      transcript,
      llmOutput
    }
  })

  l.dim('    - Show note inserted successfully.\n')
}
```

- **`db.show_notes.create()`**: Uses Prisma’s generated model (`show_notes`) to insert a row.  
- The table schema is now managed by **Prisma Migrations** (usually via your Prisma schema file), rather than manual `CREATE TABLE` calls.

### How Data Gets Inserted

1. **HTTP Request**  
   - A client sends a POST request to `/api/process` with JSON specifying `type: 'runLLM'` (or other types) and relevant file or YouTube URL data.

2. **`handleProcessRequest`**  
   - Inside `fastify.ts`, you parse and validate the request. A `switch` statement dispatches to the correct process method.

3. **Running the LLM**  
   - If `type === 'runLLM'`, the code calls `runLLMFromPromptFile`, which eventually invokes `runLLM` in `05-run-llm.ts`.

4. **`runLLM`**  
   - This function:
     - Potentially calls an external LLM (e.g., OpenAI or Claude) to generate show notes.
     - Writes a combined `.md` file to disk (for reference).
     - **Calls `insertShowNote(...)`** with the full metadata (prompt, transcript, LLM output).

5. **Prisma Insert**  
   - `insertShowNote` runs `db.show_notes.create({ data: {...} })`, adding a new record.

### Reading Show Notes

In `fastify.ts`, you now use Prisma to fetch data:

- **`GET /show-notes`**:
  ```ts
  const showNotes = await db.show_notes.findMany({
    orderBy: {
      publishDate: 'desc'
    }
  })
  ```
- **`GET /show-notes/:id`**:
  ```ts
  const showNote = await db.show_notes.findUnique({
    where: {
      id: Number(id)
    }
  })
  ```
These queries return a JavaScript array or object, which you then send as JSON in the response.

## Creating Embeddings (Prisma + pgvector)

### Overview

You continue to store semantic embeddings in Postgres with the **pgvector** extension, but you now manage those embeddings through **Prisma** using raw SQL. The script **`create-embed.ts`**:

1. Reads `.md` files in your `content` directory.
2. Calls the OpenAI Embeddings API (`text-embedding-3-large`).
3. **Stores** each embedding in a Postgres table named `embeddings` (with a `vector` column) by executing raw SQL via Prisma.

### Step-by-Step: Creating Embeddings

1. **Reading Markdown Files**  
   - Find all `.md` files in your `content` directory.

2. **Generating Embeddings**  
   - For each file, call `https://api.openai.com/v1/embeddings` with `OPENAI_API_KEY`.
   - The response includes `json.data[0].embedding`, an array of floats.

3. **Writing to JSON**  
   - This script writes a local `embeddings.json` file for debugging or backup.

4. **Storing in Postgres**  
   - Create a new `PrismaClient` and ensure `pgvector` is available:
     ```ts
     await db.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`)
     await db.$executeRawUnsafe(`
       CREATE TABLE IF NOT EXISTS embeddings (
         filename TEXT PRIMARY KEY,
         vector vector(3072) NOT NULL
       )
     `)
     ```
   - Insert or update each embedding:
     ```ts
     await db.$executeRawUnsafe(`
       INSERT INTO embeddings (filename, vector)
       VALUES ($1, $2::vector(3072))
       ON CONFLICT (filename)
       DO UPDATE SET vector = EXCLUDED.vector
     `, [filename, vectorString])
     ```
   - **Note**: `vectorString` is the `[0.123,0.456,...]` representation.  
   - The dimension (3072) depends on the model’s embedding size.

## Querying Embeddings (`query-embed.ts`)

### Overview

To perform **semantic search**:

1. The script takes a user’s **question**.
2. Embeds that question using the OpenAI Embeddings API.
3. Executes a **cosine distance** query (`<=>`) via pgvector’s operator to find similar documents.
4. Reads the top files, then calls the ChatCompletion API to get an answer.

### Step-by-Step: Querying

1. **Embed the Query**  
   - Similar to creating embeddings, we call `v1/embeddings` to get a float array for the question.

2. **pgvector Query**  
   - Build the string `[0.123, -0.456, ...]`.
   - Run raw SQL with Prisma:
     ```ts
     const sql = `
       SELECT
         filename,
         vector <=> $1::vector(3072) AS distance
       FROM embeddings
       ORDER BY vector <=> $1::vector(3072)
       LIMIT 5
     `
     const rows = await db.$queryRawUnsafe(sql, [vectorString])
     ```
   - This returns the top 5 matches sorted by ascending cosine distance.

3. **Reading Files & Calling Chat**  
   - For each returned `filename`, read the actual `.md` file from `content/`.
   - Combine them into a single context string, then pass it (plus the question) to OpenAI’s ChatCompletion API.

## High-Level Architecture

Although you’re now using **Prisma**, the overall flow remains similar:

```
                               ┌───────────────────┐
                               │   content/*.md    │
                               └───────────────────┘
        ┌─────────────┐           
        │   Client    │  POST /api/process
        └─────┬───────┘    (type=...)
              │
    ┌─────────▼───────────────────────────────────────┐
    │                   fastify.ts                    │
    │   (handleProcessRequest, getShowNotes, etc.)    │
    └─────────┬───────────────────────────────────────┘
              │
              │ calls runLLM(...) (or other steps)
              ▼
    ┌───────────────────────────────────────────────┐
    │            05-run-llm.ts                     │
    │ (Generates final content; calls insertShowNote)│
    └─────────┬─────────────────────────────────────┘
              │
              ▼
    ┌───────────────────────────────────────────┐
    │                 db.ts                    │
    │   PrismaClient -> show_notes table       │
    └───────────────────────────────────────────┘

    
    ┌───────────────────────────────────────────┐
    │   create-embed.ts (embeddings)          │
    │ -> Reads content/*.md -> Embeds ->       │
    │ -> Upserts into "embeddings" table       │
    │   using Prisma raw SQL & pgvector        │
    └───────────────────────────────────────────┘
    
    ┌───────────────────────────────────────────┐
    │   query-embed.ts (embeddings)           │
    │ -> Embeds query -> SELECT filename       │
    │    ORDER BY vector <=> $1::vector(3072)   │
    │ -> Retrieves top matches -> calls Chat    │
    └───────────────────────────────────────────┘
```

## Key Points & Best Practices (Prisma Edition)

1. **Prisma Client**  
   - You create a single `PrismaClient` in `db.ts`.  
   - Access it as `db` in your routes and scripts.  
   - Use `.create()`, `.findUnique()`, `.findMany()`, etc. for standard CRUD.

2. **Raw SQL for pgvector**  
   - Prisma does not natively support pgvector yet, so you use `$executeRawUnsafe()` and `$queryRawUnsafe()` for table creation and queries.  
   - Keep your model definitions in `prisma/schema.prisma` if you want them typed.  
   - Migrations can still handle your `show_notes` table; for the `embeddings` table, you may manage it via raw SQL or a migration script.

3. **Environment Variables**  
   - `DATABASE_URL` is typically used by Prisma for connection.  
   - You still need `OPENAI_API_KEY` for embedding/ChatCompletion.

4. **pgvector**  
   - Ensure `CREATE EXTENSION IF NOT EXISTS vector;` is in your database.  
   - The dimension (e.g., 3072) must match the model’s output.

5. **Error Handling**  
   - Each script has `try/catch` blocks.  
   - Fastify routes respond with the appropriate HTTP status if something fails.

6. **Semantic Search Flow**  
   - The logic remains: embed the query, find nearest neighbors by `<=>`, gather context from `.md` files, and call ChatCompletion.

By adopting Prisma, you gain type safety, migrations, and convenience methods for your normal CRUD operations while still retaining the power of raw SQL for advanced features like **pgvector**. This approach unifies your show note storage and embedding logic under a single, consistent database interface.