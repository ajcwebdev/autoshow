# autogen

An example workflow for automatically creating a video transcript with show notes using ChatGPT and Whisper.

## Setup

Install `yt-dlp` and `ffmpeg`.

```bash
brew install yt-dlp ffmpeg
```

Run the following commands to clone `whisper.cpp` and build the `large-v2` model:

```bash
git clone https://github.com/ggerganov/whisper.cpp.git
bash ./whisper.cpp/models/download-ggml-model.sh large-v2
make -C whisper.cpp
```

## Run Autogen Script

```bash
# playlist with two short videos for testing
./scripts/autogen.sh "https://www.youtube.com/playlist?list=PLCVnrVv4KhXMh4DQBigyvHSRTf2CSj129"
```

```bash
# single video
./scripts/autogen_video.sh "https://www.youtube.com/watch?v=efioXgxMT6s"
```

```bash
# Run on arbitrary list of URLs
./scripts/autogen_urls.sh --urls-file content/urls.md
```