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
}' http://localhost:3000/cost
```

## LLM Services and Models

### ChatGPT

o1
o1-2024-12-17
o1-preview
o1-preview-2024-09-12
o1-pro
o1-pro-2025-03-19
o1-mini
o1-mini-2024-09-12
o3-mini
o3-mini-2025-01-31
o4-mini
o4-mini-2025-04-16
gpt-4.5-preview
gpt-4.5-preview-2025-02-27
gpt-4.1-nano
gpt-4.1-nano-2025-04-14
gpt-4.1-mini
gpt-4.1-mini-2025-04-14
gpt-4.1
gpt-4.1-2025-04-14
gpt-4o
gpt-4o-latest
gpt-4o-2024-11-20
gpt-4o-2024-08-06
gpt-4o-2024-05-13
gpt-4o-mini
gpt-4o-mini-2024-07-18

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "openaiApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4o-mini",
    "openaiApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.5-preview",
    "openaiApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4o",
    "openaiApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "o1-mini",
    "openaiApiKey": ""
  }
}' http://localhost:3000/run-llm
```

### Claude

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "claude",
  "options": {
    "anthropicApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "claude",
  "options": {
    "claude": "claude-3-7-sonnet-latest",
    "anthropicApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "claude",
  "options": {
    "claude": "claude-3-5-haiku-latest",
    "anthropicApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "claude",
  "options": {
    "claude": "claude-3-opus-latest",
    "anthropicApiKey": ""
  }
}' http://localhost:3000/run-llm
```

### Gemini

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "geminiApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "gemini": "gemini-1.5-flash",
    "geminiApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "gemini": "gemini-1.5-pro",
    "geminiApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "gemini": "gemini-1.5-flash-8b",
    "geminiApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "gemini": "gemini-2.0-flash-lite",
    "geminiApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "gemini": "gemini-2.0-flash",
    "geminiApiKey": ""
  }
}' http://localhost:3000/run-llm
```

### Deepseek

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "deepseek",
  "options": {
    "deepseekApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "deepseek",
  "options": {
    "deepseek": "deepseek-chat",
    "deepseekApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "deepseek",
  "options": {
    "deepseek": "deepseek-reasoner",
    "deepseekApiKey": ""
  }
}' http://localhost:3000/run-llm
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
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "fireworks",
  "options": {
    "fireworks": "accounts/fireworks/models/llama-v3p1-70b-instruct",
    "fireworksApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "fireworks",
  "options": {
    "fireworks": "accounts/fireworks/models/llama-v3p1-8b-instruct",
    "fireworksApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "fireworks",
  "options": {
    "fireworks": "accounts/fireworks/models/qwen2p5-72b-instruct",
    "fireworksApiKey": ""
  }
}' http://localhost:3000/run-llm
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
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "together",
  "options": {
    "together": "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
    "togetherApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "together",
  "options": {
    "together": "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    "togetherApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "together",
  "options": {
    "together": "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    "togetherApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "together",
  "options": {
    "together": "google/gemma-2-27b-it",
    "togetherApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "together",
  "options": {
    "together": "google/gemma-2-9b-it",
    "togetherApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "together",
  "options": {
    "together": "Qwen/Qwen2.5-72B-Instruct-Turbo",
    "togetherApiKey": ""
  }
}' http://localhost:3000/run-llm
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "together",
  "options": {
    "together": "Qwen/Qwen2.5-7B-Instruct-Turbo",
    "togetherApiKey": ""
  }
}' http://localhost:3000/run-llm
```