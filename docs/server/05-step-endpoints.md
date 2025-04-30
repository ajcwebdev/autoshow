# Step Endpoints

## Step 1 - Dash Balance

### Get Wallet Balance

```bash
curl --json '{
  "mnemonic":"coil evidence seed guide craft thrive kangaroo height goat pilot bless visa",
  "walletAddress":"yQHygFk4px2zxtvHk33o5YCySUWjZNqdPh"
}' http://localhost:4321/api/dash-balance -s | json_pp
```

## Step 2 - Download Audio

### Download Audio from YouTube URL

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "options": {
    "video": "https://www.youtube.com/watch?v=MORMZXEaONk"
  }
}' http://localhost:4321/api/download-audio \
  -s | json_pp
```

### Convert Local File to WAV

```bash
curl --json '{
  "type": "file",
  "filePath": "autoshow/content/examples/audio.mp3",
  "options": {
    "file": "autoshow/content/examples/audio.mp3"
  }
}' http://localhost:4321/api/download-audio \
  -s | json_pp
```

## Step 3 - Run Transcription

Use this endpoint to run the transcription step on a `.wav` file. You must provide the `finalPath` (without extension) and specify which transcription service to use.

### Assembly

```bash
curl --json '{
  "finalPath": "autoshow/content/examples/audio",
  "transcriptServices": "assembly",
  "options": {
    "assembly": "nano",
    "assemblyApiKey": ""
  }
}' http://localhost:4321/api/run-transcription \
  -s | json_pp
```

### Deepgram

```bash
curl --json '{
  "finalPath": "autoshow/content/examples/audio",
  "transcriptServices": "deepgram",
  "options": {
    "deepgram": "nova-2",
    "deepgramApiKey": ""
  }
}' http://localhost:4321/api/run-transcription \
  -s | json_pp
```

```bash
curl --json '{
  "finalPath": "autoshow/content/examples/audio",
  "transcriptServices": "deepgram",
  "options": {
    "deepgram": "nova-2",
    "deepgramApiKey": "",
    "speakerLabels": true
  }
}' http://localhost:4321/api/run-transcription \
  -s | json_pp
```

## Step 4 - Select Prompt

Use this endpoint to generate a final prompt string from various prompt section choices, or a custom prompt file.

### Choose Multiple Prompts

```bash
curl --json '{
  "options": {
    "prompt": ["summary", "longChapters", "quotes"]
  }
}' http://localhost:4321/api/select-prompt \
  -s | json_pp
```

### Use Custom Prompt File

```bash
curl --json '{
  "options": {
    "customPrompt": "autoshow/content/custom-prompt.md"
  }
}' http://localhost:4321/api/select-prompt \
  -s | json_pp
```

## Step 5 - Run LLM

Use this endpoint to run the final LLM step.

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4o-mini",
    "openaiApiKey": ""
  }
}' http://localhost:4321/api/run-llm \
  -s | json_pp
```