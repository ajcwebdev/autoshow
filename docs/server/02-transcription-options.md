## Transcription Options

### Whisper.cpp

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "whisperModel": "tiny"
}' http://localhost:3000/api/process
```

### Deepgram

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "deepgram"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "deepgram",
  "transcriptModel": "base",
  "deepgramApiKey": ""
}' http://localhost:3000/api/process
```

### Assembly

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "assembly"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "assembly",
  "transcriptModel": "BEST"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://ajc.pics/audio/fsjam-short.mp3",
  "transcriptServices": "assembly",
  "speakerLabels": true
}' http://localhost:3000/api/process
```

### Estimate Transcription Cost

```bash
curl --json '{
  "type": "transcriptCost",
  "filePath": "content/audio.mp3",
  "transcriptServices": "deepgram"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "transcriptCost",
  "filePath": "content/audio.mp3",
  "transcriptServices": "assembly"
}' http://localhost:3000/api/process
```