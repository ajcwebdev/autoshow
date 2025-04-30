# Transcription

## Outline

- [Estimate Transcription Cost](#estimate-transcription-cost)
- [Transcription Service and Model Options](#transcription-service-and-model-options)
  - [Deepgram](#deepgram)
  - [Assembly](#assembly)

## Estimate Transcription Cost

Fastify endpoint:

```bash
curl --json '{
  "type": "transcriptCost",
  "filePath": "content/examples/audio.mp3"
}' http://localhost:4321/api/cost -s | json_pp
```

Astro endpoint:

```bash
curl --json '{
  "type": "transcriptCost",
  "filePath": "content/examples/audio.mp3"
}' http://localhost:4321/api/cost -s | json_pp
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
}' http://localhost:4321/api/run-transcription -s | json_pp
```

```bash
curl --json '{
  "finalPath": "content/examples/audio",
  "transcriptServices": "deepgram",
  "options": {
    "deepgram": "base",
    "deepgramApiKey": ""
  }
}' http://localhost:4321/api/run-transcription -s | json_pp
```

```bash
curl --json '{
  "finalPath": "content/examples/audio",
  "transcriptServices": "deepgram",
  "options": {
    "deepgram": "nova-2",
    "deepgramApiKey": ""
  }
}' http://localhost:4321/api/run-transcription -s | json_pp
```

```bash
curl --json '{
  "finalPath": "content/examples/audio",
  "transcriptServices": "deepgram",
  "options": {
    "deepgram": "enhanced",
    "deepgramApiKey": ""
  }
}' http://localhost:4321/api/run-transcription -s | json_pp
```

### Assembly

```bash
curl --json '{
  "finalPath": "content/examples/audio",
  "transcriptServices": "assembly",
  "options": {
    "assemblyApiKey": ""
  }
}' http://localhost:4321/api/run-transcription -s | json_pp
```

```bash
curl --json '{
  "finalPath": "content/examples/audio",
  "transcriptServices": "assembly",
  "options": {
    "assembly": "best",
    "assemblyApiKey": ""
  }
}' http://localhost:4321/api/run-transcription -s | json_pp
```

```bash
curl --json '{
  "finalPath": "content/examples/audio",
  "transcriptServices": "assembly",
  "options": {
    "assembly": "nano",
    "assemblyApiKey": ""
  }
}' http://localhost:4321/api/run-transcription -s | json_pp
```

```bash
curl --json '{
  "finalPath": "content/examples/audio",
  "transcriptServices": "assembly",
  "options": {
    "speakerLabels": true,
    "assemblyApiKey": ""
  }
}' http://localhost:4321/api/run-transcription -s | json_pp
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
}' http://localhost:4321/api/run-transcription -s | json_pp
```