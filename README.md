# autogen

An example workflow for automatically creating a video transcript with show notes using ChatGPT and Whisper.

## Setup

### Install Local Dependencies

Install `yt-dlp` and `ffmpeg`.

```bash
brew install yt-dlp ffmpeg
```

### Clone Whisper.cpp Repo

Run the following commands to clone `whisper.cpp` and build the `large-v2` model:

```bash
git clone https://github.com/ggerganov/whisper.cpp.git
bash ./whisper.cpp/models/download-ggml-model.sh large-v2
make -C whisper.cpp
```

## Run Autogen Script

Run on a single YouTube video.

```bash
./scripts/autogen.sh --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

Run on multiple YouTube videos in a playlist.

```bash
./scripts/autogen.sh --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXMh4DQBigyvHSRTf2CSj129"
```

Run on an arbitrary list of URLs in `content/urls.md`.

```bash
./scripts/autogen.sh --urls content/urls.md
```