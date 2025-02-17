This codebase supports *YouTube channel* processing and *RSS feed* processing to handle multiple audio/video items in bulk. It extends the previously described **5-step pipeline** for downloading, transcribing, optionally summarizing via LLM, and storing results.

## Overview of the Pipeline

All operations follow the same basic five-step pipeline:

1. **Generate Markdown** (Front Matter)  
2. **Download / Convert Audio**  
3. **Run Transcription**  
4. **Select Prompts** (LLM instructions)  
5. **Run LLM** (optional)

These five steps are the same whether you are processing an individual YouTube video, a local file, an entire channel, or an RSS feed of podcast episodes. The difference lies in how the code **collects the list of items** (videos or episodes) and then **iterates** over them.

---

## Channel Processing

### File Location

```
src/process-commands/channel.ts
```

### Overview

The channel-related code provides utilities to:

1. Fetch **all** videos from a YouTube channel (via `yt-dlp`).
2. **Filter** and **sort** the list based on flags (`--order oldest|newest`, `--skip`, `--last`).
3. Either **show metadata** (`--info`) or run the **5-step pipeline** on each selected video by calling `processVideo()`.

The code also handles **live** vs. **non-live** videos, though typically live videos may not be fully downloadable if they are still ongoing.

### Exports

- **selectVideos(stdout, options)**  
- **processChannel(options, channelUrl, llmServices?, transcriptServices?)**

#### selectVideos(stdout, options)

- **Purpose:**  
  Reads a raw list of YouTube video URLs from `yt-dlp` output, calls `yt-dlp` again for each URL to get additional details (upload date, timestamp, isLive, etc.), sorts them, and applies user-specified filters (`--skip`, `--last`, `--order`).

- **Key Steps:**
  1. **Split URLs**  
     - Splits `stdout` on newlines to get an array of video URLs.
  2. **Fetch Video Details**  
     - Runs `yt-dlp` with a custom `--print '%(upload_date)s|%(timestamp)s|%(is_live)s|%(webpage_url)s'` format for each URL.
  3. **Validate & Sort**  
     - Ensures each video has valid metadata.  
     - Sorts by timestamp ascending or descending depending on `options.order`.
  4. **Subset Selection**  
     - If `options.last` is set, takes only that many from the sorted list.  
     - Otherwise uses `options.skip` to skip a certain number first.

- **Returns:**
  ```ts
  {
    allVideos: VideoData[];
    videosToProcess: VideoData[];
  }
  ```
  Where each `VideoData` includes `uploadDate`, `timestamp`, `isLive`, etc.

- **Error Handling:**  
  - Logs an error if a particular video fails metadata extraction but continues.  
  - If **no** videos can be processed, calls `process.exit(1)`.

#### processChannel(options, channelUrl, llmServices?, transcriptServices?)

- **Purpose:**  
  High-level entry point to:
  1. Fetch all channel video URLs (`yt-dlp --flat-playlist`).
  2. Get details and filter them via `selectVideos()`.
  3. If `--info`, generate an info file and exit.
  4. Otherwise, loop through each video and call `processVideo()` with the standard 5-step pipeline.

- **Key Steps:**
  1. **Validate Channel Options**  
     - Checks for invalid combinations like `--last` + `--skip`, ensuring numeric values, etc.
  2. **Fetch Channel URLs**  
     - Uses `yt-dlp` to list out all the video URLs in the channel.
  3. **Select Videos**  
     - Calls `selectVideos(stdout, options)`.
  4. **Info-Only Mode**  
     - If `options.info`, writes metadata to a JSON or Markdown info file (via `saveInfo()`) and returns.
  5. **Process Each Video**  
     - Calls `processVideo()` on each entry in `videosToProcess`, capturing errors individually to not halt the entire operation.

- **Returns:**
  - A promise that resolves once all selected videos have been processed or once the info file is saved.
  - Does not explicitly return per-video data; relies on logs, output files, and DB insert calls.

- **Error Handling:**  
  - On critical errors (e.g., channel fetch fails), logs the error and calls `process.exit(1)`.

---

## RSS Feed Processing

### File Location

```
src/process-commands/rss.ts
```

### Overview

This file processes **podcast-style RSS feeds**. It fetches and parses the RSS XML, filters items based on flags (`--skip`, `--last`, `--date`, `--lastDays`, etc.), and calls the same 5-step pipeline for each valid audio item (via `generateMarkdown()`, `downloadAudio()`, `runTranscription()`, `selectPrompts()`, and `runLLM()`).

### Exports

- **selectRSSItemsToProcess(rssUrl, options)**  
- **processRSS(options, rssUrl, llmServices?, transcriptServices?)**

#### selectRSSItemsToProcess(rssUrl, options)

- **Purpose:**  
  Fetches an RSS feed, parses it using `fast-xml-parser`, and applies filters (date-based, item-based, etc.) to produce a final array of items to process.

- **Key Steps:**
  1. **Fetch the RSS XML**  
     - Uses a custom `retryRSSFetch()` with multiple retries/timeouts in case of network flakiness.
  2. **Parse RSS**  
     - Extracts `title`, `link`, `image`, `item` from the feed’s `<channel>` element.
  3. **Filter Items**  
     - Applies user-specified flags like `--item` (process specific episode URLs), `--lastDays` (process episodes from the last N days), or `--date` (process items from specific calendar dates).
  4. **Validation**  
     - If no items are found, calls `process.exit(1)`.

- **Returns:**
  ```ts
  {
    items: RSSItem[];
    channelTitle: string;
  }
  ```
  Where `RSSItem` includes `showLink` (the audio URL), `channel`, `title`, `publishDate`, etc.

- **Error Handling:**  
  - If RSS fetch or parsing fails, logs and calls `process.exit(1)`.

#### processRSS(options, rssUrl, llmServices?, transcriptServices?)

- **Purpose:**  
  High-level entry point to process a single RSS feed. Iterates over the filtered items from `selectRSSItemsToProcess()` and runs the 5-step pipeline on each.

- **Key Steps:**
  1. **Initial Logging**  
     - Logs the function call, relevant flags (`--skip`, `--last`, `--item`, etc.).
  2. **Select RSS Items**  
     - Calls `selectRSSItemsToProcess()` to parse & filter.
  3. **Info-Only Mode**  
     - If `--info`, calls `saveInfo()` and skips downloading or transcribing.
  4. **Iterate Items**  
     - For each item:
       1. `generateMarkdown()` → builds front matter from RSS data.  
       2. `downloadAudio()` → fetches the audio file and converts to WAV.  
       3. `runTranscription()` → obtains the transcript.  
       4. `selectPrompts()` → loads or constructs the LLM prompt.  
       5. `runLLM()` → obtains show notes, writes output, stores in DB.  
       6. Removes `.wav` if `options.saveAudio` is false.
  5. **Collect Results**  
     - The code keeps an internal results array, but final data is stored in output files and the Postgres DB.

- **Returns:**  
  - A promise that resolves when all items have been processed.

- **Error Handling:**  
  - Logs any item-specific errors but continues to the next item.
  - On fatal RSS errors, calls `process.exit(1)`.

### Notes and Differences from `processVideo()`

- **Metadata Source**  
  RSS items come from XML fields like `<item>` → `title`, `pubDate`, `<enclosure>` for the audio/video link. No `yt-dlp` call is needed here.
- **Retry Logic**  
  `retryRSSFetch()` handles network errors/timeouts specifically for RSS.
- **info-Only Mode**  
  Allows you to produce a JSON or Markdown file of feed item metadata without doing transcription or LLM.

---

## Shared Utilities

Both **channel** and **rss** flows rely on shared utility functions to validate flags, skip items, sort results, and so on.

### Channel Utils

**File Location:** `src/utils/command-utils/channel-utils.ts` (or similar)

- **validateChannelOptions(options)**  
  - Checks that `--last`, `--skip`, and `--order` flags do not conflict or have invalid values.
  - Logs minimal info about how many videos will be processed/skipped.
- **logChannelProcessingStatus(total, processing, options)**  
  - Logs the total videos found vs. how many will be processed after applying `--last`, `--skip`, etc.

### RSS Utils

**File Location:** `src/utils/command-utils/rss-utils.ts` (or similar)

- **parseAndAppendRssUrls(options)**  
  - Reads an external file (`--rssURLs`) line by line, appends valid RSS feed URLs to `options.rss`.
- **validateRSSOptions(options)**  
  - Similar to `validateChannelOptions` but for RSS flags. Checks `--lastDays`, `--date`, `--last`, `--skip`, etc.
- **filterRSSItems(options, feedItemsArray, channelTitle, channelLink, channelImage)**  
  - Applies logic to filter and reorder feed items based on `--item`, `--date`, `--order oldest|newest`, `--skip`, and `--lastDays`.
- **validateRSSAction(options, handler, llmServices?, transcriptServices?)**  
  - High-level function to ensure valid RSS inputs, then calls the given handler on each feed URL in `options.rss`.
- **logRSSProcessingStatus(total, processing, options)**  
  - Logs the total feed items vs. the number to be processed based on user flags.

---

## CLI Examples

Below are commands demonstrating how to use the channel and RSS entry points with various flags.

### Process All Videos from a YouTube Channel

**Newest first (default):**

```bash
npm run as -- --channel "https://www.youtube.com/@ajcwebdev"
```

**Oldest first:**

```bash
npm run as -- \
  --channel "https://www.youtube.com/@ajcwebdev" \
  --order oldest
```

**Skip a certain number of videos before beginning processing:**

```bash
npm run as -- \
  --channel "https://www.youtube.com/@ajcwebdev" \
  --skip 1
```

**Process only the last 3 recent videos:**

```bash
npm run as -- \
  --channel "https://www.youtube.com/@ajcwebdev" \
  --last 3
```

**Info-Only Mode (write JSON file with video metadata, no transcription):**

```bash
npm run as -- --info --channel "https://www.youtube.com/@ajcwebdev"
```

#### Advanced Channel Example

```bash
npm run as -- \
  --channel "https://www.youtube.com/@ajcwebdev" \
  --order oldest \
  --skip 2 \
  --last 5 \
  --whisper base \
  --chatgpt GPT_4_TURBO \
  --prompt summary shortChapters \
  --saveAudio
```

Here’s what happens:

1. **Channel**: Processes videos from `@ajcwebdev`.  
2. **Order**: Starts from oldest.  
3. **Skip**: Skips the first 2 videos from oldest first.  
4. **Last**: Then processes the next 5 videos.  
5. **Whisper**: Uses `--whisper base` for transcription.  
6. **LLM**: Uses `--chatgpt GPT_4_TURBO` for generating show notes.  
7. **Prompt**: Summaries + short chapters (`--prompt summary shortChapters`).  
8. **Save Audio**: Keeps the intermediate `.wav` and downloaded files.

---

### Process Podcast RSS Feed

**From newest to oldest (default):**

```bash
npm run as -- --rss "https://ajcwebdev.substack.com/feed"
```

**From oldest to newest:**

```bash
npm run as -- \
  --rss "https://feeds.transistor.fm/fsjam-podcast/" \
  --order oldest
```

**Skip a certain number of items:**

```bash
npm run as -- \
  --rss "https://feeds.transistor.fm/fsjam-podcast/" \
  --skip 1
```

**Process only the last 3 items:**

```bash
npm run as -- \
  --rss "https://feeds.transistor.fm/fsjam-podcast/" \
  --last 3
```

**Process a single specific episode (by audio URL):**

```bash
npm run as -- \
  --rss "https://ajcwebdev.substack.com/feed" \
  --item "https://api.substack.com/feed/podcast/36236609/fd1f1532d9842fe1178de1c920442541.mp3"
```

**Info-Only Mode (metadata only, no downloads):**

```bash
npm run as -- \
  --rss "https://ajcwebdev.substack.com/feed" \
  --info
```

**Multiple RSS Feeds in a single command:**

```bash
npm run as -- \
  --last 1 \
  --whisper tiny \
  --rss "https://ajcwebdev.substack.com/feed" \
  "https://feeds.transistor.fm/fsjam-podcast/"
```

**Read multiple RSS feed URLs from a file (`--rssURLs`):**

```bash
npm run as -- \
  --rssURLs "content/example-rss-feeds.md" \
  --whisper tiny \
  --last 2
```

**By Specific Date (e.g., episodes published on `2021-05-10`):**

```bash
npm run as -- \
  --rss "https://ajcwebdev.substack.com/feed" \
  --date 2021-05-10
```

**Multiple Dates:**

```bash
npm run as -- \
  --rss "https://ajcwebdev.substack.com/feed" \
  --date 2021-05-10 2022-05-10
```

**Download episodes from the last 7 days (`--lastDays`):**

```bash
npm run as -- \
  --rss "https://ajcwebdev.substack.com/feed" \
  --lastDays 7
```

#### Advanced RSS Example

```bash
npm run as -- \
  --rss "https://ajcwebdev.substack.com/feed" \
  --skip 2 \
  --assembly \
  --speakerLabels \
  --chatgpt GPT_4 \
  --prompt summary longChapters \
  --saveAudio
```

Explanation:

1. **RSS**: Target the feed at `https://ajcwebdev.substack.com/feed`.  
2. **Skip**: Ignore the first 2 items.  
3. **Transcription**: Use `AssemblyAI` (`--assembly`) with **speaker labels** (`--speakerLabels`).  
4. **LLM**: Use `ChatGPT` with GPT-4 (`--chatgpt GPT_4`).  
5. **Prompt**: Ask for a summary + long chapters (`--prompt summary longChapters`).  
6. **Save Audio**: Keep `.wav` files around.

---

## Recap of the Five Steps

Regardless of **channel** or **RSS** mode, once an item is selected (a video or an episode), the following pipeline runs:

1. **Generate Markdown** (via `01-generate-markdown.ts`)  
   - Builds front matter from metadata (title, date, etc.).  
   - Constructs safe filenames.
2. **Download / Convert Audio** (via `02-download-audio.ts`)  
   - Calls `yt-dlp` (for YouTube) or HTTP fetch (for RSS) + `FFmpeg` to produce a WAV file at 16kHz, mono, 16-bit PCM.
3. **Run Transcription** (via `03-run-transcription.ts`)  
   - Chooses a service: `whisper`, `deepgram`, or `assembly` (also known as `AssemblyAI`).  
   - Retries up to 5 times if the service fails or times out.
4. **Select Prompts** (via `04-select-prompt.ts`)  
   - Builds or reads a custom LLM prompt from sections or a file.  
   - Merges with any user-specific prompt flags (e.g., `--prompt summary shortChapters`).
5. **Run LLM** (via `05-run-llm.ts`)  
   - Sends the transcript and prompt to a chosen LLM (ChatGPT, Claude, etc.).  
   - Writes final output to a Markdown file and inserts data into Postgres.

**Note**: If no LLM is selected, the code still writes out front matter + transcript, but does not generate or store show notes.

---

## Database Insertion (db.ts)

As a final step, if an LLM is used, the system calls `insertShowNote()` to store all relevant data in a PostgreSQL table:

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

---

## Environment Requirements

- **yt-dlp**: Required for channel-based workflows and for single video processing (e.g., `processVideo()`).  
- **ffmpeg**: Required to convert audio to WAV for transcription.  
- **Node.js**: For running the scripts.  
- **PostgreSQL**: For storing show notes (if you enable DB insertion).

**Environment Variables** for PostgreSQL:

- `PGHOST`  
- `PGUSER`  
- `PGPASSWORD`  
- `PGDATABASE`  
- `PGPORT` (optional)

---

## Conclusion

1. **Channel vs. RSS**: You can process an entire YouTube channel’s videos or a podcast’s RSS feed using similar flags (`--skip`, `--last`, `--info`, etc.).  
2. **5-Step Pipeline**: All items (videos or podcast episodes) go through the same 5-step pipeline:  
   - Generate Markdown → Download Audio → Transcribe → Prompt → LLM  
3. **Advanced Filters**:  
   - For channels, you can specify skip/last to handle video ordering.  
   - For RSS, you can filter by date, last N items, skip items, or only process specific episodes.  
4. **Persistence**: The final content (transcript, show notes) is saved to local files and optionally a PostgreSQL database.

With this reference, you should be able to configure any combination of channel, RSS, transcription service, LLM, prompts, and filtering logic to suit your workflow needs.