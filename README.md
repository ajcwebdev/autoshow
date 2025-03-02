<div align="center">
  <h1>AutoShow</h1>
  <img alt="autoshow logo" src="https://ajc.pics/autoshow/autoshow-cover-01.webp" width="300" />
</div>

## Outline

- [Project Overview](#project-overview)
  - [Prompts and Content Formats](#prompts-and-content-formats)
  - [Key Features](#key-features)
  - [AutoShow Pipeline](#autoshow-pipeline)
- [Setup](#setup)
- [Run AutoShow Node Scripts](#run-autoshow-node-scripts)
- [Project Structure](#project-structure)
  - [Root Level Configuration](#root-level-configuration)
  - [Node CLI and Server Backend](#node-cli-and-server-backend)
  - [Process Commands and Process Steps](#process-commands-and-process-steps)
  - [Transcription and LLM Services](#transcription-and-llm-services)
  - [Utility Files](#utility-files)
  - [Astro Web Frontend](#astro-web-frontend)
- [Contributors](#contributors)

## Project Overview

AutoShow automates the processing of audio and video content from various sources, including YouTube videos, playlists, podcast RSS feeds, and local media files. It leverages advanced transcription services and language models (LLMs) to perform transcription, summarization, and chapter generation.

### Prompts and Content Formats

AutoShow can generate diverse content formats including:

- **Summaries and Chapters:**
  - Concise summaries
  - Detailed chapter descriptions
  - Bullet-point summaries
  - Chapter titles with timestamps
- **Social Media Posts:**
  - X (Twitter)
  - Facebook
  - LinkedIn
- **Creative Content:**
  - Rap songs
  - Rock songs
  - Country songs
- **Educational and Informative Content:**
  - Key takeaways
  - Comprehension questions
  - Frequently asked questions (FAQs)
  - Curated quotes
  - Blog outlines and drafts

### Key Features

- Support for multiple input types (YouTube links, RSS feeds, local video and audio files)
- Integration with various:
  - LLMs (ChatGPT, Claude, Gemini, Deepseek, Fireworks, Together)
  - Transcription services (Whisper.cpp, Deepgram, Assembly)
- Local LLM support with Ollama
- Customizable prompts for generating titles, summaries, chapter titles/descriptions, key takeaways, and questions to test comprehension
- Markdown output with metadata and formatted content

### AutoShow Pipeline

The AutoShow workflow includes the following steps that feed sequentially into each other:

1. The user provides a content input (video URL, playlist, RSS feed, or local file) and front matter is created based on the content's metadata.
2. The audio is downloaded (if necessary).
3. Transcription is performed using the selected transcription service.
4. A customizable prompt is inserted containing instructions for the show notes or other content forms.
5. The transcript is processed by the selected LLM service to generate the desired output based on the selected prompts.

## Setup

`scripts/setup.sh` checks to ensure a `.env` file exists, Node dependencies are installed, and the `whisper.cpp` repository is cloned and built. Run the script with the `setup` script in `package.json`.

```bash
npm run setup
```

## Run AutoShow Node Scripts

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
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --chatgpt gpt-4o-mini
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude CLAUDE_3_5_SONNET
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --gemini GEMINI_1_5_PRO
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --fireworks
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together
```

Example commands for all available CLI options can be found in [`docs/examples.md`](/docs/examples.md).

## Project Structure

### Root Level Configuration

- Root-Level Files
  - `tsconfig.json`: TypeScript configuration file specifying compiler options.
  - `railway.json`: Configuration for Railway deployment.
  - `package.json`: Contains project dependencies, scripts, and metadata.
  - `.env.example`: Example environment variables file for configuration.
  - `.dockerignore`: Specifies files/folders ignored by Docker during builds.
- Database Schema (`prisma`)
  - `prisma/schema.prisma`: Defines the Prisma ORM schema for database structure and models.
- Shared Resources (`shared`)
  - `shared/constants.ts`: Globally shared constants across multiple modules.
- GitHub Setup and Docker Configuration (`.github`)
  - `postgres-pgvector.Dockerfile`: Dockerfile for PostgreSQL with PGVector extension.
  - `Dockerfile`: Main Dockerfile for containerizing the application.
  - `docker-compose.yml`: Docker Compose configuration for local development.
- Setup Scripts (`.github/setup`):
  - `00-cleanup.sh`: Cleans previous build or setup environments.
  - `01-npm-and-env-vars.sh`: Installs npm packages and sets environment variables.
  - `02-homebrew.sh`: Installs dependencies using Homebrew.
  - `03-ollama.sh`: Installs and configures Ollama.
  - `04-whisper.sh`: Installs and configures Whisper transcription service.
  - `setup.sh`: Master script executing all setup scripts sequentially.

### Node CLI and Server Backend

- Main Entry Points (`src`)
  - `commander.ts`: CLI setup using Commander.js.
  - `db.ts`: Initializes the database connection via Prisma.
  - `fastify.ts`: Sets up and configures the Fastify web server.

### Process Commands and Process Steps

- Process Commands (`src/process-commands`)
  - `file.ts`: Processes local audio/video files.
  - `video.ts`: Processes single YouTube videos.
  - `urls.ts`: Processes videos listed in a URL file.
  - `playlist.ts`: Processes YouTube playlists.
  - `channel.ts`: Processes all videos from YouTube channels.
  - `rss.ts`: Processes podcast RSS feeds.
- Process Steps (`src/process-steps`)
  - `01-generate-markdown.ts`: Creates initial markdown file with metadata.
  - `02-download-audio.ts`: Downloads audio from YouTube videos.
  - `03-run-transcription.ts`: Manages transcription processes.
  - `04-select-prompt.ts`: Defines prompts for summarization and chapter creation.
  - `05-run-llm.ts`: Runs language model processes based on prompts.

### Transcription and LLM Services

- Transcription Services (`src/transcription`)
  - `whisper.ts`: Implements transcription with Whisper.cpp.
  - `deepgram.ts`: Integration with Deepgram API for transcription.
  - `assembly.ts`: Integration with AssemblyAI API for transcription.
- Language Models (`src/llms`)
  - `ollama.ts`: Integration with local Ollama models.
  - `chatgpt.ts`: Integration with OpenAI's GPT models.
  - `claude.ts`: Integration with Anthropic's Claude models.
  - `gemini.ts`: Integration with Google's Gemini models.
  - `fireworks.ts`: Integration with Fireworks open-source models.
  - `together.ts`: Integration with Together open-source models.
  - `deepseek.ts`: Integration with DeepSeek AI models.

### Utility Files

- Utility Files (`src/utils`)
  - `create-clips.ts`: Utility to create video/audio clips.
  - `logging.ts`: Reusable logging utilities using Chalk for colorized output.
  - `types.ts`: Commonly used TypeScript types.
- Command-specific Utilities (`src/utils/command-utils`)
  - `channel-utils.ts`: Helpers specific to YouTube channel processing.
  - `rss-utils.ts`: Helpers for RSS feed processing.
- Embeddings Utilities (`src/utils/embeddings`)
  - `create-embed.ts`: Functions for creating embeddings.
  - `query-embed.ts`: Functions for querying embeddings.
- Image Generation Utilities (`src/utils/images`)
  - `black-forest-labs-generator.ts`: Integration for image generation with Black Forest Labs.
  - `dalle-generator.ts`: Integration for OpenAI's DALL·E image generation.
  - `stability-ai-generator.ts`: Integration for Stability AI image generation.
  - `combined-generator.ts`: Combines multiple image generators.
  - `utils.ts`: Common image-related helper functions.
  - `index.ts`: Centralized exports for image utilities.
- Step-specific Utilities (`src/utils/step-utils`)
  - `01-markdown-utils.ts`: Helpers for markdown generation step.
  - `02-save-audio.ts`: Helpers for saving downloaded audio.
  - `03-transcription-utils.ts`: Helpers for managing transcription outputs.
  - `04-prompts.ts`: Helpers for managing and selecting prompts.
  - `05-llm-utils.ts`: Helpers for interacting with language models.
- Validation Utilities (`src/utils/validation`)
  - `cli.ts`: CLI options validation and error handling.
  - `requests.ts`: Validation for incoming API requests.
  - `retry.ts`: Utility functions for retry logic and error handling.

### Astro Web Frontend

- Web Frontend Configuration Files (`web` Module):
  - `astro.config.ts`: Configuration for Astro web application.
  - `package.json`: Dependencies and scripts for web frontend.
  - `tsconfig.json`: TypeScript configuration for web module.
- Web Source Files (`web/src`):
  - `env.d.ts`: Type declarations for environment variables.
  - `site.config.ts`: Site-specific configuration settings.
  - `types.ts`: Shared TypeScript types.
  - `styles/global.css`: Global CSS styles.
- Pages (`web/src/pages`):
  - `index.astro`: Homepage.
  - `404.astro`: 404 error page.
  - `show-notes/[id].astro`: Dynamic pages for individual show notes.
- Layouts (`web/src/layouts`):
  - `Base.astro`: Base layout used across pages.
- Components (`web/src/components`):
  - `BaseHead.astro`: Common HTML head elements.
- App Components (`web/src/components/app`):
  - `App.tsx`
  - `Form.tsx`
  - `ShowNote.tsx`
  - `ShowNotes.tsx`
- Grouped Components (`web/src/components/app/groups`):
  - `LLMService.tsx`
  - `ProcessType.tsx`
  - `Prompts.tsx`
  - `TranscriptionService.tsx`

## Contributors

- ✨Hello beautiful human! ✨[Jenn Junod](https://jennjunod.dev/) host of [Teach Jenn Tech](https://teachjenntech.com/) & [Shit2TalkAbout](https://shit2talkabout.com)
