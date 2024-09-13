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

Select Claude model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --claude CLAUDE_3_5_SONNET
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --claude CLAUDE_3_OPUS
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --claude CLAUDE_3_SONNET
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --claude CLAUDE_3_HAIKU
```

### Gemini Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --gemini
```

Select Gemini model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --gemini GEMINI_1_5_FLASH
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --gemini GEMINI_1_5_PRO
```

### Cohere's Command Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --cohere
```

Select Cohere model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --cohere COMMAND_R
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --cohere COMMAND_R_PLUS
```

### Mistral's Mistral Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --mistral
```

Select Mistral model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --mistral MIXTRAL_8x7b
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --mistral MIXTRAL_8x22b
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --mistral MISTRAL_LARGE
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --mistral MISTRAL_NEMO
```

### OctoAI's Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --octo
```

Select Octo model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --octo LLAMA_3_1_8B
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --octo LLAMA_3_1_70B
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --octo LLAMA_3_1_405B
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --octo MISTRAL_7B
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --octo MIXTRAL_8X_7B
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --octo NOUS_HERMES_MIXTRAL_8X_7B
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --octo WIZARD_2_8X_22B
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
cp whisper.Dockerfile whisper.cpp
mv whisper.cpp/whisper.Dockerfile whisper.cpp/Dockerfile
docker-compose up --build -d
docker-compose run autoshow --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

## Prompt Options

Default includes summary and long chapters, equivalent to running this:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --prompt summary longChapters
```

Create five title ideas:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --prompt titles
```

Create a one sentence and one paragraph summary:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --prompt summary
```

Create a short, one sentence description for each chapter that's 25 words or shorter.

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --prompt shortChapters
```

Create a one paragraph description for each chapter that's around 50 words.

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --prompt mediumChapters
```

Create a two paragraph description for each chapter that's over 75 words.

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --prompt longChapters
```

Create three key takeaways about the content:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --prompt takeaways
```

Create ten questions about the content to check for comprehension:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --prompt questions
```

Include all prompt options:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --prompt titles summary longChapters takeaways questions
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

## Makeshift Test Suite

Creating a robust and flexible test suite for this project is complex because of the range of network requests, file system operations, build steps, and 3rd party APIs involved.

A more thought out test suite will be created at some point, but in the mean time this is a ridiculous and hacky way to test the majority of the project in a single go.

- You'll need API keys for all services to make it through this entire command.
- Mostly uses transcripts of videos around one minute long and cheaper models when possible, so the total cost of running this for any given service should be at most only a few cents.

```bash
npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-prompt.md content/01---2023-09-10-teach-jenn-tech-channel-trailer-prompt.md && \
  npm run as -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXMh4DQBigyvHSRTf2CSj129" && \
  mv content/2022-11-05-intro-to-teach-jenn-tech-prompt.md content/02---2022-11-05-intro-to-teach-jenn-tech-prompt.md && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-prompt.md content/03---2023-09-10-teach-jenn-tech-channel-trailer-prompt.md && \
  npm run as -- --urls "content/urls.md" && \
  mv content/2022-11-05-intro-to-teach-jenn-tech-prompt.md content/04---2022-11-05-intro-to-teach-jenn-tech-prompt.md && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-prompt.md content/05---2023-09-10-teach-jenn-tech-channel-trailer-prompt.md && \
  curl -L https://ajc.pics/audio/fsjam-short.mp3 -o ./content/audio.mp3 && \
  npm run as -- --file "content/audio.mp3" && \
  mv content/audio.mp3-prompt.md content/06---audio.mp3-prompt.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --chatgpt && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-chatgpt-shownotes.md content/07---2023-09-10-teach-jenn-tech-channel-trailer-chatgpt-shownotes.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --chatgpt GPT_4o_MINI && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-chatgpt-shownotes.md content/08---2023-09-10-teach-jenn-tech-channel-trailer-chatgpt-shownotes.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --claude && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-claude-shownotes.md content/09---2023-09-10-teach-jenn-tech-channel-trailer-claude-shownotes.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --claude CLAUDE_3_SONNET && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-claude-shownotes.md content/10---2023-09-10-teach-jenn-tech-channel-trailer-claude-shownotes.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --gemini && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-gemini-shownotes.md content/11---2023-09-10-teach-jenn-tech-channel-trailer-gemini-shownotes.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --gemini GEMINI_1_5_FLASH && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-gemini-shownotes.md content/12---2023-09-10-teach-jenn-tech-channel-trailer-gemini-shownotes.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --cohere && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-cohere-shownotes.md content/13---2023-09-10-teach-jenn-tech-channel-trailer-cohere-shownotes.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --cohere COMMAND_R_PLUS && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-cohere-shownotes.md content/14---2023-09-10-teach-jenn-tech-channel-trailer-cohere-shownotes.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --mistral && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-mistral-shownotes.md content/15---2023-09-10-teach-jenn-tech-channel-trailer-mistral-shownotes.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --mistral MIXTRAL_8x7b && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-mistral-shownotes.md content/16---2023-09-10-teach-jenn-tech-channel-trailer-mistral-shownotes.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --octo && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-octo-shownotes.md content/17---2023-09-10-teach-jenn-tech-channel-trailer-octo-shownotes.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --octo LLAMA_3_1_8B && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-octo-shownotes.md content/18---2023-09-10-teach-jenn-tech-channel-trailer-octo-shownotes.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --llama && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-llama-shownotes.md content/19---2023-09-10-teach-jenn-tech-channel-trailer-llama-shownotes.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --deepgram && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-prompt.md content/20---2023-09-10-teach-jenn-tech-channel-trailer-prompt.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --deepgram --llama && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-llama-shownotes.md content/21---2023-09-10-teach-jenn-tech-channel-trailer-llama-shownotes.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --assembly && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-prompt.md content/22---2023-09-10-teach-jenn-tech-channel-trailer-prompt.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --assembly --llama && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-llama-shownotes.md content/23---2023-09-10-teach-jenn-tech-channel-trailer-llama-shownotes.md && \
  npm run as -- --video "https://ajc.pics/audio/fsjam-short.mp3" --assembly --speaker-labels --speakers-expected 2 && \
  mv content/2024-05-08-fsjam-short-prompt.md content/24---2024-05-08-fsjam-short-prompt.md && \
  npm run as -- --video "https://ajc.pics/audio/fsjam-short.mp3" --assembly --speaker-labels --speakers-expected 2 --llama && \
  mv content/2024-05-08-fsjam-short-llama-shownotes.md content/25---2024-05-08-fsjam-short-llama-shownotes.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --whisper tiny && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-prompt.md content/26---2023-09-10-teach-jenn-tech-channel-trailer-prompt.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --prompt titles && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-prompt.md content/27---2023-09-10-teach-jenn-tech-channel-trailer-prompt.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --prompt titles summary shortChapters mediumChapters longChapters takeaways questions && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-prompt.md content/28---2023-09-10-teach-jenn-tech-channel-trailer-prompt.md && \
  npm run as -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --prompt titles summary shortChapters takeaways questions --whisper tiny --llama && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-llama-shownotes.md content/29---2023-09-10-teach-jenn-tech-channel-trailer-llama-shownotes.md && \
  npm run as -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXMh4DQBigyvHSRTf2CSj129" --prompt titles --whisper tiny --llama && \
  mv content/2022-11-05-intro-to-teach-jenn-tech-llama-shownotes.md content/30---2022-11-05-intro-to-teach-jenn-tech-llama-shownotes.md && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-llama-shownotes.md content/31---2023-09-10-teach-jenn-tech-channel-trailer-llama-shownotes.md && \
  npm run as -- --urls "content/urls.md" --prompt titles --whisper tiny --llama && \
  mv content/2022-11-05-intro-to-teach-jenn-tech-llama-shownotes.md content/32---2022-11-05-intro-to-teach-jenn-tech-llama-shownotes.md && \
  mv content/2023-09-10-teach-jenn-tech-channel-trailer-llama-shownotes.md content/33---2023-09-10-teach-jenn-tech-channel-trailer-llama-shownotes.md && \
  npm run as -- --file "content/audio.mp3" --prompt titles --whisper tiny --llama && \
  mv content/audio.mp3-llama-shownotes.md content/34---audio.mp3-llama-shownotes.md && \
  npm run as -- --rss "https://ajcwebdev.substack.com/feed" && \
  mv content/2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md content/35---2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md && \
  npm run as -- --rss "https://feeds.transistor.fm/fsjam-podcast/" --order newest --skip 94 --whisper tiny && \
  mv content/2020-10-27-episode-0-the-fullstack-jamstack-podcast-with-anthony-campolo-and-christopher-burns-prompt.md content/36---2020-10-27-episode-0-the-fullstack-jamstack-podcast-with-anthony-campolo-and-christopher-burns-prompt.md && \
  npm run as -- --rss "https://feeds.transistor.fm/fsjam-podcast/" --order oldest --skip 94 --whisper tiny && \
  mv content/2023-06-28-episode-94-clerk-with-james-perkins-prompt.md content/37---2023-06-28-episode-94-clerk-with-james-perkins-prompt.md
```

## Create Single Markdown File with Entire Project

This can be a useful way of creating a single markdown file of the entire project for giving to an LLM as context to develop new features or debug code. I'll usually start a conversation by including this along with a prompt that explains what I want changed or added.

```bash
cat README.md >> LLM.md && \
  echo '\n\n```js' >> LLM.md && \
  cat src/autoshow.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '## Utility Functions\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/utils/cleanUpFiles.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/utils/downloadAudio.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/utils/generateMarkdown.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/utils/runLLM.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/utils/runTranscription.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '## Transcription Functions\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/transcription/whisper.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/transcription/deepgram.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/transcription/assembly.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '## LLM Functions\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/llms/prompt.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/llms/chatgpt.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/llms/claude.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/llms/cohere.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/llms/gemini.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/llms/llama.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/llms/mistral.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/llms/octo.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '## Process Commands\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/commands/processVideo.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/commands/processURLs.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/commands/processRSS.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/commands/processPlaylist.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```js' >> LLM.md && \
  cat src/commands/processFile.js >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '## Docker Files\n' >> LLM.md && \
  echo '```Dockerfile' >> LLM.md && \
  cat whisper.Dockerfile >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```Dockerfile' >> LLM.md && \
  cat llama.Dockerfile >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```Dockerfile' >> LLM.md && \
  cat Dockerfile >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```yml' >> LLM.md && \
  cat docker-compose.yml >> LLM.md && \
  echo '\n```\n' >> LLM.md && \
  echo '```bash' >> LLM.md && \
  cat docker-entrypoint.sh >> LLM.md && \
  echo '\n```\n' >> LLM.md
```