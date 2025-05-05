# LLM Options

## Outline

- [Estimate LLM Cost](#estimate-llm-cost)
- [LLM Services and Models](#llm-services-and-models)
  - [ChatGPT](#chatgpt)
  - [Claude](#claude)
  - [Gemini](#gemini)
  - [Groq](#groq)

## Estimate LLM Cost

Fastify endpoint:

```bash
curl --json '{
  "type": "llmCost",
  "filePath": "content/examples/audio-prompt.md"
}' http://localhost:4321/api/cost -s | json_pp
```

Astro endpoint:

```bash
curl --json '{
  "type": "llmCost",
  "filePath": "content/examples/audio-prompt.md"
}' http://localhost:4321/api/cost -s | json_pp
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
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4o-mini",
    "openaiApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4o",
    "openaiApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "o1-mini",
    "openaiApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "o1",
    "openaiApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "o3",
    "openaiApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "o3-mini",
    "openaiApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "o4-mini",
    "openaiApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1",
    "openaiApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-mini",
    "openaiApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "openaiApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

### Claude

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "claude",
  "options": {
    "anthropicApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "claude",
  "options": {
    "claude": "claude-3-7-sonnet-latest",
    "anthropicApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "claude",
  "options": {
    "claude": "claude-3-5-haiku-latest",
    "anthropicApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "claude",
  "options": {
    "claude": "claude-3-opus-latest",
    "anthropicApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

### Gemini

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "geminiApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "gemini": "gemini-1.5-flash",
    "geminiApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "gemini": "gemini-1.5-pro",
    "geminiApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "gemini": "gemini-1.5-flash-8b",
    "geminiApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "gemini": "gemini-2.0-flash-lite",
    "geminiApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "gemini": "gemini-2.0-flash",
    "geminiApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "gemini": "gemini-2.5-pro-preview-03-25",
    "geminiApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "gemini",
  "options": {
    "gemini": "gemini-2.5-flash-preview-04-17",
    "geminiApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

### Groq

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "groq",
  "options": {
    "groqApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "groq",
  "options": {
    "groq": "llama-3.3-70b-versatile",
    "groqApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "groq",
  "options": {
    "groq": "llama-3.1-8b-instant",
    "groqApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "groq",
  "options": {
    "groq": "llama3-70b-8192",
    "groqApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "groq",
  "options": {
    "groq": "llama3-8b-8192",
    "groqApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "groq",
  "options": {
    "groq": "gemma2-9b-it",
    "groqApiKey": ""
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```