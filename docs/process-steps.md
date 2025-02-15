## Overview

This document describes how this codebase processes audio and video content, generates transcripts, optionally runs them through a Large Language Model (LLM), and stores the results in a database. The document walks through the primary entry points, each step of the pipeline, and how data flows from start to finish.

Two primary processing flows are supported which both share a similar 5-step pipeline with minor differences in how they retrieve content:

1. **`processVideo()`** – Processes online videos, typically YouTube links (or similar sources) by:
   - Generating a Markdown file with video metadata (via `yt-dlp`)
   - Downloading and converting audio
   - Transcribing audio content
   - Optionally running the transcript through an LLM
   - Storing the output (front matter, transcript, etc.) in both the file system and a PostgreSQL database

2. **`processFile()`** – Processes *local* audio or video files, performing the same pipeline without checking external dependencies like `yt-dlp` for downloading.

### Five Process Steps

Whether you call `processVideo()` or `processFile()`, you execute the following steps:

1. **Generate Markdown**: *Extract metadata about the content and build a Markdown “front matter.”*

2. **Download / Convert Audio**: *Download online content with `yt-dlp` (for `processVideo()`) or convert local files (for `processFile()`) to a WAV format with FFmpeg.*

3. **Run Transcription**: *Transcribe the WAV audio using one of three services: Whisper, Deepgram, or AssemblyAI.*

4. **Select Prompts**: *Dynamically construct a prompt for the LLM based on user options or a custom prompt file.*

5. **Run LLM** (optional): *Send the transcript (and prompt) to an LLM, write the “show notes” output to file, and store all data in the database.*

### Video and File Entry Points

**`processVideo(options, url, llmServices?, transcriptServices?)`**

- **File Location:** `src/process-commands/video.ts`
- **Purpose:** Entry point to process a single video from a URL (typically YouTube).  
- **Key Steps:**  
  1. **Generate Markdown:** Calls `generateMarkdown()` to create front matter and figure out file names/paths.  
  2. **Download Audio:** Calls `downloadAudio()` to run `yt-dlp` and FFmpeg.  
  3. **Run Transcription:** Calls `runTranscription()` using the designated transcription service.  
  4. **Select Prompts:** Calls `selectPrompts()` to pick or build the final prompt string.  
  5. **Run LLM (optional):** Calls `runLLM()` if `llmServices` is set. If `options.saveAudio` is `false`, the code calls `saveAudio()` to remove audio files.

- **Returns:** An object with:
  ```ts
  {
    frontMatter: string,
    prompt: string,
    llmOutput: string,
    transcript: string,
  }
  ```
- **Error Handling:** Logs errors and rethrows them.

**`processFile(options, filePath, llmServices?, transcriptServices?)`**

- **File Location:** `src/process-commands/file.ts`
- **Purpose:** Entry point to process a *local* audio or video file.  
- **Key Steps:** (same as above, but no `yt-dlp` call for metadata; only FFmpeg conversion)  
  1. **Generate Markdown:** Calls `generateMarkdown()` to create front matter.  
  2. **Download Audio / Convert:** Calls `downloadAudio()` to convert the local file to a WAV using FFmpeg.  
  3. **Run Transcription:** Calls `runTranscription()`.  
  4. **Select Prompts:** Calls `selectPrompts()`.  
  5. **Run LLM (optional):** Calls `runLLM()`, temporary files removed unless `options.saveAudio` is true.

- **Returns:** Same shape as `processVideo()`.  
- **Error Handling:** Logs and exits the process with code 1 on error.

## Step 1 – Generate Markdown (`01-generate-markdown.ts`)

- **Function:** `generateMarkdown(options, input)`
- **Primary Responsibilities:**
  1. **Build a safe filename** – Sanitizes the content’s title to ensure valid file system usage.
  2. **Extract Metadata** – Depending on the option set (`video`, `playlist`, `rss`, `file`), it extracts relevant metadata:
     - For YouTube, it uses `yt-dlp` to get:
       - `webpage_url` (showLink)
       - Channel name
       - Channel URL
       - Video title
       - Publish date
       - Thumbnail URL (cover image)
     - For local files, it simply uses the local filename as the title.
     - For RSS items, it reads from an `RSSItem` object.
  3. **Build Front Matter** – Calls `buildFrontMatter(metadata)` internally, producing a YAML-like block of text.

- **Core Return Values:**
  ```ts
  {
    frontMatter: string,   // The final, multi-line front matter text
    finalPath: string,     // e.g., 'content/2024-05-01-my-title'
    filename: string,      // e.g., '2024-05-01-my-title'
    metadata: EpisodeMetadata, // object containing showLink, channel, etc.
  }
  ```

**Note:** If you are processing a YouTube URL and do not have `yt-dlp` installed, `generateMarkdown` will throw an error because it cannot extract metadata.

---

## Step 2 – Download / Convert Audio (`02-download-audio.ts`)

- **Function:** `downloadAudio(options, input, filename)`
- **Primary Responsibilities:**
  1. **Determine Source**  
     - If `options.video`, `options.playlist`, `options.urls`, or `options.rss`, or `options.channel`, it attempts to download with `yt-dlp`.
     - If `options.file`, it attempts to read/convert a local file with FFmpeg.
  2. **Convert to WAV**  
     - The target format is 16 kHz, mono, 16-bit PCM using FFmpeg.  
     - This step ensures consistent audio input for transcription services.
  3. **Retry Logic**  
     - For web downloads, uses `executeWithRetry()` to handle transient errors.

- **Expected Output File:** `content/<filename>.wav`  
- **Returns:** A promise that resolves to the WAV file path, e.g. `content/my-title.wav`.

---

## Step 3 – Run Transcription (`03-run-transcription.ts`)

- **Function:** `runTranscription(options, finalPath, transcriptServices?)`
- **Primary Responsibilities:**
  1. **Switch on `transcriptServices`** – Decides which service to use:
     - `whisper` → Local/OpenAI’s Whisper (via `callWhisper()`)
     - `deepgram` → Calls `callDeepgram()`
     - `assembly` → Calls `callAssembly()`
  2. **Retry Logic** – Uses `retryTranscriptionCall()` with up to 5 attempts, 5-second delays.

- **Returns:** A promise that resolves to the raw transcript text.

---

## Step 4 – Select Prompts (`04-select-prompt.ts`)

- **Function:** `selectPrompts(options)`
- **Primary Responsibilities:**
  1. **Check for Custom Prompt** – If `options.customPrompt` is set, reads in a Markdown file and returns that file’s content.
  2. **Otherwise, Build from Sections** – Looks at `options.prompt` (or default sections). Each section is defined in `sections` from `04-prompts`.
  3. **Combine a “base instruction”** – The code includes a standard preamble and optional sections. Then it includes final instructions on how to format LLM output.

- **Returns:** A single multiline string representing the final prompt text.

---

## Step 5 – Run LLM (`05-run-llm.ts`)

- **Function:** `runLLM(options, finalPath, frontMatter, prompt, transcript, metadata, llmServices?)`
- **Primary Responsibilities:**
  1. **Determine the LLM** – Looks up the LLM in `LLM_FUNCTIONS`:
     - `ollama`, `chatgpt`, `claude`, `gemini`, `deepseek`, `fireworks`, `together`, etc.
  2. **Combine Prompt & Transcript** – Sends them to the LLM function in question.  
  3. **Retry Logic** – Uses `retryLLMCall()` up to 5 attempts with a 5-second delay.  
  4. **Write Output Files**:
     - If an LLM is used, writes:  
       \[front matter\] + \[LLM show notes output\] + \[transcript\] → `content/<filename>-<llmServices>-shownotes.md`
     - If no LLM is selected, writes:  
       \[front matter\] + \[prompt\] + \[transcript\] → `content/<filename>-prompt.md`
  5. **Insert Into Database** – Calls `insertShowNote()` to store all metadata in Postgres.

- **Returns:** The LLM show-notes output (or an empty string if none used).

Both `processVideo()` and `processFile()` check:

```ts
if (!options.saveAudio) {
  await saveAudio(finalPath)
}
```

- **Purpose:** Remove intermediate `.wav` files once the pipeline completes, unless `saveAudio` is set to `true`.

The helper function `saveAudio(finalPath)` is a bit ironically named, but based on the import statements, it actually removes the file if it exists. (In some codebases, “save” might mean “persist,” but here it has the effect of cleaning up.)

## Database Insertion (`db.ts`)

### Database Setup

- **Library:** `pg` (Node.js PostgreSQL client)
- **Connection:**  
  ```ts
  export const db: PoolType = new Pool({
    host: process.env['PGHOST'],
    user: process.env['PGUSER'],
    password: process.env['PGPASSWORD'],
    database: process.env['PGDATABASE'],
    port: process.env['PGPORT'] ? Number(process.env['PGPORT']) : undefined
  })
  ```
- **Auto-Creation of Table:**
  ```sql
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
  ```

### Insert Show Note

- **Function:** `insertShowNote(showNote: ShowNote)`
- **Columns:** `showLink, channel, channelURL, title, description, publishDate, coverImage, frontmatter, prompt, transcript, llmOutput`
- **Used By:** `runLLM()` at the end of the pipeline to store each episode’s data.
- **Return Value:** None (it’s just an async insert).

## Environment and Error Handling

Required Binaries:

- **yt-dlp** – Required if you want to extract YouTube video metadata or download YouTube audio.  
- **ffmpeg** – Required to convert audio to WAV format.

Environment Variables (PostgreSQL):

- `PGHOST` – Hostname for Postgres  
- `PGUSER` – Database username  
- `PGPASSWORD` – Database user password  
- `PGDATABASE` – Database name  
- `PGPORT` – Port to connect to Postgres (optional)

Each step logs errors (via `err(...)`) and typically rethrows or exits:

- `processVideo()` rethrows the error.
- `processFile()` logs and calls `process.exit(1)`.

Retries:

- `downloadAudio()` uses `executeWithRetry()` if `yt-dlp` encounters network errors.  
- `runTranscription()` uses `retryTranscriptionCall()` on each transcription call.  
- `runLLM()` uses `retryLLMCall()` to handle LLM service timeouts or intermittent failures.

## Putting It All Together – Example Flow

Invoke `processVideo(options, 'https://youtube.com/abc123', 'chatgpt', 'whisper')`.

1. **`generateMarkdown()`**:  
   - Uses `yt-dlp` to extract metadata (title, date, channel, etc.)  
   - Returns an object with `frontMatter`, `filename`, `finalPath`, etc.
2. **`downloadAudio()`**:  
   - Again calls `yt-dlp` to download/convert the audio to `content/<filename>.wav`.
3. **`runTranscription()`**:  
   - Calls local Whisper for speech-to-text, returns transcript.
4. **`selectPrompts()`**:  
   - Builds final LLM prompt from default sections or a custom prompt file if provided.
5. **`runLLM()`**:  
   - Calls `callChatGPT()` with the combined prompt + transcript.  
   - Writes a new file: `content/<filename>-chatgpt-shownotes.md` containing front matter, the LLM output, and the transcript.  
   - Inserts a record in the `show_notes` table with the same data.
   - Removes `content/<filename>.wav` if `options.saveAudio = false`.

This codebase orchestrates a multi-step pipeline to transform online or local media into transcripts and optional “show notes” generated by one of several LLMs. The pipeline is well-structured, with each step encapsulated in its own module:

- **`processVideo()` / `processFile()`** – High-level orchestration.  
- **`generateMarkdown()`** – Metadata extraction, file naming, front matter creation.  
- **`downloadAudio()`** – Audio downloading/conversion to WAV.  
- **`runTranscription()`** – Speech-to-text with optional retry logic.  
- **`selectPrompts()`** – Builds or reads the final LLM prompt.  
- **`runLLM()`** – Sends the transcript to an LLM, writes output, saves to DB.  
- **`insertShowNote()`** – Persists final results in PostgreSQL.

By following this pipeline, the system can:

1. **Fetch metadata**  
2. **Convert media**  
3. **Transcribe audio**  
4. **Summarize or create extended notes**  
5. **Store everything in a relational database**  