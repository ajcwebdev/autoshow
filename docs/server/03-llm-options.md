# LLM Options

## Outline

- [Estimate LLM Cost](#estimate-llm-cost)
- [LLM Services and Models](#llm-services-and-models)
  - [ChatGPT](#chatgpt)
  - [Claude](#claude)
  - [Gemini](#gemini)
  - [Fireworks](#fireworks)
  - [Together AI](#together-ai)

## Estimate LLM Cost

Fastify endpoint:

```bash
curl --json '{
  "type": "llmCost",
  "filePath": "content/examples/audio-prompt.md"
}' http://localhost:3000/cost
```

Astro endpoint:

```bash
curl --json '{
  "type": "llmCost",
  "filePath": "content/examples/audio-prompt.md"
}' http://localhost:4321/api/cost
```

## LLM Services and Models

### ChatGPT

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "openaiApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4o-mini",
    "openaiApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4o",
    "openaiApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "o1-mini",
    "openaiApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "o1",
    "openaiApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "o3",
    "openaiApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "o3-mini",
    "openaiApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "o4-mini",
    "openaiApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1",
    "openaiApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-mini",
    "openaiApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "openaiApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

### Claude

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "claude",
  "options": {
    "anthropicApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "claude",
  "options": {
    "claude": "claude-3-7-sonnet-latest",
    "anthropicApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "claude",
  "options": {
    "claude": "claude-3-5-haiku-latest",
    "anthropicApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "claude",
  "options": {
    "claude": "claude-3-opus-latest",
    "anthropicApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

### Gemini

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "geminiApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "gemini": "gemini-1.5-flash",
    "geminiApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "gemini": "gemini-1.5-pro",
    "geminiApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "gemini": "gemini-1.5-flash-8b",
    "geminiApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "gemini": "gemini-2.0-flash-lite",
    "geminiApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "gemini": "gemini-2.0-flash",
    "geminiApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "gemini": "gemini-2.5-pro-preview-03-25",
    "geminiApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "gemini": "gemini-2.5-flash-preview-04-17",
    "geminiApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

### Fireworks

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "fireworks",
  "options": {
    "fireworks": "accounts/fireworks/models/llama-v3p1-405b-instruct",
    "fireworksApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "fireworks",
  "options": {
    "fireworks": "accounts/fireworks/models/llama-v3p1-70b-instruct",
    "fireworksApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "fireworks",
  "options": {
    "fireworks": "accounts/fireworks/models/llama-v3p1-8b-instruct",
    "fireworksApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "fireworks",
  "options": {
    "fireworks": "accounts/fireworks/models/qwen2p5-72b-instruct",
    "fireworksApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

### Together AI

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "together",
  "options": {
    "together": "meta-llama/Llama-3.2-3B-Instruct-Turbo",
    "togetherApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "together",
  "options": {
    "together": "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
    "togetherApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "together",
  "options": {
    "together": "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    "togetherApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "together",
  "options": {
    "together": "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    "togetherApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "together",
  "options": {
    "together": "google/gemma-2-27b-it",
    "togetherApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "together",
  "options": {
    "together": "google/gemma-2-9b-it",
    "togetherApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "together",
  "options": {
    "together": "Qwen/Qwen2.5-72B-Instruct-Turbo",
    "togetherApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "together",
  "options": {
    "together": "Qwen/Qwen2.5-7B-Instruct-Turbo",
    "togetherApiKey": ""
  }
}' http://localhost:3000/run-llm -s | json_pp
```