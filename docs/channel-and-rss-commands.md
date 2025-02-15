## Channel Processing (channel.ts)

**File Location:** `src/process-commands/channel.ts`

### Overview

This file contains logic to process a YouTube channel (or similar “channel-style” source with multiple videos). It does not directly handle the transcription or LLM steps; instead, it scans the channel for videos, gathers metadata, filters the list (e.g., skip, last), and calls the standard [`processVideo()`](#video-and-file-entry-points) function on each selected video.

### Exports

1. **selectVideos(stdout, options)**  
2. **processChannel(options, channelUrl, llmServices?, transcriptServices?)**

### selectVideos(stdout, options)

- **Purpose:**  
  Reads the raw list of video URLs from `yt-dlp` output, fetches detailed info for each video (upload date, timestamp, etc.), sorts them by date, and applies filters (skip, last).

- **Key Steps:**
  1. **Split URLs**  
     - Parses `stdout`, splitting on newlines to get an array of video URLs.
  2. **Fetch Video Details**  
     - Calls `yt-dlp` again (with `--print '%(upload_date)s|%(timestamp)s|%(is_live)s|%(webpage_url)s'`) for each URL to retrieve:
       - `uploadDate` (e.g., `20240101`)
       - `timestamp` (e.g., Unix timestamp)
       - `isLive` (boolean)
       - `webpage_url` (full link to the video)
  3. **Validation & Sorting**  
     - Builds a JavaScript `Date` from `uploadDate`.
     - Filters out any incomplete data.
     - Sorts the video list by `timestamp` ascending or descending depending on `options.order`.
  4. **Subset Selection**  
     - If `options.last` is set, takes that many most recent or oldest videos.
     - Otherwise uses `options.skip` to start at a certain offset.

- **Returns:**  
  ```ts
  {
    allVideos: VideoData[],
    videosToProcess: VideoData[],
  }
  ```
  Where each `VideoData` object contains `uploadDate`, `url`, `date`, `timestamp`, and `isLive`.

- **Error Handling:**  
  - Logs errors if a particular video fails to fetch details but continues processing the rest.  
  - If no videos can be processed, logs and calls `process.exit(1)`.

### processChannel(options, channelUrl, llmServices?, transcriptServices?)

- **Purpose:**  
  Entry point to handle an entire channel by:
  1. Retrieving a list of videos from the channel via `yt-dlp --flat-playlist`.
  2. Gathering detailed info (via `selectVideos()`).
  3. Optionally writing an info file (if `options.info`).
  4. Iterating through selected videos and calling [`processVideo()`](#video-and-file-entry-points) for each one.

- **Key Steps:**
  1. **Validate Channel Options**  
     - Ensures that flags like `--channel`, `--last`, or `--skip` make sense together.
  2. **Fetch Channel URLs**  
     - Runs `yt-dlp --flat-playlist --print '%(url)s'` on `channelUrl`, returning a list of video links.
  3. **Select Videos**  
     - Uses [`selectVideos()`](#selectvideosstdout-options) to retrieve, sort, and filter the full set of videos.
  4. **Info-Only Mode**  
     - If `options.info` is set, calls `saveInfo('channel', videosToProcess, '')` and returns immediately (no transcription).
  5. **Process Each Video**  
     - For each video URL in the filtered list:
       1. Logs a separator for clarity.
       2. Calls [`processVideo()`](#video-and-file-entry-points) with the provided `llmServices` and `transcriptServices`.
       3. Catches and logs any errors per video to avoid stopping the entire channel process.

- **Returns:**  
  - A promise that resolves when all videos have been processed (or when info is saved, if `--info` is used).
  - Does not return structured data for each video; rely on `processVideo()` logs, output files, and DB inserts.

- **Error Handling:**  
  - If any channel-wide errors occur (like failing to retrieve the playlist), logs and calls `process.exit(1)`.

## RSS Feed Processing (rss.ts)

**File Location:** `src/process-commands/rss.ts`

### Overview

This file contains logic to handle RSS feeds (common for podcasts). It fetches/parses an RSS feed, filters items (e.g., by date, skip, or specific item links), and then processes each item’s audio content using the same 5-step pipeline described elsewhere.

### Exports

1. **selectRSSItemsToProcess(rssUrl, options)**  
2. **processRSS(options, rssUrl, llmServices?, transcriptServices?)**

### selectRSSItemsToProcess(rssUrl, options)

- **Purpose:**  
  Retrieves and parses an RSS feed, then filters the items based on user options (e.g., `--last`, `--skip`, `--item`).

- **Key Steps:**
  1. **Fetch the RSS XML**  
     - Uses a custom `retryRSSFetch()` function with multiple retries and timeouts.
  2. **Parse RSS**  
     - Converts the RSS XML to a JavaScript object using `fast-xml-parser`.
     - Extracts the feed’s `channelTitle`, `channelLink`, `channelImage`, and `item` array.
  3. **Filter Items**  
     - Calls `filterRSSItems()` (from `rss-utils`) to apply user-specified flags:
       - `--item` to pick specific item URLs
       - `--last` or `--skip`
       - Potentially filters by date or other heuristics
  4. **Validation**  
     - If no items are found, logs an error and calls `process.exit(1)`.

- **Returns:**  
  ```ts
  {
    items: RSSItem[],
    channelTitle: string
  }
  ```
  Where each `RSSItem` contains fields like `title`, `link`, `pubDate`, etc., plus some derived metadata.

- **Error Handling:**  
  - On fetch or parse failures, logs the error and calls `process.exit(1)`.  
  - On a timeout, logs a specific “Fetch request timed out” error.

### processRSS(options, rssUrl, llmServices?, transcriptServices?)

- **Purpose:**  
  High-level function to process the filtered RSS items. For each item, it runs the same 5-step pipeline used for local files or videos:
  1. **generateMarkdown()**  
  2. **downloadAudio()**  
  3. **runTranscription()**  
  4. **selectPrompts()**  
  5. **runLLM()**

- **Key Steps:**
  1. **Initial Logging**  
     - Logs the function call, user-supplied flags (like `--last`, `--skip`, or `--item`).
  2. **Get and Filter Items**  
     - Calls [`selectRSSItemsToProcess()`](#selectrssitemstoprocessrssurl-options) for the feed URL.
  3. **Info-Only Mode**  
     - If `options.info` is set, calls `saveInfo('rss', items, channelTitle)` then returns (no audio processing).
  4. **Iteration over Each Item**  
     - For each feed item:
       1. Logs a separator and item title.
       2. Calls `generateMarkdown()` to build front matter (including channel data).
       3. Calls `downloadAudio()` to fetch the episode audio and convert it to WAV.
       4. Calls `runTranscription()` for speech-to-text.
       5. Calls `selectPrompts()` to build the LLM prompt (or load a custom prompt).
       6. Calls `runLLM()` to produce show notes, writes final output, and inserts DB records.
       7. Removes the `.wav` file unless `options.saveAudio` is true.
  5. **Collect Results**  
     - Internally maintains a `results` array for each item. (Return value is mostly for logging/debug.)

- **Returns:**  
  - A promise that resolves when all items have been processed or skipped.  
  - Does not return a consolidated data structure; final data is stored in files and the database.

- **Error Handling:**  
  - Catches errors for each item, logs them, and continues to the next item.  
  - On critical RSS fetch/parse errors, calls `process.exit(1)`.

### Notes and Differences from `processVideo()`

- **Metadata Source:**  
  RSS item fields like `title`, `pubDate`, and `enclosure` are used to derive episode metadata, rather than using `yt-dlp`.
- **Retry Logic for RSS:**  
  `retryRSSFetch()` is specifically designed to handle network errors or timeouts when fetching the feed.
- **info-Only Mode:**  
  If `--info` is provided, the code simply logs or saves a summary of the RSS items without running transcription or LLM steps.

**In summary,** `channel.ts` and `rss.ts` extend the same audio-processing/transcription/LLM pipeline to channel-based and RSS-based inputs. They each gather and filter the content list (videos or feed items) before calling the shared workflow steps to generate markdown, download/convert audio, transcribe, optionally run an LLM, and store results.