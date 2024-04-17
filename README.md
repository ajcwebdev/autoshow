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
make large-v2
```

## Run Autogen Script

```bash
./scripts/autogen.sh "URL"
```
