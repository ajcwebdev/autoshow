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