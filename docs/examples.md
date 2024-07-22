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
npm run autoshow -- --urls "content/examples/urls.md"
```

### Process Single Audio File

```bash
npm run autoshow -- --audio "content/examples/example.mp3"
```

### Process Single Audio URL

_Not implemented yet, this is just a placeholder._

```bash
# npm run autoshow -- --audioUrl "https://media.transistor.fm/ade4ec38/cdf2e8ef.mp3"
```

### Process Single Video File

_Not implemented yet, this is just a placeholder._

```bash
# npm run autoshow -- --videoFile "video.mp4"
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

```bash
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --chatgpt
```

### Anthropic's Claude Models

```bash
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --claude
```

### Cohere's Command Models

```bash
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --cohere
```

### Mistral's Mixtral Models

```bash
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --mistral
```

### OctoAI's Models

```bash
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --octo
```

### node-llama-cpp

Download Llama3-8B instruct model.

```bash
npx node-llama-cpp pull --dir ./utils/llms/models "https://huggingface.co/mradermacher/Meta-Llama-3-8B-Instruct-GGUF/resolve/main/Meta-Llama-3-8B-Instruct.Q8_0.gguf"
```

Set model in `.env` file.

```bash
echo '\nLLAMA_MODEL="Meta-Llama-3-8B-Instruct.Q8_0.gguf"' >> .env
```

```bash
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --llama
```

### Temporary Hacky Way to Run All Five LLMs at Once

This will be improved soon to allow generating multiple show notes with different LLMs after running the transcription step only once. But for now this will get the job done (just very, very slowly):

```bash
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --chatgpt && rm content/2023-09-10-jKB0EltG9Jo.md && \
  npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --claude && rm content/2023-09-10-jKB0EltG9Jo.md && \
  npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --cohere && rm content/2023-09-10-jKB0EltG9Jo.md && \
  npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --mistral && rm content/2023-09-10-jKB0EltG9Jo.md && \
  npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --octo
```

## Transcription Options

Create a `.env` file and set API key as demonstrated in `.env.example` for `DEEPGRAM_API_KEY` or `ASSEMBLY_API_KEY`.

### Deepgram

```bash
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --deepgram
```

### Assembly

```bash
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --assembly
```

### Whisper.cpp

If neither the `--deepgram` or `--assembly` option is included for transcription, `autoshow` will default to running the largest Whisper.cpp model. To configure the size of the Whisper model, use the `--model` option and select one of the following:

```bash
# base model
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" -m base

# medium model
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" -m medium

# large-v2 model
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" -m large
```

> _Note: Make sure the model you select is the same model you built in the [Clone Whisper Repo](#clone-whisper-repo) step._

### Whisper.cpp Docker

```bash
cp Dockerfile whisper.cpp
cd whisper.cpp
docker build -f Dockerfile -t whisper-image .
# docker buildx build --platform=linux/arm64 -f Dockerfile -t whisper-image .
cd ..
```

```bash
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --docker
```