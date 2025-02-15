# How Autoshow's Database Works

## Regular Usage and Writing to Postgres Table

### Overview

Your primary workflow uses Fastify to accept incoming HTTP requests and writes show-note data (front matter, transcripts, LLM output, etc.) to a Postgres database in the `show_notes` table.

The key components are:

- **`fastify.ts`**: Defines your Fastify server and routes.
- **`handleProcessRequest`**: Receives requests, validates them, and dispatches them to the appropriate handler.
- **`runLLMFromPromptFile`** (from your cost-estimation utility) or **`runLLM`** (in `05-run-llm.ts`): Orchestrates the final LLM run and calls `insertShowNote`.
- **`db.ts`**: Creates a [pg](https://node-postgres.com/) Pool and exports functions to insert and query data in Postgres.

### Database Setup

```ts
// src/db.ts

import pg from 'pg'
const { Pool } = pg

export const db: Pool = new Pool({
  host: process.env['PGHOST'],
  user: process.env['PGUSER'],
  password: process.env['PGPASSWORD'],
  database: process.env['PGDATABASE'],
  port: process.env['PGPORT'] ? Number(process.env['PGPORT']) : undefined
})

// Auto-create the table if it doesn't exist
void (async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS show_notes (
      id SERIAL PRIMARY KEY,
      showLink TEXT,
      channel TEXT,
      channelURL TEXT,
      title TEXT NOT NULL,
      description TEXT,
      publishDate TEXT NOT NULL,
      coverImage TEXT,
      frontmatter TEXT,
      prompt TEXT,
      transcript TEXT,
      llmOutput TEXT
    )
  `)
})()

// Insert function
export async function insertShowNote(showNote: ShowNote) {
  ...
}
```

Here:

1. We build a connection pool (`Pool`) to Postgres using environment variables (`PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGPORT`).
2. We run a one-time `CREATE TABLE IF NOT EXISTS show_notes` query on startup to ensure the table exists.
3. We export `insertShowNote(showNote)`, which uses a parameterized INSERT query.

### How Data Gets Inserted

1. **HTTP Request**  
   A client sends a POST request to `/api/process` with JSON body specifying `type: 'runLLM'` (or `type: 'video'` / `type: 'file'` plus subsequent steps). For example:
   ```json
   {
     "type": "runLLM",
     "filePath": "path/to/content-file.md",
     "llmServices": "chatgpt",
     "llmModel": "gpt-4"
   }
   ```
2. **`handleProcessRequest`**  
   Inside `fastify.ts`, the `handleProcessRequest` function parses and validates the request, dispatching to the correct case in the switch statement.
3. **Running the LLM**  
   If `type === 'runLLM'`, the code calls `runLLMFromPromptFile(...)`, which eventually invokes `runLLM(...)` in `05-run-llm.ts`.
4. **`runLLM`**  
   In `05-run-llm.ts`, `runLLM`:

   - Optionally calls your LLM function (e.g., ChatGPT or Claude) to generate show notes.
   - Writes a combined `.md` file to disk containing front matter, LLM output, and transcript (for later reference).
   - **Calls `insertShowNote(...)`** with all the metadata, transcripts, and LLM output.
5. **`insertShowNote`**  
   The code executes a parameterized SQL INSERT. For example:
   ```sql
   INSERT INTO show_notes (
     showLink, channel, channelURL, title, description, publishDate, coverImage, frontmatter, prompt, transcript, llmOutput
   )
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
   ```

### Reading Show Notes

`fastify.ts` defines:

- **`GET /show-notes`**: Returns all show notes, sorted by `publishDate DESC`.
  ```ts
  const result = await db.query(`SELECT * FROM show_notes ORDER BY publishDate DESC`)
  ```
- **`GET /show-notes/:id`**: Returns a single show note by primary key:
  ```ts
  const result = await db.query(`SELECT * FROM show_notes WHERE id = $1`, [id])
  ```

These endpoints make the Postgres query and return the rows as JSON to the caller.

---

## 2. Creating Embeddings (with Postgres + pgvector)

### Overview

Instead of using SQLite for embeddings, you now use **pgvector** in Postgres. The script **`create-embed.ts`**:

1. Reads each `.md` file in your `content` directory.
2. Calls the OpenAI Embeddings API (`text-embedding-3-large`).
3. **Stores** each embedding in a Postgres table named `embeddings`, which includes a `vector` column of type `vector(...)`.

### Step-by-Step: Creating Embeddings

1. **Reading Markdown Files**  
   The script looks for all `.md` files in the `content` directory.
2. **Generating Embeddings**  
   For each file, it sends the content to:
   ```
   POST https://api.openai.com/v1/embeddings
   ```
   with your `OPENAI_API_KEY`. The response contains an array of floats (embedding).
3. **Writing Embeddings to JSON**  
   - It writes out `embeddings.json` for debugging or backup.
4. **Storing in Postgres**  
   - It establishes a connection pool (similar to `db.ts`):
     ```ts
     const embeddingsDb = new Pool({ ... })
     ```
   - Ensures the `vector` extension and `embeddings` table exist:
     ```sql
     CREATE EXTENSION IF NOT EXISTS vector;
     CREATE TABLE IF NOT EXISTS embeddings (
       filename TEXT PRIMARY KEY,
       vector vector(3072) NOT NULL
     );
     ```
   - For each file’s embedding, it inserts or upserts (`ON CONFLICT`) into the `embeddings` table:
     ```ts
     INSERT INTO embeddings (filename, vector)
     VALUES ($1, $2::vector(3072))
     ON CONFLICT (filename)
     DO UPDATE SET vector = EXCLUDED.vector
     ```
   - Note: The dimension `3072` may need to match the actual embedding length you receive for `text-embedding-3-large`.

---

## 3. Reading & Querying Embeddings (`query-embed.ts`)

### Overview

To perform semantic search against the embedded files, **`query-embed.ts`**:

1. Takes a user’s question or query string.
2. Embeds that question using the same OpenAI Embeddings API.
3. Runs a **pgvector** similarity query using the `<=>` (cosine distance) operator.
4. Fetches the top matches, reads their full text content, and then queries the ChatCompletion API to provide an answer.

### Step-by-Step: Querying

1. **Embedding the Query**  
   The question is sent to the `v1/embeddings` endpoint, which returns an array of floats.
2. **Building the Vector String**  
   The script creates a string of the form: `[0.12345, -0.6789, ...]`.
3. **pgvector Query**  
   ```sql
   SELECT
     filename,
     vector <=> $1::vector(3072) AS distance
   FROM embeddings
   ORDER BY vector <=> $1::vector(3072)
   LIMIT 5
   ```
   - `<=>` is the **cosine distance** operator from pgvector.
   - The query returns the top 5 closest documents by semantic similarity.
4. **Reading the Files & Calling Chat**  
   - The script then reads each matching `.md` file from `contentDir`, concatenates them, and passes that combined context + question to OpenAI’s ChatCompletion API.
   - The final answer is logged.

This effectively transforms your application into a semantic Q&A system that uses Postgres + pgvector for embedding storage and retrieval.

---

## High-Level Architecture

Below is a simplified flow diagram for reference:

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
    │  Postgres (show_notes)                   │
    └───────────────────────────────────────────┘

    
    ┌───────────────────────────────────────────┐
    │       create-embed.ts (embeddings)       │
    │ -> Reads content/*.md -> Embeds ->       │
    │ -> Upserts into Postgres embeddings      │
    └───────────────────────────────────────────┘
    
    ┌───────────────────────────────────────────┐
    │       query-embed.ts (embeddings)        │
    │ -> Embeds query -> SELECT filename       │
    │    ORDER BY vector <=> $1::vector(3072)   │
    │ -> Retrieves top matches -> calls Chat    │
    └───────────────────────────────────────────┘
```

---

## Key Points & Best Practices

1. **Postgres Connection**  
   - All scripts create their own pool or reuse the existing pool. Generally, you might centralize this for production. But this works for simpler scripts.

2. **Environment Variables**  
   - You must set `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGPORT` (optional), and `OPENAI_API_KEY`.

3. **pgvector**  
   - Make sure to install and enable the `pgvector` extension in your Postgres instance:  
     ```sql
     CREATE EXTENSION IF NOT EXISTS vector;
     ```
   - The dimension (e.g., 3072) must match the exact length of the embeddings.

4. **Error Handling**  
   - Each script uses standard `try/catch` blocks.  
   - The Fastify routes catch errors and respond with `500` or `400` as appropriate.

5. **Upserting Embeddings**  
   - `ON CONFLICT (filename) DO UPDATE SET ...` ensures the embedding is replaced if you generate it multiple times for the same file.

6. **Semantic Search Flow**  
   - Query embedding → `<=>` comparison → top files → ChatCompletion.  
   - This can be further refined by chunking your `.md` files, adding metadata, etc.

With this document, you should have a complete understanding of how data flows through your application now that you’ve migrated to **PostgreSQL** and **pgvector**. From standard show-note insertions and retrieval via `fastify.ts` and `show_notes`, to creating and querying embeddings in the `embeddings` table, the Postgres-based solution maintains the same conceptual flow as before but leverages the power of a single relational database and advanced vector operations.