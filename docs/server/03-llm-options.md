# LLM Options

## Estimate LLM Cost

```bash
curl --json '{
  "type": "llmCost",
  "filePath": "content/examples/audio-prompt.md",
  "llm": "chatgpt"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "llmCost",
  "filePath": "content/examples/audio-prompt.md",
  "llm": "claude"
}' http://localhost:3000/api/process
```

## Run Only LLM Process Step

Skip steps 1-4 and run LLM (ChatGPT) on a file with prompt and transcript.

```bash
curl --json '{
  "type": "runLLM",
  "filePath": "content/examples/audio-prompt.md",
  "llm": "chatgpt"
}' http://localhost:3000/api/process
```

## ChatGPT

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt",
  "llmModel": "gpt-4o-mini"
}' http://localhost:3000/api/process
```

## Claude

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "claude"
}' http://localhost:3000/api/process
```

## Gemini

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini",
  "llmModel": "gemini-1.5-flash"
}' http://localhost:3000/api/process
```