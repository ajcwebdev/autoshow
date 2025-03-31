# Process Endpoint

## Start Server

Run the following command to start the server with a Docker container:

```bash
npm run up
```

Once the server is running, send a `POST` request to `http://localhost:3000/api/process` containing a JSON object:

## Video Type

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk"
}' http://localhost:3000/api/process
```

Use LLM.

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "whisperModel": "tiny",
  "llm": "deepseek"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "whisperModel": "tiny",
  "llm": "deepseek",
  "llmModel": "deepseek-reasoner"
}' http://localhost:3000/api/process
```

## File Type

```bash
curl --json '{
  "type": "file",
  "filePath": "content/examples/audio.mp3"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "file",
  "filePath": "content/examples/audio.mp3",
  "whisperModel": "tiny",
  "llm": "deepseek"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "file",
  "filePath": "content/examples/audio.mp3",
  "prompts": ["titles"],
  "whisperModel": "tiny",
  "llm": "deepseek"
}' http://localhost:3000/api/process
```