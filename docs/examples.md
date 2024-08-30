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
- [Transcription Options](#transcription-options)
  - [Deepgram](#deepgram)
  - [Assembly](#assembly)
  - [Whisper.cpp](#whispercpp)
- [Alternative JavaScript Runtimes](#alternative-javascript-runtimes)
  - [Deno](#deno)
  - [Bun](#bun)

## Content and Feed Inputs

### Process Single Video URLs

Run on a single YouTube video.

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

### Process Multiple Videos in YouTube Playlist

Run on multiple YouTube videos in a playlist.

```bash
npm run as -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXMh4DQBigyvHSRTf2CSj129"
```

### Process Multiple Videos Specified in a URLs File

Run on an arbitrary list of URLs in `urls.md`.

```bash
npm run as -- --urls "content/examples/urls.md"
```

### Process Single Audio or Video File

Download MP3 file for testing:

```bash
curl -L https://ajc.pics/audio/fsjam-short.mp3 -o ./content/audio.mp3
```

Run on `audio.mp3` on the `content` directory:

```bash
npm run as -- --file "content/audio.mp3"
```

### Process Podcast RSS Feed

Process RSS feed from newest to oldest (default behavior):

```bash
npm run as -- --rss "https://feeds.transistor.fm/fsjam-podcast/"
```

Process RSS feed from oldest to newest:

```bash
npm run as -- --rss "https://feeds.transistor.fm/fsjam-podcast/" --order oldest
```

Start processing a different episode by selecting a number of episodes to skip:

```bash
npm run as -- --rss "https://feeds.transistor.fm/fsjam-podcast/" --skip 1
```

## Language Model (LLM) Options

Create a `.env` file and set API key as demonstrated in `.env.example` for either:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `COHERE_API_KEY`
- `MISTRAL_API_KEY`
- `OCTOAI_API_KEY`

For each model available for each provider, I have collected the following details:

- Context Window, the limit of tokens a model can process at once.
- Max Output, the upper limit of tokens a model can generate in a response, influencing response length and detail.
- Cost of input and output tokens per million tokens.
  - Some model providers also offer a Batch API with input/output tokens at half the price.

### OpenAI's ChatGPT Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --chatgpt
```

Select ChatGPT model:

```bash
# Select GPT-4o mini model - https://platform.openai.com/docs/models/gpt-4o-mini
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --chatgpt GPT_4o_MINI

# Select GPT-4o model - https://platform.openai.com/docs/models/gpt-4o
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --chatgpt GPT_4o

# Select GPT-4 Turbo model - https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --chatgpt GPT_4_TURBO

# Select GPT-4 model - https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --chatgpt GPT_4
```

| Model        | Context Window | Max Output | Input Tokens | Output Tokens | Batch Input | Batch Output |
|--------------|----------------|------------|--------------|---------------|-------------|--------------|
| GPT-4o mini  | 128,000        | 16,384     | $0.15        | $0.60         | $0.075      | $0.30        |
| GPT-4o       | 128,000        | 4,096      | $5           | $15           | $2.50       | $7.50        |
| GPT-4 Turbo  | 128,000        | 4,096      | $10          | $30           | $5          | $15          |
| GPT-4        | 8,192          | 8,192      | $30          | $60           | $15         | $30          |

### Anthropic's Claude Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --claude
```

### Cohere's Command Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --cohere
```

### Mistral's Mistral Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --mistral
```

### OctoAI's Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --octo
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
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --llama
```

## Transcription Options

Create a `.env` file and set API key as demonstrated in `.env.example` for `DEEPGRAM_API_KEY` or `ASSEMBLY_API_KEY`.

### Deepgram

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --deepgram
```

### Assembly

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --assembly
```

Include speaker labels and number of speakers:

```bash
npm run as -- --video "https://ajc.pics/audio/fsjam-short.mp3" --assembly --speaker-labels --speakers-expected 2
```

### Whisper.cpp

If neither the `--deepgram` or `--assembly` option is included for transcription, `autoshow` will default to running the largest Whisper.cpp model. To configure the size of the Whisper model, use the `--model` option and select one of the following:

```bash
# tiny model
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --whisper tiny

# base model
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --whisper base

# small model
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --whisper small

# medium model
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --whisper medium

# large-v2 model
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --whisper large
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
# npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --docker
```

## Alternative JavaScript Runtimes

### Bun

```bash
bun --env-file=.env src/autoshow.js \
  --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

### Deno

```bash
LLAMA_MODEL="Meta-Llama-3.1-8B-Instruct.Q2_K.gguf" HUGGING_FACE_URL="https://huggingface.co/mradermacher/Meta-Llama-3.1-8B-Instruct-GGUF" \
  deno run \
  --allow-sys \
  --allow-read \
  --allow-run \
  --allow-write \
  --allow-env \
  src/autoshow.js \
  --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```