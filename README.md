<div align="center">
  <h1>Autoshow</h1>
  <img alt="autoshow logo" src="https://ajc.pics/autoshow/autoshow-cover-01.webp" width="300" />
</div>

## Outline

- [Project Overview](#project-overview)
  - [Key Features](#key-features)
- [Setup](#setup)
- [Run Autoshow Node Scripts](#run-autoshow-node-scripts)
- [Project Structure](#project-structure)
- [Contributors](#contributors)

## Project Overview

Autoshow automates the processing of audio and video content from various sources, including YouTube videos, playlists, podcast RSS feeds, and local media files. It performs transcription, summarization, and chapter generation using different language models (LLMs) and transcription services.

The Autoshow workflow includes the following steps:

1. The user provides input (video URL, playlist, RSS feed, or local file).
2. The system downloads the audio (if necessary).
3. Transcription is performed using the selected service.
4. The transcript is processed by the chosen LLM to generate a summary and chapters.
5. Results are saved in markdown format with front matter.

### Key Features

- Support for multiple input types (YouTube links, RSS feeds, local video and audio files)
- Integration with various:
  - LLMs (ChatGPT, Claude, Gemini, Cohere, Mistral, Fireworks, Together, Groq)
  - Transcription services (Whisper.cpp, Deepgram, Assembly)
- Local LLM support with Ollama
- Customizable prompts for generating titles, summaries, chapter titles/descriptions, key takeaways, and questions to test comprehension
- Markdown output with metadata and formatted content
- Command-line interface for easy usage
- *WIP: Node.js server and React frontend*

See [`docs/roadmap.md`](/docs/roadmap.md) for details about current development work and future potential capabilities.

## Setup

`scripts/setup.sh` checks to ensure a `.env` file exists, Node dependencies are installed, and the `whisper.cpp` repository is cloned and built. Run the script with the `setup` script in `package.json`.

```bash
npm run setup
```

## Run Autoshow Node Scripts

Run on a single YouTube video.

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk"
```

Run on a YouTube playlist.

```bash
npm run as -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr"
```

Run on a list of arbitrary URLs.

```bash
npm run as -- --urls "content/example-urls.md"
```

Run on a local audio or video file.

```bash
npm run as -- --file "content/audio.mp3"
```

Run on a podcast RSS feed.

```bash
npm run as -- --rss "https://ajcwebdev.substack.com/feed"
```

Use local LLM.

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama
```

Use 3rd party LLM providers.

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --chatgpt GPT_4o_MINI
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude CLAUDE_3_5_SONNET
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --gemini GEMINI_1_5_PRO
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --cohere COMMAND_R_PLUS
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --mistral MISTRAL_LARGE
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --fireworks
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --groq
```

Example commands for all available CLI options can be found in [`docs/examples.md`](/docs/examples.md).

## Project Structure

- Main Entry Point (`src/autoshow.ts`)
  - Defines the command-line interface using Commander.js
  - Handles various input options (video, playlist, URLs, file, RSS)
  - Manages LLM and transcription options

- Command Processors (`src/commands`)
  - `processVideo.ts`: Handles single YouTube video processing
  - `processPlaylist.ts`: Processes all videos in a YouTube playlist
  - `processURLs.ts`: Processes videos from a list of URLs in a file
  - `processFile.ts`: Handles local audio/video file processing
  - `processRSS.ts`: Processes podcast RSS feeds

- Utility Functions (`src/utils`)
  - `downloadAudio.ts`: Downloads audio from YouTube videos
  - `runTranscription.ts`: Manages the transcription process
  - `runLLM.ts`: Handles LLM processing for summarization and chapter generation
  - `generateMarkdown.ts`: Creates initial markdown files with metadata
  - `cleanUpFiles.ts`: Removes temporary files after processing

- Transcription Services (`src/transcription`)
  - `whisper.ts`: Uses Whisper.cpp, openai-whisper, or whisper-diarization for transcription
  - `deepgram.ts`: Integrates Deepgram transcription service
  - `assembly.ts`: Integrates AssemblyAI transcription service

- Language Models (`src/llms`)
  - `chatgpt.ts`: Integrates OpenAI's GPT models
  - `claude.ts`: Integrates Anthropic's Claude models
  - `gemini.ts`: Integrates Google's Gemini models
  - `cohere.ts`: Integrates Cohere's language models
  - `mistral.ts`: Integrates Mistral AI's language models
  - `fireworks.ts`: Integrates Fireworks's open source models
  - `together.ts`: Integrates Together's open source models
  - `groq.ts`: Integrates Groq's open source models
  - `prompt.ts`: Defines the prompt structure for summarization and chapter generation

- Web Interface (`web`) and Server (`server`)
  - Web interface built with React and Vite
  - Node.js server that handles backend operations for the web interface
  - *Note: Just a proof of concept, very little functionality built at this point. Expect these to catch up with the CLI starting in Q4 2024*

## Contributors

- ✨Hello beautiful human! ✨[Jenn Junod](https://jennjunod.dev/) host of [Teach Jenn Tech](https://teachjenntech.com/)
