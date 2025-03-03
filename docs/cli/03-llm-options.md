# Language Model (LLM) Options

## Outline

- [Outline](#outline)
- [Environment Variables](#environment-variables)
- [Run Only LLM Process Step](#run-only-llm-process-step)
- [Get LLM Cost](#get-llm-cost)
- [Run Local Models with Ollama](#run-local-models-with-ollama)
- [Third Party LLM Services](#third-party-llm-services)
  - [OpenAI ChatGPT](#openai-chatgpt)
  - [Anthropic Claude Models](#anthropic-claude-models)
  - [Google Gemini Models](#google-gemini-models)
  - [Fireworks Open Source Models](#fireworks-open-source-models)
  - [Together Open Source Models](#together-open-source-models)

## Environment Variables

Create a `.env` file and set API key as demonstrated in `.env.example` for either:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `TOGETHER_API_KEY`
- `FIREWORKS_API_KEY`

For each model available for each provider, I have collected the following details:

- Context Window, the limit of tokens a model can process at once.
- Max Output, the upper limit of tokens a model can generate in a response, influencing response length and detail.
- Cost of input and output tokens per million tokens.
  - Some model providers also offer a Batch API with input/output tokens at half the price.

## Run Only LLM Process Step

```bash
npm run as -- --runLLM "content/audio-prompt.md" --chatgpt
```

## Get LLM Cost

```bash
npm run as -- --llmCost "content/audio-prompt.md" --chatgpt
npm run as -- --llmCost "content/audio-prompt.md" --claude
```

## Run Local Models with Ollama

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama
```

Select Ollama model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama deepseek-r1:1.5b
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama qwen2.5:0.5b
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama qwen2.5:1.5b
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama qwen2.5:3b
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama llama3.2:1b
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama llama3.2:3b
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama gemma2:2b
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama phi3.5:3.8b
```

*Note: These options are very small models that run quickly and efficiently on most laptops or PCs. Depending on your hardware you may be able to run larger models in the 7-14 billion parameter range. If you have three rooms of your house outfitted into a server farm you can run models in the 400 billion range.*

## Third Party LLM Services

### OpenAI ChatGPT

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --chatgpt
```

Select ChatGPT model:

```bash
# Select GPT-4o mini model - https://platform.openai.com/docs/models/gpt-4o-mini
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --chatgpt gpt-4o-mini

# Select GPT-4o model - https://platform.openai.com/docs/models/gpt-4o
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --chatgpt gpt-4o

# Select o1_MINI model - https://platform.openai.com/docs/models/#o1
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --chatgpt o1-mini
```

Include OpenAI API key directly in CLI command instead of in `.env` file:

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --chatgpt \
  --openaiApiKey ""
```

### Anthropic Claude Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude
```

Select Claude model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude claude-3-5-sonnet-20240620
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude claude-3-opus-20240229
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude claude-3-sonnet-20240229
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude claude-3-haiku-20240307
```

Include Anthropic API key directly in CLI command instead of in `.env` file:

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --claude \
  --anthropicApiKey ""
```

### Google Gemini Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --gemini
```

Select Gemini model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --gemini gemini-1.5-flash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --gemini gemini-1.5-pro-exp-0827
```

Include Gemini API key directly in CLI command instead of in `.env` file:

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --gemini \
  --geminiApiKey ""
```

### Fireworks Open Source Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --fireworks
```

Select Fireworks model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --fireworks accounts/fireworks/models/llama-v3p1-405b-instruct
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --fireworks accounts/fireworks/models/llama-v3p1-70b-instruct
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --fireworks accounts/fireworks/models/llama-v3p1-8b-instruct
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --fireworks accounts/fireworks/models/llama-v3p2-3b-instruct
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --fireworks accounts/fireworks/models/qwen2p5-72b-instruct
```

Include Fireworks API key directly in CLI command instead of in `.env` file:

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --fireworks \
  --fireworksApiKey ""
```

### Together Open Source Models

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together
```

Select Together model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together meta-llama/Llama-3.2-3B-Instruct-Turbo
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together google/gemma-2-27b-it
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together google/gemma-2-9b-it
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together Qwen/Qwen2.5-72B-Instruct-Turbo
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together Qwen/Qwen2.5-7B-Instruct-Turbo
```

Include Together API key directly in CLI command instead of in `.env` file:

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --together \
  --togetherApiKey ""
```