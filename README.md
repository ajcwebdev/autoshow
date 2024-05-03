# autoshow

An example workflow for automatically creating a video transcript with show notes using ChatGPT and Whisper.

## Setup

### Install Local Dependencies

Install `yt-dlp`, `ffmpeg`, and run `npm i`.

```bash
brew install yt-dlp ffmpeg
npm i
```

### Clone Whisper.cpp Repo

Run the following commands to clone `whisper.cpp` and build the `large-v2` model:

```bash
git clone https://github.com/ggerganov/whisper.cpp.git
bash ./whisper.cpp/models/download-ggml-model.sh large-v2
make -C whisper.cpp
```

## Run Autogen Bash Scripts

Run on a single YouTube video.

```bash
# short one minute video
./autogen.sh --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"

# longer 30 minute video
./autogen.sh --video "https://www.youtube.com/watch?v=QhXc9rVLVUo"
```

Run on multiple YouTube videos in a playlist.

```bash
./autogen.sh --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXMh4DQBigyvHSRTf2CSj129"
```

Run on an arbitrary list of URLs in `urls.md`.

```bash
./autogen.sh --urls urls.md
```

## Run Autogen Node Scripts

Run on a single YouTube video.

```bash
node autogen.js video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

Run on multiple YouTube videos in a playlist.

```bash
node autogen.js playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXMh4DQBigyvHSRTf2CSj129"
```

Run on an arbitrary list of URLs in `urls.md`.

```bash
node autogen.js urls urls.md
```