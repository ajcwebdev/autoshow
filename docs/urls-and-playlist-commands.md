Below is a reference document explaining how the code in **`process-commands/urls.ts`** and **`process-commands/playlist.ts`** processes multiple YouTube video links—either from a plain text file (`processURLs`) or from a YouTube playlist (`processPlaylist`). Both commands ultimately delegate to the underlying pipeline in `processVideo()`.

- **`processURLs()`**  
  Reads a local file of video URLs line by line, optionally saves metadata, then calls `processVideo()` on each URL.
  
- **`processPlaylist()`**  
  Uses `yt-dlp` to retrieve all video URLs in a playlist, optionally saves metadata, then calls `processVideo()` on each video.  

Both commands unify multiple inputs (URLs or playlist items) into the same single-video pipeline. This design allows for robust error handling—individual failures are logged, while the overall script continues processing the rest. If you need to process a large list of YouTube videos or entire playlists in one pass, these commands provide the batch layer on top of the main transcription/LLM pipeline.

## `processURLs()` — Processing Video URLs from a File

**File Location:** `src/process-commands/urls.ts`

### Function Signature

```ts
async function processURLs(
  options: ProcessingOptions,
  filePath: string,
  llmServices?: string,
  transcriptServices?: string
)
```

### Purpose & Workflow

1. **Read URLs from File**  
   - Reads the text file at `filePath` line by line.
   - Ignores empty lines and commented lines (those starting with `#`).
   - Collects a list of valid YouTube URLs.

2. **(Optional) Info-Only Mode**  
   - If `options.info` is set, the function **does not** process or transcribe the videos.
   - Instead, it calls `saveInfo('urls', urls, '')` to store or output high-level information about these URLs (e.g., in a JSON file). Then returns immediately.

3. **Sequential Processing**  
   - For each URL, it calls `processVideo(...)`.
   - If an individual URL fails, the error is logged, but the function continues processing subsequent URLs.

4. **Exit Conditions**  
   - If the file is unreadable, or if no URLs are found, `process.exit(1)` is called.

### Implementation Highlights

- **File Reading and Filtering**:
  ```ts
  const content = await readFile(filePath, 'utf8')
  const urls = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
  ```
- **Checking for `options.info`**:
  ```ts
  if (options.info) {
    await saveInfo('urls', urls, '')
    return
  }
  ```
- **Looping Through URLs**:
  ```ts
  for (const [index, url] of urls.entries()) {
    logSeparator({ type: 'urls', index, total: urls.length, descriptor: url })
    try {
      await processVideo(options, url, llmServices, transcriptServices)
    } catch (error) {
      err(`Error processing URL ${url}: ${(error as Error).message}`)
    }
  }
  ```
- **Error Handling**:
  - Reads the file in a try/catch, calls `process.exit(1)` if something critical fails.

**Important:** This command relies on `processVideo()`, which executes the entire standard pipeline (metadata extraction, audio conversion, transcription, optional LLM, DB insert, etc.). By reading from a file of URLs, you can process multiple YouTube videos in a batch.

---

## `processPlaylist()` — Processing a YouTube Playlist

**File Location:** `src/process-commands/playlist.ts`

### Function Signature

```ts
async function processPlaylist(
  options: ProcessingOptions,
  playlistUrl: string,
  llmServices?: string,
  transcriptServices?: string
)
```

### Purpose & Workflow

1. **Fetch Playlist Data with `yt-dlp`**  
   - Invokes `yt-dlp` with `--dump-single-json --flat-playlist` to retrieve a JSON payload of all video entries in the specified YouTube playlist.
   - Logs any warnings returned by `yt-dlp`.

2. **Extract Video URLs**  
   - Parses the returned JSON into a `PlaylistData` object.
   - Collects each video’s ID, generating the URL:  
     `https://www.youtube.com/watch?v=${entry.id}`

3. **(Optional) Info-Only Mode**  
   - If `options.info` is set, calls `saveInfo('playlist', urls, playlistTitle)` to store or output the extracted playlist info. Then returns immediately.

4. **Sequential Processing**  
   - Loops through each video URL in the playlist and calls `processVideo(options, url, llmServices, transcriptServices)`.
   - If any individual video fails, the error is logged, but subsequent videos still process.

5. **Exit Conditions**  
   - If `yt-dlp` fails to fetch data, or if the playlist is empty, the function logs an error and calls `process.exit(1)`.

### Implementation Highlights

- **Retrieving Playlist Info**:
  ```ts
  const { stdout, stderr } = await execFilePromise('yt-dlp', [
    '--dump-single-json',
    '--flat-playlist',
    '--no-warnings',
    playlistUrl,
  ])
  const playlistData: PlaylistData = JSON.parse(stdout)
  const playlistTitle = playlistData.title
  const entries = playlistData.entries
  const urls: string[] = entries.map((entry) => `https://www.youtube.com/watch?v=${entry.id}`)
  ```
- **Checking for `options.info`**:
  ```ts
  if (options.info) {
    await saveInfo('playlist', urls, playlistTitle)
    return
  }
  ```
- **Looping Through Each Video**:
  ```ts
  for (const [index, url] of urls.entries()) {
    logSeparator({ type: 'playlist', index, total: urls.length, descriptor: url })
    try {
      await processVideo(options, url, llmServices, transcriptServices)
    } catch (error) {
      err(`Error processing video ${url}: ${(error as Error).message}`)
    }
  }
  ```
- **Error Handling**:
  - If the playlist can’t be read or is empty, logs an error and calls `process.exit(1)`.

**Important:** This approach streamlines the mass-processing of an entire YouTube playlist into discrete calls to `processVideo()`. Each video is treated individually, so any errors only affect that single item rather than the entire playlist run.

## Info-Only Option (`options.info`)

Both commands support an `--info` flag (or `options.info` boolean). When true, they:

- Do **not** transcribe or run the full pipeline.
- Instead, invoke `saveInfo()` to store or print out high-level metadata:
  - For `processURLs()`, this is just the list of URLs found in the file.
  - For `processPlaylist()`, it saves the playlist title and the list of URLs.

This can be useful for quickly inspecting or confirming how many videos will be processed before running a potentially time-consuming transcription/LLM workflow.

## Error Handling and Logs

- **Graceful Degradation per Video**: Each video is processed in a try/catch, allowing the script to continue if any single URL or video fails.
- **Fatal Errors**:  
  - Inability to read the URL file or parse the playlist leads to an immediate exit (`process.exit(1)`).
  - Missing `yt-dlp` or network issues can also cause an exit if they happen before any URLs are extracted.

## Relationship to the Main Pipeline

Both `processURLs()` and `processPlaylist()` are essentially *batching* commands. Instead of processing a single piece of media, they:

1. Gather a list of YouTube video links (either from a text file or from the playlist’s metadata).
2. For each link, they call **`processVideo(...)`**, which performs the **5-step** pipeline:
   - **Generate Markdown**
   - **Download Audio**
   - **Transcribe**
   - **Select Prompts**
   - **Run LLM** (optional)
   - **Save to DB & Cleanup**

Because each URL processes independently, failure in one video does not prevent subsequent videos from running.