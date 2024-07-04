# Example CLI Commands

## Outline

- [Content and Feed Inputs](#content-and-feed-inputs)
  - [Process Single Video File](#process-single-video-file)
  - [Process Multiple Videos in YouTube Playlist](#process-multiple-videos-in-youtube-playlist)
  - [Process Multiple Videos Specified in a URLs File](#process-multiple-videos-specified-in-a-urls-file)
  - [Process Single Audio File](#process-single-audio-file)
  - [Process Single Audio URL](#process-single-audio-url)
  - [Process Podcast RSS Feed](#process-podcast-rss-feed)
- [Language Model (LLM) Options](#language-model-llm-options)
  - [OpenAI's ChatGPT Models](#openais-chatgpt-models)
  - [Anthropic's Claude Models](#anthropics-claude-models)
  - [Cohere's Command Models](#coheres-command-models)
  - [Mistral's Mixtral Models](#mistrals-mixtral-models)
  - [OctoAI's Models](#octoais-models)
- [Transcription Options](#transcription-options)
  - [Deepgram](#deepgram)
  - [Assembly](#assembly)
  - [Whisper.cpp](#whispercpp)
- [Run Autoshow Bash Scripts](#run-autoshow-bash-scripts)

## Content and Feed Inputs

### Process Single Video File

Run on a single YouTube video.

```bash
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

### Process Multiple Videos in YouTube Playlist

Run on multiple YouTube videos in a playlist.

```bash
npm run autoshow -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXMh4DQBigyvHSRTf2CSj129"
```

### Process Multiple Videos Specified in a URLs File

Run on an arbitrary list of URLs in `urls.md`.

```bash
npm run autoshow -- --urls urls.md
```

### Process Single Audio File

```bash
node --env-file=.env autoshow.js --audio "audio.mp3"
npm run autoshow -- --audio "audio.mp3"
```

### Process Single Audio URL

_Not implemented yet, this is just a placeholder._

```bash
# node --env-file=.env autoshow.js --audioUrl "https://media.transistor.fm/ade4ec38/cdf2e8ef.mp3"
# npm run autoshow -- --audioUrl "https://media.transistor.fm/ade4ec38/cdf2e8ef.mp3"
```

### Process Podcast RSS Feed

Run on an RSS podcast feed.

```bash
# Process RSS feed from oldest to newest (default behavior)
npm run autoshow -- --rss "https://feeds.transistor.fm/fsjam-podcast/"

# Explicitly process RSS feed from oldest to newest
npm run autoshow -- --rss "https://feeds.transistor.fm/fsjam-podcast/" --oldest

# Process RSS feed from newest to oldest
npm run autoshow -- --rss "https://feeds.transistor.fm/fsjam-podcast/" --newest
```

## Language Model (LLM) Options

Create a `.env` file and set API key as demonstrated in `.env.example` for `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `COHERE_API_KEY`, `MISTRAL_API_KEY`, or `OCTOAI_API_KEY`.

### OpenAI's ChatGPT Models

Feed prompt and transcript to ChatGPT models with OpenAI API

```bash
npm run autoshow -- --chatgpt --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

### Anthropic's Claude Models

Feed prompt and transcript to Claude models with Anthropic API.

```bash
npm run autoshow -- --claude --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

### Cohere's Command Models

```bash
npm run autoshow -- --cohere --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

### Mistral's Mixtral Models

```bash
npm run autoshow -- --mistral --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

### OctoAI's Models

```bash
npm run autoshow -- --octo --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

### Temporary Hacky Way to Run All Five LLMs at Once

This will be improved soon to allow generating multiple show notes with different LLMs after running the transcription step only once. But for now this will get the job done (just very, very slowly):

```bash
npm run autoshow -- --chatgpt --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" && rm content/2023-09-10-jKB0EltG9Jo.md && \
  npm run autoshow -- --claude --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" && rm content/2023-09-10-jKB0EltG9Jo.md && \
  npm run autoshow -- --cohere --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" && rm content/2023-09-10-jKB0EltG9Jo.md && \
  npm run autoshow -- --mistral --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" && rm content/2023-09-10-jKB0EltG9Jo.md && \
  npm run autoshow -- --octo --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" && rm content/2023-09-10-jKB0EltG9Jo.md
```

## Transcription Options

Create a `.env` file and set API key as demonstrated in `.env.example` for `DEEPGRAM_API_KEY` or `ASSEMBLY_API_KEY`.

### Deepgram

```bash
npm run autoshow -- --deepgram --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

### Assembly

```bash
npm run autoshow -- --assembly --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

### Whisper.cpp

If neither the `--deepgram` or `--assembly` option is included for transcription, `autoshow` will default to running the largest Whisper.cpp model. To configure the size of the Whisper model, use the `--model` option and select one of the following:

- `base`
- `medium`
- `large`

```bash
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --model base
```

> _Note: Make sure the model you select is the same model you built in the [Clone Whisper Repo](#clone-whisper-repo) step._

## Run Autoshow Bash Scripts

```bash
# Run on a single YouTube video (short one minute video)
./autoshow.sh --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"

# Run on a single YouTube video (longer 30 minute video)
./autoshow.sh --video "https://www.youtube.com/watch?v=QhXc9rVLVUo"

# Run on a single audio file
./autoshow.sh --audio "https://media.transistor.fm/d1d18d2d/449ace19.mp3"

# Run on multiple YouTube videos in a playlist
./autoshow.sh --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXMh4DQBigyvHSRTf2CSj129"

# Run on an arbitrary list of URLs in `urls.md`
./autoshow.sh --urls urls.md

# Run on a local video file
./autoshow.sh --file content/video.mkv
```