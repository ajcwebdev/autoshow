<div align="center">
  <img alt="autoshow logo" src="https://ajc.pics/autoshow/autoshow-cover-01.webp" width="300" />
</div>

# Autoshow

An example workflow for automatically creating a video transcript with show notes using ChatGPT and Whisper.

## Outline

- [Project Structure](#project-structure)
- [Setup](#setup)
  - [Install Local Dependencies](#install-local-dependencies)
  - [Clone Whisper Repo](#clone-whisper-repo)
- [Run Autogen Node Scripts](#run-autogen-node-scripts)

See [`docs/roadmap.md`](/docs/roadmap.md) for details about current development work and future potential capabilities.

## Setup

### Install Local Dependencies

Install `yt-dlp`, `ffmpeg`, and run `npm i`.

```bash
brew install yt-dlp ffmpeg
npm i
```

### Clone Whisper Repo

Run the following commands to clone `whisper.cpp` and build the `large-v2` model:

```bash
git clone https://github.com/ggerganov/whisper.cpp.git
bash ./whisper.cpp/models/download-ggml-model.sh base
make -C whisper.cpp
```

> Replace `base` with `large-v2` for the largest model or `medium` for a middle sized model.

## Run Autogen Node Scripts

Run on a single YouTube video.

```bash
node autogen.js --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

Example commands for all available CLI options can be found in [`docs/examples.md`](/docs/examples.md).