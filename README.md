# autoshow

An example workflow for automatically creating a video transcript with show notes using ChatGPT and Whisper.

## Outline

- [Project Structure](#project-structure)
- [Setup](#setup)
  - [Install Local Dependencies](#install-local-dependencies)
  - [Clone Whisper Repo](#clone-whisper-repo)
- [Run Autogen Node Scripts](#run-autogen-node-scripts)

## Project Structure

- `autogen.js` - Main entry point for the CLI
- `utils/index.js` - Utility functions to get the model and run common file operations
- `commands` - Directory for commands
  - `commands/processVideo.js` - Handles processing of a single video
  - `commands/processPlaylist.js` - Handles processing of a playlist
  - `commands/processUrlsFile.js` - Handles processing of a file with URLs
  - `commands/processRssFeed.js` - Handles processing of an RSS feed

## Setup

### Install Local Dependencies

Install `yt-dlp`, `ffmpeg`, and run `npm i`.

```bash
brew install yt-dlp ffmpeg
npm i
```

### Clone Whisper Repo

Run the following commands to clone `whisper.cpp` and build the `large-v2` model:

```bash
git clone https://github.com/ggerganov/whisper.cpp.git
bash ./whisper.cpp/models/download-ggml-model.sh base
make -C whisper.cpp
```

> Replace `base` with `large-v2` for the largest model or `medium` for a middle sized model.

## Run Autogen Node Scripts

Run on a single YouTube video.

```bash
node autogen.js --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

Run on multiple YouTube videos in a playlist.

```bash
node autogen.js --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXMh4DQBigyvHSRTf2CSj129"
```

Run on an arbitrary list of URLs in `urls.md`.

```bash
node autogen.js --urls urls.md
```

Run on an RSS podcast feed.

```bash
node autogen.js --rss "https://feeds.transistor.fm/fsjam-podcast/"
```

Feed prompt and transcript to OpenAI or Anthropic API. Create a `.env` file and set API key as demonstrated in `.env.example`.

```bash
node --env-file=.env autogen.js --chatgpt --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

```bash
node --env-file=.env autogen.js --claude --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```