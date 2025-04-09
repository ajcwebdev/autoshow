# LLM Options

## Outline

- [Estimate LLM Cost](#estimate-llm-cost)
- [Run Only LLM Process Step](#run-only-llm-process-step)
- [LLM Services and Models](#llm-services-and-models)
  - [ChatGPT](#chatgpt)
  - [Claude](#claude)
  - [Gemini](#gemini)
  - [Deepseek](#deepseek)
  - [Fireworks](#fireworks)
  - [Together AI](#together-ai)

## Estimate LLM Cost

```bash
curl --json '{
  "type": "llmCost",
  "filePath": "content/examples/audio-prompt.md"
}' http://localhost:3000/api/cost
```

## Run Only LLM Process Step

Skip steps 1-4 and run LLM (ChatGPT) on a file with prompt and transcript.

```bash
curl --json '{
  "type": "runLLM",
  "filePath": "content/examples/audio-prompt.md",
  "llm": "chatgpt",
  "llmModel": "gpt-4o-mini",
  "openaiApiKey": ""
}' http://localhost:3000/api/process
```

## LLM Services and Models

### ChatGPT

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt",
  "openaiApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt",
  "llmModel": "gpt-4o-mini",
  "openaiApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt",
  "llmModel": "gpt-4.5-preview",
  "openaiApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt",
  "llmModel": "gpt-4o",
  "openaiApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt",
  "llmModel": "o1-mini",
  "openaiApiKey": ""
}' http://localhost:3000/api/process
```

### Claude

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "claude"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "claude",
  "llmModel": "claude-3-7-sonnet-latest"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "claude",
  "llmModel": "claude-3-5-haiku-latest"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "claude",
  "llmModel": "claude-3-opus-latest"
}' http://localhost:3000/api/process
```

### Gemini

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

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini",
  "llmModel": "gemini-1.5-pro"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini",
  "llmModel": "gemini-1.5-flash-8b"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini",
  "llmModel": "gemini-2.0-flash-lite"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini",
  "llmModel": "gemini-2.0-flash"
}' http://localhost:3000/api/process
```

### Deepseek

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "deepseek"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "deepseek",
  "llmModel": "deepseek-chat"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "deepseek",
  "llmModel": "deepseek-reasoner"
}' http://localhost:3000/api/process
```

### Fireworks

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "fireworks",
  "llmModel": "accounts/fireworks/models/llama-v3p1-405b-instruct"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "fireworks",
  "llmModel": "accounts/fireworks/models/llama-v3p1-70b-instruct"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "fireworks",
  "llmModel": "accounts/fireworks/models/llama-v3p1-8b-instruct"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "fireworks",
  "llmModel": "accounts/fireworks/models/qwen2p5-72b-instruct"
}' http://localhost:3000/api/process
```

### Together AI

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "together",
  "llmModel": "meta-llama/Llama-3.2-3B-Instruct-Turbo"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "together",
  "llmModel": "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "together",
  "llmModel": "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "together",
  "llmModel": "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "together",
  "llmModel": "google/gemma-2-27b-it"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "together",
  "llmModel": "google/gemma-2-9b-it"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "together",
  "llmModel": "Qwen/Qwen2.5-72B-Instruct-Turbo"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "together",
  "llmModel": "Qwen/Qwen2.5-7B-Instruct-Turbo"
}' http://localhost:3000/api/process
```