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

> Replace `large-v2` with `base` for the smallest model or `medium` for a middle sized model.

## Run Autogen Bash Scripts

Run on a single YouTube video.

```bash
# short one minute video
./autogen.sh --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"

# longer 30 minute video
./autogen.sh --video "https://www.youtube.com/watch?v=QhXc9rVLVUo"
```

Run on a single audio file.

```bash
./autogen.sh --audio "https://media.transistor.fm/d1d18d2d/449ace19.mp3"
```

Run on multiple YouTube videos in a playlist.

```bash
./autogen.sh --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXMh4DQBigyvHSRTf2CSj129"
```

Run on an arbitrary list of URLs in `urls.md`.

```bash
./autogen.sh --urls urls.md
```

Run on a local video file.

```bash
./autogen.sh --file content/video.mkv
```

## Run Autogen Node Scripts

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