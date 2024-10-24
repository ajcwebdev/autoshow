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
  - [Google's Gemini Models](#googles-gemini-models)
  - [Cohere's Command Models](#coheres-command-models)
  - [Mistral's Mistral Models](#mistrals-mistral-models)
  - [OctoAI's Models](#octoais-models)
  - [Llama.cpp](#llamacpp)
- [Transcription Options](#transcription-options)
  - [Whisper.cpp](#whispercpp)
  - [Deepgram](#deepgram)
  - [Assembly](#assembly)
- [Prompt Options](#prompt-options)
- [Alternative Runtimes](#alternative-runtimes)
  - [Docker Compose](#docker-compose)
  - [Deno](#deno)
  - [Bun](#bun)
- [Makeshift Test Suite](#makeshift-test-suite)
  - [Full Test Suite](#full-test-suite)
  - [Partial Test Command for Local Services](#partial-test-command-for-local-services)
- [Create Single Markdown File with Entire Project](#create-single-markdown-file-with-entire-project)

## Content and Feed Inputs

### Process Single Video URLs

Run on a single YouTube video.

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk"
```

### Process Multiple Videos in YouTube Playlist

Run on multiple YouTube videos in a playlist.

```bash
npm run as -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr"
```

Run on playlist URL and generate JSON info file with markdown metadata of each video in the playlist:

```bash
npm run as -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr" --info
```

### Process Multiple Videos Specified in a URLs File

Run on an arbitrary list of URLs in `example-urls.md`.

```bash
npm run as -- --urls "content/example-urls.md"
```

Run on URLs file and generate JSON info file with markdown metadata of each video:

```bash
npm run as -- --urls "content/example-urls.md" --info
```

### Process Single Audio or Video File

Run on `audio.mp3` on the `content` directory:

```bash
npm run as -- --file "content/audio.mp3"
```

### Process Podcast RSS Feed

Process RSS feed from newest to oldest (default behavior):

```bash
npm run as -- --rss "https://ajcwebdev.substack.com/feed"
```

Process a certain number of the most recent items, for example the last three episodes released on the feed:

```bash
npm run as -- \
  --rss "https://feeds.transistor.fm/fsjam-podcast/" \
  --last 3
```

Process RSS feed from oldest to newest:

```bash
npm run as -- \
  --rss "https://feeds.transistor.fm/fsjam-podcast/" \
  --order oldest
```

Start processing a different episode by selecting a number of episodes to skip:

```bash
npm run as -- \
  --rss "https://feeds.transistor.fm/fsjam-podcast/" \
  --skip 1
```

Process a single specific episode from a podcast RSS feed by providing the episode's audio URL with the `--item` option:

```bash
npm run as -- \
  --rss "https://ajcwebdev.substack.com/feed" \
  --item "https://api.substack.com/feed/podcast/36236609/fd1f1532d9842fe1178de1c920442541.mp3" \
  --whisper tiny \
  --llama \
  --prompt titles summary longChapters takeaways questions
```

Run on a podcast RSS feed and generate JSON info file with markdown metadata of each item:

```bash
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --info
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
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --chatgpt
```

Select ChatGPT model:

```bash
# Select GPT-4o mini model - https://platform.openai.com/docs/models/gpt-4o-mini
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --chatgpt GPT_4o_MINI

# Select GPT-4o model - https://platform.openai.com/docs/models/gpt-4o
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --chatgpt GPT_4o

# Select GPT-4 Turbo model - https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --chatgpt GPT_4_TURBO

# Select GPT-4 model - https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --chatgpt GPT_4
```

| Model        | Context Window | Max Output | Input Tokens | Output Tokens | Batch Input | Batch Output |
|--------------|----------------|------------|--------------|---------------|-------------|--------------|
| GPT-4o mini  | 128,000        | 16,384     | $0.15        | $0.60         | $0.075      | $0.30        |
| GPT-4o       | 128,000        | 4,096      | $5           | $15           | $2.50       | $7.50        |
| GPT-4 Turbo  | 128,000        | 4,096      | $10          | $30           | $5          | $15          |
| GPT-4        | 8,192          | 8,192      | $30          | $60           | $15         | $30          |

### Anthropic's Claude Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude
```

Select Claude model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude CLAUDE_3_5_SONNET
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude CLAUDE_3_OPUS
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude CLAUDE_3_SONNET
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude CLAUDE_3_HAIKU
```

### Google's Gemini Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --gemini
```

Select Gemini model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --gemini GEMINI_1_5_FLASH
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --gemini GEMINI_1_5_PRO
```

### Cohere's Command Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --cohere
```

Select Cohere model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --cohere COMMAND_R
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --cohere COMMAND_R_PLUS
```

### Mistral's Mistral Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --mistral
```

Select Mistral model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --mistral MIXTRAL_8x7b
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --mistral MIXTRAL_8x22b
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --mistral MISTRAL_LARGE
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --mistral MISTRAL_NEMO
```

### OctoAI's Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --octo
```

Select Octo model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --octo LLAMA_3_1_8B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --octo LLAMA_3_1_70B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --octo LLAMA_3_1_405B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --octo MISTRAL_7B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --octo MIXTRAL_8X_7B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --octo NOUS_HERMES_MIXTRAL_8X_7B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --octo WIZARD_2_8X_22B
```

### Fireworks

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --fireworks
```

Select Fireworks model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --fireworks LLAMA_3_1_405B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --fireworks LLAMA_3_1_70B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --fireworks LLAMA_3_1_8B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --fireworks LLAMA_3_2_3B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --fireworks LLAMA_3_2_1B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --fireworks QWEN_2_5_72B
```

### Together

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together
```

Select Together model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together LLAMA_3_2_3B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together LLAMA_3_1_405B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together LLAMA_3_1_70B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together LLAMA_3_1_8B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together GEMMA_2_27B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together GEMMA_2_9B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together QWEN_2_5_72B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together QWEN_2_5_7B
```

### Groq

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --groq
```

Select Groq model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --groq LLAMA_3_1_70B_VERSATILE
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --groq LLAMA_3_1_8B_INSTANT
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --groq LLAMA_3_2_1B_PREVIEW
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --groq LLAMA_3_2_3B_PREVIEW
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --groq MIXTRAL_8X7B_32768
```

### Llama.cpp

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --llama
```

Select Llama model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --llama GEMMA_2_2B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --llama LLAMA_3_2_1B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --llama PHI_3_5
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --llama QWEN_2_5_3B
```

### Ollama

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama
```

Select Ollama model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama LLAMA_3_2_1B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama LLAMA_3_2_3B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama GEMMA_2_2B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama PHI_3_5
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama QWEN_2_5_1B
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama QWEN_2_5_3B
```

## Transcription Options

### Whisper.cpp

If neither the `--deepgram` or `--assembly` option is included for transcription, `autoshow` will default to running the largest Whisper.cpp model. To configure the size of the Whisper model, use the `--model` option and select one of the following:

```bash
# tiny model
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper tiny

# base model
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper base

# small model
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper small

# medium model
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper medium

# large-v2 model
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper large-v2

# large-v3-turbo model
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper large-v3-turbo
```

Run `whisper.cpp` in a Docker container with `--whisperDocker`:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisperDocker base
```

### Whisper Python

Use the original [`openai/whisper`](https://github.com/openai/whisper) Python library with the newly released [`turbo`](https://github.com/openai/whisper/discussions/2363) model:

```bash
npm run as -- --file "content/audio.mp3" --whisperPython turbo
```

### Whisper Diarization

Use [`whisper-diarization`](https://github.com/MahmoudAshraf97/whisper-diarization) to provide speaker labels:

```bash
npm run as -- --file "content/audio.mp3" --whisperDiarization tiny
```

### Deepgram

Create a `.env` file and set API key as demonstrated in `.env.example` for `DEEPGRAM_API_KEY`.

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --deepgram
```

### Assembly

Create a `.env` file and set API key as demonstrated in `.env.example` for `ASSEMBLY_API_KEY`.

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --assembly
```

Include speaker labels and number of speakers:

```bash
npm run as -- --video "https://ajc.pics/audio/fsjam-short.mp3" --assembly --speakerLabels
```

## Prompt Options

Default includes summary and long chapters, equivalent to running this:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --prompt summary longChapters
```

Create five title ideas:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --prompt titles
```

Create a one sentence and one paragraph summary:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --prompt summary
```

Create a short, one sentence description for each chapter that's 25 words or shorter.

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --prompt shortChapters
```

Create a one paragraph description for each chapter that's around 50 words.

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --prompt mediumChapters
```

Create a two paragraph description for each chapter that's over 75 words.

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --prompt longChapters
```

Create three key takeaways about the content:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --prompt takeaways
```

Create ten questions about the content to check for comprehension:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --prompt questions
```

Include all prompt options:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --prompt titles summary longChapters takeaways questions
```

## Alternative Runtimes

### Docker Compose

This will start `whisper.cpp`, Ollama, and the AutoShow Commander CLI in their own Docker containers.

```bash
npm run docker-up
```

Replace `as` with `docker` to run most other commands explained in this document. Does not support all options at this time, notably `--llama`, `--whisperPython`, and `--whisperDiarization`.

```bash
npm run docker -- --video "https://www.youtube.com/watch?v=MORMZXEaONk"
npm run docker -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisperDocker tiny
```

Currently supports Ollama's official Docker image so the entire project can be encapsulated in one local Docker Compose file:

```bash
npm run docker -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisperDocker tiny --ollama
```

To reset your Docker images and containers, run:

```bash
npm run prune
```

### Bun

```bash
bun bun-as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk"
```

### Deno

```bash
deno task deno-as --video "https://www.youtube.com/watch?v=MORMZXEaONk"
```

## Makeshift Test Suite

Creating a robust and flexible test suite for this project is complex because of the range of network requests, file system operations, build steps, and 3rd party APIs involved. A more thought out test suite will be created at some point, but in the mean time these are hacky but functional ways to test the majority of the project in a single go.

### Full Test Suite

- You'll need API keys for all services to make it through this entire command.
- Mostly uses transcripts of videos around one minute long and cheaper models when possible, so the total cost of running this for any given service should be at most only a few cents.

```bash
npm run test-all
```

### Partial Test Command for Local Services

This version of the test suite only uses Whisper for transcription and Llama.cpp for LLM operations.

```bash
npm run test-local
```

## Create Single Markdown File with Entire Project

This can be a useful way of creating a single markdown file of the entire project for giving to an LLM as context to develop new features or debug code. I'll usually start a conversation by including this along with a prompt that explains what I want changed or added.

```bash
export MD="LLM.md" && export COMMANDS="src/commands" && export UTILS="src/utils" && \
  export LLMS="src/llms" && export TRANSCRIPT="src/transcription" && \
  export OPEN="\n\n\`\`\`js" && export CLOSE="\n\`\`\`\n\n" && cat README.md >> $MD && \
  echo '\n\n### Directory and File Structure\n\n```' >> $MD && tree >> $MD && \
  echo '```\n\n## Example CLI Commands Test Suite'$OPEN'' >> $MD && cat test/all.test.js >> $MD && \
  echo ''$CLOSE'## JSDoc Types'$OPEN'' >> $MD && cat src/types.js >> $MD && \
  echo ''$CLOSE'## AutoShow CLI Entry Point'$OPEN'' >> $MD && cat src/autoshow.js >> $MD && \
  echo ''$CLOSE'## Utility Functions\n\n### Generate Markdown'$OPEN'' >> $MD && cat $UTILS/generateMarkdown.js >> $MD && \
  echo ''$CLOSE'### Download Audio'$OPEN'' >> $MD && cat $UTILS/downloadAudio.js >> $MD && \
  echo ''$CLOSE'### Run Transcription'$OPEN'' >> $MD && cat $UTILS/runTranscription.js >> $MD && \
  echo ''$CLOSE'### Run LLM'$OPEN'' >> $MD && cat $UTILS/runLLM.js >> $MD && \
  echo ''$CLOSE'### Clean Up Files'$OPEN'' >> $MD && cat $UTILS/cleanUpFiles.js >> $MD && \
  echo ''$CLOSE'## Process Commands\n\n### Process Video'$OPEN'' >> $MD && cat $COMMANDS/processVideo.js >> $MD && \
  echo ''$CLOSE'### Process Playlist'$OPEN'' >> $MD && cat $COMMANDS/processPlaylist.js >> $MD && \
  echo ''$CLOSE'### Process URLs'$OPEN'' >> $MD && cat $COMMANDS/processURLs.js >> $MD && \
  echo ''$CLOSE'### Process RSS'$OPEN'' >> $MD && cat $COMMANDS/processRSS.js >> $MD && \
  echo ''$CLOSE'### Process File'$OPEN'' >> $MD && cat $COMMANDS/processFile.js >> $MD && \
  echo ''$CLOSE'## Transcription Functions\n\n### Call Whisper'$OPEN'' >> $MD && cat $TRANSCRIPT/whisper.js >> $MD && \
  echo ''$CLOSE'### Call Deepgram'$OPEN'' >> $MD && cat $TRANSCRIPT/deepgram.js >> $MD && \
  echo ''$CLOSE'### Call Assembly'$OPEN'' >> $MD && cat $TRANSCRIPT/assembly.js >> $MD && \
  echo ''$CLOSE'## LLM Functions\n\n### Prompt Function'$OPEN'' >> $MD && cat $LLMS/prompt.js >> $MD && \
  echo ''$CLOSE'### Call ChatGPT'$OPEN'' >> $MD && cat $LLMS/chatgpt.js >> $MD && \
  echo ''$CLOSE'### Call Claude'$OPEN'' >> $MD && cat $LLMS/claude.js >> $MD && \
  echo ''$CLOSE'### Call Cohere'$OPEN'' >> $MD && cat $LLMS/cohere.js >> $MD && \
  echo ''$CLOSE'### Call Gemini'$OPEN'' >> $MD && cat $LLMS/gemini.js >> $MD && \
  echo ''$CLOSE'### Call Llama.cpp'$OPEN'' >> $MD && cat $LLMS/llama.js >> $MD && \
  echo ''$CLOSE'### Call Ollama'$OPEN'' >> $MD && cat $LLMS/ollama.js >> $MD && \
  echo ''$CLOSE'### Call Mistral'$OPEN'' >> $MD && cat $LLMS/mistral.js >> $MD && \
  echo ''$CLOSE'### Call Octo'$OPEN'' >> $MD && cat $LLMS/octo.js >> $MD && \
  echo ''$CLOSE'## Docker Files\n\n```Dockerfile' >> $MD && cat .github/whisper.Dockerfile >> $MD && \
  echo ''$CLOSE'```Dockerfile' >> $MD && cat .github/llama.Dockerfile >> $MD && \
  echo ''$CLOSE'```Dockerfile' >> $MD && cat Dockerfile >> $MD && \
  echo ''$CLOSE'```yml' >> $MD && cat docker-compose.yml >> $MD && \
  echo ''$CLOSE'```bash' >> $MD && cat docker-entrypoint.sh >> $MD && \
  echo '\n```\n' >> $MD
```