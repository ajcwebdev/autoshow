# LLM Options

## Outline

- [Estimate LLM Cost](#estimate-llm-cost)
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
  "llm": "claude",
  "anthropicApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "claude",
  "llmModel": "claude-3-7-sonnet-latest",
  "anthropicApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "claude",
  "llmModel": "claude-3-5-haiku-latest",
  "anthropicApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "claude",
  "llmModel": "claude-3-opus-latest",
  "anthropicApiKey": ""
}' http://localhost:3000/api/process
```

### Gemini

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini",
  "geminiApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini",
  "llmModel": "gemini-1.5-flash",
  "geminiApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini",
  "llmModel": "gemini-1.5-pro",
  "geminiApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini",
  "llmModel": "gemini-1.5-flash-8b",
  "geminiApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini",
  "llmModel": "gemini-2.0-flash-lite",
  "geminiApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini",
  "llmModel": "gemini-2.0-flash",
  "geminiApiKey": ""
}' http://localhost:3000/api/process
```

### Deepseek

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "deepseek",
  "deepseekApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "deepseek",
  "llmModel": "deepseek-chat",
  "deepseekApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "deepseek",
  "llmModel": "deepseek-reasoner",
  "deepseekApiKey": ""
}' http://localhost:3000/api/process
```

### Fireworks

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "fireworks",
  "llmModel": "accounts/fireworks/models/llama-v3p1-405b-instruct",
  "fireworksApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "fireworks",
  "llmModel": "accounts/fireworks/models/llama-v3p1-70b-instruct",
  "fireworksApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "fireworks",
  "llmModel": "accounts/fireworks/models/llama-v3p1-8b-instruct",
  "fireworksApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "fireworks",
  "llmModel": "accounts/fireworks/models/qwen2p5-72b-instruct",
  "fireworksApiKey": ""
}' http://localhost:3000/api/process
```

### Together AI

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "together",
  "llmModel": "meta-llama/Llama-3.2-3B-Instruct-Turbo",
  "togetherApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "together",
  "llmModel": "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
  "togetherApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "together",
  "llmModel": "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
  "togetherApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "together",
  "llmModel": "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
  "togetherApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "together",
  "llmModel": "google/gemma-2-27b-it",
  "togetherApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "together",
  "llmModel": "google/gemma-2-9b-it",
  "togetherApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "together",
  "llmModel": "Qwen/Qwen2.5-72B-Instruct-Turbo",
  "togetherApiKey": ""
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "together",
  "llmModel": "Qwen/Qwen2.5-7B-Instruct-Turbo",
  "togetherApiKey": ""
}' http://localhost:3000/api/process
```