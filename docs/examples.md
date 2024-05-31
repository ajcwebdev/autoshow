# Example CLI Commands

## Outline

- [Content and Feed Inputs](#content-and-feed-inputs)
- [Transcription Options](#transcription-options)
  - [Deepgram](#deepgram)
  - [Assembly](#assembly)
  - [Whisper.cpp](#whispercpp)
- [Language Model (LLM) Options](#language-model-llm-options)
  - [OpenAI's ChatGPT Models](#openais-chatgpt-models)
  - [Anthropic's Claude Models](#anthropics-claude-models)
- [Run Autogen Bash Scripts](#run-autogen-bash-scripts)

## Content and Feed Inputs

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

## Transcription Options

Create a `.env` file and set API key as demonstrated in `.env.example` for `DEEPGRAM_API_KEY` or `ASSEMBLY_API_KEY`.

### Deepgram

```bash
node --env-file=.env autogen.js --deepgram --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

### Assembly

```bash
node --env-file=.env autogen.js --assembly --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

### Whisper.cpp

If neither the `--deepgram` or `--assembly` option is included for transcription, `autoshow` will default to running the largest Whisper.cpp model. To configure the size of the Whisper model, use the `--model` option and select one of the following:

- `base`
- `medium`
- `large`

```bash
node autogen.js --video "https://www.youtube.com/watch?v=jKB0EltG9Jo" --model base
```

> _Note: Make sure the model you select is the same model you built in the [Clone Whisper Repo](#clone-whisper-repo) step._

## Language Model (LLM) Options

Create a `.env` file and set API key as demonstrated in `.env.example` for `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`.

### OpenAI's ChatGPT Models

Feed prompt and transcript to ChatGPT models with OpenAI API

```bash
node --env-file=.env autogen.js --chatgpt --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

### Anthropic's Claude Models

Feed prompt and transcript to Claude models with Anthropic API.

```bash
node --env-file=.env autogen.js --claude --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

## Run Autogen Bash Scripts

```bash
# Run on a single YouTube video (short one minute video)
./autogen.sh --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"

# Run on a single YouTube video (longer 30 minute video)
./autogen.sh --video "https://www.youtube.com/watch?v=QhXc9rVLVUo"

# Run on a single audio file
./autogen.sh --audio "https://media.transistor.fm/d1d18d2d/449ace19.mp3"

# Run on multiple YouTube videos in a playlist
./autogen.sh --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXMh4DQBigyvHSRTf2CSj129"

# Run on an arbitrary list of URLs in `urls.md`
./autogen.sh --urls urls.md

# Run on a local video file
./autogen.sh --file content/video.mkv
```