# Example CLI Commands

## Outline

- [Content and Feed Inputs](#content-and-feed-inputs)
  - [Process Single Video URLs](#process-single-video-urls)
  - [Process Multiple Videos in YouTube Playlist](#process-multiple-videos-in-youtube-playlist)
  - [Process Multiple Videos Specified in a URLs File](#process-multiple-videos-specified-in-a-urls-file)
  - [Process Single Audio or Video File](#process-single-audio-or-video-file)
  - [Process Podcast RSS Feed](#process-podcast-rss-feed)
- [Language Model (LLM) Options](#language-model-llm-options)
  - [OpenAI's ChatGPT Models](#openais-chatgpt-models)
  - [Anthropic's Claude Models](#anthropics-claude-models)
  - [Cohere's Command Models](#coheres-command-models)
  - [Mistral's Mixtral Models](#mistrals-mixtral-models)
  - [OctoAI's Models](#octoais-models)
  - [Llama.cpp](#llamacpp)
  - [Ollama](#ollama)
- [Transcription Options](#transcription-options)
  - [Deepgram](#deepgram)
  - [Assembly](#assembly)
  - [Whisper.cpp](#whispercpp)

## Content and Feed Inputs

### Process Single Video URLs

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

### Process Single Audio or Video File

```bash
npm run autoshow -- --file "content/examples/example.mp3"
```

### Process Podcast RSS Feed

Run on an RSS podcast feed.

```bash
# Process RSS feed from oldest to newest (default behavior)
npm run autoshow -- --rss "https://feeds.transistor.fm/fsjam-podcast/"

# Explicitly process RSS feed from oldest to newest
npm run autoshow -- --rss "https://feeds.transistor.fm/fsjam-podcast/" --order oldest

# Process RSS feed from newest to oldest
npm run autoshow -- --rss "https://feeds.transistor.fm/fsjam-podcast/" --order newest
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

### Mistral's Mistral Models

```bash
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --mistral
```

### OctoAI's Models

```bash
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --octo
```

### Llama.cpp

Download Llama3.1-8B instruct model.

```bash
curl \
  -L https://huggingface.co/mradermacher/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct.Q2_K.gguf \
  -o ./src/llms/models/Meta-Llama-3.1-8B-Instruct.Q2_K.gguf
```

Set model in `.env` file.

```bash
echo '\nLLAMA_MODEL="Meta-Llama-3.1-8B-Instruct.Q2_K.gguf"' >> .env
# LLAMA_MODEL="Meta-Llama-3.1-8B-Instruct.Q2_K.gguf"
echo '\nHUGGING_FACE_URL="https://huggingface.co/mradermacher/Meta-Llama-3.1-8B-Instruct-GGUF"' >> .env
# HUGGING_FACE_URL="https://huggingface.co/mradermacher/Meta-Llama-3.1-8B-Instruct-GGUF"
```

```bash
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --llama
```

### Ollama

_Not implemented yet, this is just a placeholder._

```bash
# brew install ollama
# ollama pull phi3
# npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --ollama
# docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
# docker exec -it ollama ollama run phi3
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
# tiny model
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --whisper tiny

# base model
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --whisper base

# small model
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --whisper small

# medium model
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --whisper medium

# large-v2 model
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --whisper large
```

> _Note: Make sure the model you select is the same model you built in the [Clone Whisper Repo](#clone-whisper-repo) step._

_TODO: Rethink Docker integrations, probably want some kind of Compose setup that runs whisper.cpp, llama.cpp, and the Autoshow Node server._

```bash
# cp Dockerfile whisper.cpp
# cd whisper.cpp
# docker build -f Dockerfile -t whisper-image .
# docker buildx build --platform=linux/arm64 -f Dockerfile -t whisper-image .
# cd ..
```

```bash
# npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --docker
```