# Transcription

## Outline

- [Estimate Transcription Cost](#estimate-transcription-cost)
- [Transcription Service and Model Options](#transcription-service-and-model-options)
  - [Deepgram](#deepgram)
  - [Assembly](#assembly)

## Estimate Transcription Cost

```bash
curl --json '{
  "type": "transcriptCost",
  "filePath": "content/examples/audio.mp3"
}' http://localhost:3000/cost
```

## Transcription Service and Model Options

### Deepgram

```bash
curl --json '{
  "finalPath": "content/examples/audio",
  "transcriptServices": "deepgram",
  "options": {
    "deepgramApiKey": ""
  }
}' http://localhost:3000/run-transcription
```

```bash
curl --json '{
  "finalPath": "content/examples/audio",
  "transcriptServices": "deepgram",
  "options": {
    "deepgram": "base",
    "deepgramApiKey": ""
  }
}' http://localhost:3000/run-transcription
```

```bash
curl --json '{
  "finalPath": "content/examples/audio",
  "transcriptServices": "deepgram",
  "options": {
    "deepgram": "nova-2",
    "deepgramApiKey": ""
  }
}' http://localhost:3000/run-transcription
```

```bash
curl --json '{
  "finalPath": "content/examples/audio",
  "transcriptServices": "deepgram",
  "options": {
    "deepgram": "enhanced",
    "deepgramApiKey": ""
  }
}' http://localhost:3000/run-transcription
```

### Assembly

```bash
curl --json '{
  "finalPath": "content/examples/audio",
  "transcriptServices": "assembly",
  "options": {
    "assemblyApiKey": ""
  }
}' http://localhost:3000/run-transcription
```

```bash
curl --json '{
  "finalPath": "content/examples/audio",
  "transcriptServices": "assembly",
  "options": {
    "assembly": "best",
    "assemblyApiKey": ""
  }
}' http://localhost:3000/run-transcription
```

```bash
curl --json '{
  "finalPath": "content/examples/audio",
  "transcriptServices": "assembly",
  "options": {
    "assembly": "nano",
    "assemblyApiKey": ""
  }
}' http://localhost:3000/run-transcription
```

```bash
curl --json '{
  "finalPath": "content/examples/audio",
  "transcriptServices": "assembly",
  "options": {
    "speakerLabels": true,
    "assemblyApiKey": ""
  }
}' http://localhost:3000/run-transcription
```

### Groq

```bash
curl --json '{
  "finalPath": "content/examples/audio",
  "transcriptServices": "groq",
  "options": {
    "groq": "whisper-large-v3",
    "groqApiKey": ""
  }
}' http://localhost:3000/run-transcription
```