# Example CLI Commands

## Outline

- [Content and Feed Inputs](#content-and-feed-inputs)
  - [Process Single Audio or Video File](#process-single-audio-or-video-file)
  - [Process Single Video URLs](#process-single-video-urls)
  - [Process Multiple Videos Specified in a URLs File](#process-multiple-videos-specified-in-a-urls-file)
  - [Process Multiple Videos in YouTube Playlist](#process-multiple-videos-in-youtube-playlist)
  - [Process All Videos from a YouTube Channel](#process-all-videos-from-a-youtube-channel)
  - [Process Podcast RSS Feed](#process-podcast-rss-feed)
- [Transcription Options](#transcription-options)
  - [Get Transcription Cost](#get-transcription-cost)
  - [Whisper](#whisper)
  - [Deepgram](#deepgram)
  - [Assembly](#assembly)
- [Language Model (LLM) Options](#language-model-llm-options)
  - [Run Only LLM Process Step](#run-only-llm-process-step)
  - [Get LLM Cost](#get-llm-cost)
  - [Ollama Local Models](#ollama-local-models)
  - [OpenAI ChatGPT Models](#openai-chatgpt-models)
  - [Anthropic Claude Models](#anthropic-claude-models)
  - [Google Gemini Models](#google-gemini-models)
  - [Cohere Command Models](#cohere-command-models)
  - [Mistral Models](#mistral-models)
  - [Fireworks Open Source Models](#fireworks-open-source-models)
  - [Together Open Source Models](#together-open-source-models)
  - [Groq Open Source Models](#groq-open-source-models)
- [Prompt Options](#prompt-options)
- [Test Suite](#test-suite)
- [Skip Cleanup of Intermediate Files](#skip-cleanup-of-intermediate-files)
- [Chat with Show Notes](#chat-with-show-notes)

## Content and Feed Inputs

### Process Single Audio or Video File

Run on `audio.mp3` on the `content` directory:

```bash
npm run as -- --file "content/audio.mp3"
```

### Process Single Video URLs

Run on a single YouTube video.

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk"
```

### Process Multiple Videos Specified in a URLs File

Run on an arbitrary list of URLs in `example-urls.md`.

```bash
npm run as -- --urls "content/example-urls.md"
```

Run on URLs file and generate JSON info file with markdown metadata of each video:

```bash
npm run as -- --info --urls "content/example-urls.md"
```

### Process Multiple Videos in YouTube Playlist

Run on multiple YouTube videos in a playlist.

```bash
npm run as -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr"
```

Run on playlist URL and generate JSON info file with markdown metadata of each video in the playlist:

```bash
npm run as -- --info --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr"
```

### Process All Videos from a YouTube Channel

Process all videos from a YouTube channel (both live and non-live):

```bash
npm run as -- --channel "https://www.youtube.com/@ajcwebdev"
```

Process videos starting from the oldest instead of newest:

```bash
npm run as -- \
  --channel "https://www.youtube.com/@ajcwebdev" \
  --order oldest
```

Skip a certain number of videos before beginning processing (starts from newest by default and can be used with `--order oldest`):

```bash
npm run as -- \
  --channel "https://www.youtube.com/@ajcwebdev" \
  --skip 1
```

Process a certain number of the most recent videos, for example the last three videos released on the channel:

```bash
npm run as -- \
  --channel "https://www.youtube.com/@ajcwebdev" \
  --last 3
```

Run on a YouTube channel and generate JSON info file with markdown metadata of each video:

```bash
npm run as -- --info --channel "https://www.youtube.com/@ajcwebdev"
```

#### Advanced Channel Example

Below is an example of running multiple flags at once on a **YouTube channel**:

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

Here’s what’s happening in this single command:

1. **Channel**: Processes videos from the provided channel URL (`@ajcwebdev`).
2. **Order**: Starts from the oldest videos in the channel rather than the most recent.
3. **Skip**: Skips the first 2 videos from that oldest-first sequence.
4. **Last**: Processes the next 5 videos (after skipping).
5. **Transcription**: Uses the `--whisper base` model to transcribe each video in a Docker container.
6. **LLM**: Uses OpenAI ChatGPT’s GPT-4 Turbo model (`--chatgpt GPT_4_TURBO`) to process the transcripts.
7. **Prompt**: Generates both a summary and short chapter descriptions (`--prompt summary shortChapters`).
8. **No Clean Up**: Keeps any intermediary or downloaded files around (`--saveAudio`) so you can inspect them after the run.

### Process Podcast RSS Feed

Process RSS feed from newest to oldest (default behavior):

```bash
npm run as -- --rss "https://ajcwebdev.substack.com/feed"
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

Process a certain number of the most recent items, for example the last three episodes released on the feed:

```bash
npm run as -- \
  --rss "https://feeds.transistor.fm/fsjam-podcast/" \
  --last 3
```

Process a single specific episode from a podcast RSS feed by providing the episode's audio URL with the `--item` option:

```bash
npm run as -- \
  --rss "https://ajcwebdev.substack.com/feed" \
  --item "https://api.substack.com/feed/podcast/36236609/fd1f1532d9842fe1178de1c920442541.mp3"
```

Run on a podcast RSS feed and generate JSON info file with markdown metadata of each item:

```bash
npm run as -- \
  --rss "https://ajcwebdev.substack.com/feed" \
  --info
```

Process multiple RSS feeds:

```bash
npm run as -- \
  --last 1 \
  --whisper tiny \
  --rss "https://ajcwebdev.substack.com/feed" \
  "https://feeds.transistor.fm/fsjam-podcast/"
```

Download episodes from a specific date:

```bash
npm run as -- \
  --rss "https://ajcwebdev.substack.com/feed" \
  --date 2021-05-10
```

Download episodes from multiple dates:

```bash
npm run as -- \
  --rss "https://ajcwebdev.substack.com/feed" \
  --date 2021-05-10 2022-05-10
```

Download episodes from multiple dates on multiple RSS feeds:

```bash
npm run as -- \
  --rss "https://ajcwebdev.substack.com/feed" \
  "https://feeds.transistor.fm/fsjam-podcast/" \
  --date 2021-05-10 2022-05-10
```

Download episodes from a specific number of previous days, for example to download episodes from the last 7 days:

```bash
npm run as -- \
  --rss "https://ajcwebdev.substack.com/feed" \
  --lastDays 7
```

#### Advanced RSS Example

Below is an example of running multiple steps in a single RSS process command. This one command will:

1. Download and parse the specified RSS feed.  
2. Skip the first 2 items in the feed.  
3. Transcribe the remaining episodes using AssemblyAI with speaker labels.  
4. Generate content summaries and long-form chapter notes using ChatGPT’s GPT-4 model.  
5. Leave all downloaded and intermediate files in place for further inspection.

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

- **Input**: Process an RSS feed
- **RSS**: Skip the first 2 items with `--skip 2`
- **Transcription**: Use AssemblyAI (`--assembly`) with speaker labels (`--speakerLabels`)
- **LLM**: Use ChatGPT’s GPT-4 model (`--chatgpt GPT_4`)
- **Prompt**: Request both a summary and long chapters
- **Utility**: Keep all intermediate files (`--saveAudio`)

## Transcription Options

### Get Transcription Cost

```bash
npm run as -- --transcriptCost "content/audio.mp3" --deepgram
npm run as -- --transcriptCost "content/audio.mp3" --assembly
```

### Whisper

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

### Deepgram

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --deepgram
```

Select model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --deepgram BASE
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --deepgram ENHANCED
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --deepgram NOVA_2
```

Include Deepgram API key directly in CLI command instead of in `.env` file:

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --deepgram \
  --deepgramApiKey ""
```

### Assembly

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --assembly
```

Select model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --assembly NANO
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --assembly BEST
```

Include speaker labels and number of speakers:

```bash
npm run as -- \
  --video "https://ajc.pics/audio/fsjam-short.mp3" \
  --assembly \
  --speakerLabels
```

Include Assembly API key directly in CLI command instead of in `.env` file:

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --assembly \
  --assemblyApiKey ""
```

## Language Model (LLM) Options

Create a `.env` file and set API key as demonstrated in `.env.example` for either:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `COHERE_API_KEY`
- `MISTRAL_API_KEY`
- `TOGETHER_API_KEY`
- `FIREWORKS_API_KEY`
- `GROQ_API_KEY`

For each model available for each provider, I have collected the following details:

- Context Window, the limit of tokens a model can process at once.
- Max Output, the upper limit of tokens a model can generate in a response, influencing response length and detail.
- Cost of input and output tokens per million tokens.
  - Some model providers also offer a Batch API with input/output tokens at half the price.

### Run Only LLM Process Step

```bash
npm run as -- --runLLM "content/audio-prompt.md" --chatgpt
```

### Get LLM Cost

```bash
npm run as -- --llmCost "content/audio-prompt.md" --chatgpt
npm run as -- --llmCost "content/audio-prompt.md" --claude
```

### Ollama Local Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama
```

Select Ollama model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama deepseek-r1:1.5b
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama qwen2.5:0.5b
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama qwen2.5:1.5b
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama qwen2.5:3b
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama llama3.2:1b
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama llama3.2:3b
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama gemma2:2b
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama phi3.5:3.8b
```

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

# Select o1_MINI model - https://platform.openai.com/docs/models/#o1
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --chatgpt o1_MINI
```

Include OpenAI API key directly in CLI command instead of in `.env` file:

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --chatgpt \
  --openaiApiKey ""
```

### Anthropic Claude Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude
```

Select Claude model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude CLAUDE_3_5_SONNET
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude CLAUDE_3_5_HAIKU
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude CLAUDE_3_OPUS
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude CLAUDE_3_SONNET
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude CLAUDE_3_HAIKU
```

Include Anthropic API key directly in CLI command instead of in `.env` file:

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --claude \
  --anthropicApiKey ""
```

### Google Gemini Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --gemini
```

Select Gemini model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --gemini GEMINI_1_5_FLASH
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --gemini GEMINI_1_5_PRO
```

Include Gemini API key directly in CLI command instead of in `.env` file:

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --gemini \
  --geminiApiKey ""
```

### Cohere Command Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --cohere
```

Select Cohere model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --cohere COMMAND_R
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --cohere COMMAND_R_PLUS
```

Include Cohere API key directly in CLI command instead of in `.env` file:

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --cohere \
  --cohereApiKey ""
```

### Mistral Models

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

Include Mistral API key directly in CLI command instead of in `.env` file:

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --mistral \
  --mistralApiKey ""
```

### Fireworks Open Source Models

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

Include Fireworks API key directly in CLI command instead of in `.env` file:

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --fireworks \
  --fireworksApiKey ""
```

### Together Open Source Models

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

Include Together API key directly in CLI command instead of in `.env` file:

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --together \
  --togetherApiKey ""
```

### Groq Open Source Models

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

Include Groq API key directly in CLI command instead of in `.env` file:

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --groq \
  --groqApiKey ""
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

### Print Select Prompts without Process Commands

```bash
npm run as -- --printPrompt summary longChapters
```

### Write a Custom Prompt

```bash
npm run as -- --file "content/audio.mp3" --customPrompt "content/custom-prompt.md" --chatgpt
```

## Test Suite

Integration test.

- You'll need API keys for all services to make it through this entire command.
- Mostly uses transcripts of videos around one minute long and cheaper models when possible, so the total cost of running this for any given service should be at most only a few cents.

```bash
npm run test-services
```

Local services test, only uses Whisper for transcription and Ollama for LLM operations.

```bash
npm run test-local
```

Docker test, also uses Whisper for transcription and Ollama for LLM operations but in Docker containers.

```bash
npm run test-docker
```

Benchmark tests, each compare different size models for `whisper.cpp` and a Dockerized version.

```bash
npx tsx --test test/bench/tiny.test.ts
npx tsx --test test/bench/base.test.ts
npx tsx --test test/bench/small.test.ts
npx tsx --test test/bench/medium.test.ts
npx tsx --test test/bench/large.test.ts
npx tsx --test test/bench/turbo.test.ts
```

Test all available models for a certain LLM service.

```bash
npx tsx --test test/models/chatgpt.test.ts
npx tsx --test test/models/claude.test.ts
npx tsx --test test/models/cohere.test.ts
npx tsx --test test/models/gemini.test.ts
npx tsx --test test/models/mistral.test.ts
npx tsx --test test/models/fireworks.test.ts
npx tsx --test test/models/together.test.ts
npx tsx --test test/models/groq.test.ts
```

Test all available models for a certain transcription service.

```bash
npx tsx --test test/models/deepgram.test.ts
npx tsx --test test/models/assembly.test.ts
```

## Skip Cleanup of Intermediate Files

If you want to keep the downloaded audio file for debugging or reprocessing purposes, use `--saveAudio`. This prevents the CLI from deleting WAV files after finishing its run.

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --saveAudio
```

## Chat with Show Notes

***Note: Very rough prototype for upcoming "chat with your show notes" feature using OpenAI and Claude embeddings.***

*Not currently integrated into the CLI, backend server, or frontend and only supports OpenAI.*

```bash
node create-embeddings-and-sqlite.js <directory> <outputJSON> [dbFile]
```

```bash
OPENAI_API_KEY="" node scripts/create-embeddings-and-sqlite.js content embeddings.json embeddings.db
OPENAI_API_KEY="" node scripts/read-and-query-embeddings.js "What's the deal with these show notes? Answer in the voice of Jerry Seinfeld."
```