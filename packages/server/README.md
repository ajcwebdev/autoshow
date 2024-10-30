## Process Endpoints

### Playlist Endpoint

http://localhost:3000/playlist

```js
const TEST_REQ_01 = {
  "playlistUrl": "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr"
}

const TEST_REQ_02 = {
  "playlistUrl": "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr",
  "whisperModel": "tiny"
}

const TEST_REQ_03 = {
  "playlistUrl": "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr",
  "whisperModel": "tiny",
  "llm": "ollama"
}

const TEST_REQ_04 = {
  "playlistUrl": "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr",
  "prompts": ["titles", "mediumChapters"],
  "whisperModel": "tiny",
  "llm": "ollama"
}
```

### URLs Endpoint

http://localhost:3000/urls

```js
const TEST_REQ_05 = {
  "filePath": "content/example-urls.md"
}

const TEST_REQ_06 = {
  "filePath": "content/example-urls.md",
  "whisperModel": "tiny"
}

const TEST_REQ_07 = {
  "filePath": "content/example-urls.md",
  "whisperModel": "tiny",
  "llm": "ollama"
}

const TEST_REQ_08 = {
  "filePath": "content/example-urls.md",
  "prompts": ["titles", "mediumChapters"],
  "whisperModel": "tiny",
  "llm": "ollama"
}
```

### File Endpoint

http://localhost:3000/file

```js
const TEST_REQ_09 = {
  "filePath": "content/audio.mp3"
}

const TEST_REQ_10 = {
  "filePath": "content/audio.mp3",
  "whisperModel": "tiny"
}

const TEST_REQ_11 = {
  "filePath": "content/audio.mp3",
  "whisperModel": "tiny",
  "llm": "ollama"
}

const TEST_REQ_12 = {
  "filePath": "content/audio.mp3",
  "prompts": ["titles"],
  "whisperModel": "tiny",
  "llm": "ollama"
}
```

### RSS Endpoint

http://localhost:3000/rss

```js
const TEST_REQ_13 = {
  "rssUrl": "https://feeds.transistor.fm/fsjam-podcast/"
}

const TEST_REQ_14 = {
  "rssUrl": "https://feeds.transistor.fm/fsjam-podcast/",
  "whisperModel": "tiny"
}

const TEST_REQ_15 = {
  "rssUrl": "https://feeds.transistor.fm/fsjam-podcast/",
  "whisperModel": "tiny",
  "llm": "ollama"
}

const TEST_REQ_16 = {
  "rssUrl": "https://feeds.transistor.fm/fsjam-podcast/",
  "whisperModel": "tiny",
  "order": "newest",
  "skip": 94
}

const TEST_REQ_17 = {
  "rssUrl": "https://feeds.transistor.fm/fsjam-podcast/",
  "whisperModel": "tiny",
  "order": "oldest",
  "skip": 94
}
```

### Video Endpoint

http://localhost:3000/video

```js
const TEST_REQ_18 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk"
}

const TEST_REQ_19 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "whisperModel": "tiny",
  "llm": "ollama"
}

const TEST_REQ_20 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt"
}

const TEST_REQ_21 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt",
  "llmModel": "GPT_4o_MINI"
}

const TEST_REQ_22 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "claude"
}

const TEST_REQ_23 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "claude",
  "llmModel": "CLAUDE_3_SONNET"
}

const TEST_REQ_24 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini"
}

const TEST_REQ_25 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini",
  "llmModel": "GEMINI_1_5_FLASH"
}

const TEST_REQ_26 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "cohere"
}

const TEST_REQ_27 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "cohere",
  "llmModel": "COMMAND_R_PLUS"
}

const TEST_REQ_28 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "mistral"
}

const TEST_REQ_29 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "mistral",
  "llmModel": "MIXTRAL_8x7b"
}

const TEST_REQ_32 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "whisperModel": "tiny"
}

const TEST_REQ_33 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "deepgram"
}

const TEST_REQ_34 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "deepgram",
  "llm": "ollama"
}

const TEST_REQ_35 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "assembly"
}

const TEST_REQ_36 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "assembly",
  "llm": "ollama"
}

const TEST_REQ_37 = {
  "youtubeUrl": "https://ajc.pics/audio/fsjam-short.mp3",
  "transcriptServices": "assembly",
  "speakerLabels": true
}

const TEST_REQ_38 = {
  "youtubeUrl": "https://ajc.pics/audio/fsjam-short.mp3",
  "transcriptServices": "assembly",
  "speakerLabels": true,
  "llm": "ollama"
}

const TEST_REQ_39 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles", "mediumChapters"]
}

const TEST_REQ_40 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles", "summary", "shortChapters", "takeaways", "questions"]
}

const TEST_REQ_41 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles", "summary", "shortChapters", "takeaways", "questions"],
  "whisperModel": "tiny",
  "llm": "ollama"
}
```