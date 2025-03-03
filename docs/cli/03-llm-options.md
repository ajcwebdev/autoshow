# Language Model (LLM) Options

This project supports multiple LLM service providers, each with various models. Below is a guide to using each service/model, including skipping LLM processing, local inference with Ollama, and third-party APIs.

## Outline

- [Environment Variables](#environment-variables)
- [Run Only LLM Step](#run-only-llm-step)
- [Get LLM Cost](#get-llm-cost)
- [Skip LLM Processing](#skip-llm-processing)
- [Local Inference (Ollama)](#local-inference-ollama)
- [OpenAI ChatGPT](#openai-chatgpt)
- [Anthropic Claude](#anthropic-claude)
- [Google Gemini](#google-gemini)
- [DeepSeek](#deepseek)
- [Fireworks AI](#fireworks-ai)
- [Together AI](#together-ai)

## Environment Variables

Create a `.env` file (or set them in your environment) for any service(s) you plan to use:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `DEEPSEEK_API_KEY`
- `FIREWORKS_API_KEY`
- `TOGETHER_API_KEY`

## Run Only LLM Step

You can run only the LLM step (for example, after doing transcription separately):

```bash
npm run as -- --runLLM "content/audio-prompt.md" --chatgpt
```

## Get LLM Cost

If you just want to calculate the estimated cost of input/output tokens for a given provider:

```bash
npm run as -- --llmCost "content/audio-prompt.md" --chatgpt
npm run as -- --llmCost "content/audio-prompt.md" --claude
npm run as -- --llmCost "content/audio-prompt.md" --gemini
```

No LLM model will be called, and no LLM-based output file is generated.

## Local Inference (Ollama)

Run local models on your machine via [Ollama](https://github.com/jmorganca/ollama). For instance:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=abc123" --ollama
```

1. **QWEN 2 5 0B** (`qwen2.5:0.5b`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --ollama qwen2.5:0.5b
   ```
2. **QWEN 2.5 1.5B** (`qwen2.5:1.5b`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --ollama qwen2.5:1.5b
   ```
3. **QWEN 2.5 3B** (`qwen2.5:3b`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --ollama qwen2.5:3b
   ```
4. **LLAMA 3.2 1B** (`llama3.2:1b`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --ollama llama3.2:1b
   ```
5. **LLAMA 3.2 3B** (`llama3.2:3b`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --ollama llama3.2:3b
   ```
6. **GEMMA 2 2B** (`gemma2:2b`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --ollama gemma2:2b
   ```
7. **PHI 3.5** (`phi3.5:3.8b`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --ollama phi3.5:3.8b
   ```
8. **DEEPSEEK R1 1.5B** (`deepseek-r1:1.5b`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --ollama deepseek-r1:1.5b
   ```

## OpenAI ChatGPT

If you have set your `OPENAI_API_KEY`:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=abc123" --chatgpt
```

1. **GPT 4.5 PREVIEW** (`gpt-4.5-preview`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --chatgpt gpt-4.5-preview
   ```
2. **GPT 4o** (`gpt-4o`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --chatgpt gpt-4o
   ```
3. **GPT 4o MINI** (`gpt-4o-mini`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --chatgpt gpt-4o-mini
   ```
4. **GPT o1** (`o1`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --chatgpt o1
   ```
5. **GPT o3 MINI** (`o3-mini`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --chatgpt o3-mini
   ```
6. **GPT o1 MINI** (`o1-mini`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --chatgpt o1-mini
   ```

## Anthropic Claude

If you have set your `ANTHROPIC_API_KEY`:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=abc123" --claude
```

1. **Claude 3.7 Sonnet** (`claude-3-7-sonnet-latest`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --claude claude-3-7-sonnet-latest
   ```
2. **Claude 3.5 Haiku** (`claude-3-5-haiku-latest`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --claude claude-3-5-haiku-latest
   ```
3. **Claude 3 Opus** (`claude-3-opus-latest`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --claude claude-3-opus-latest
   ```

## Google Gemini

If you have set your `GEMINI_API_KEY`:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=abc123" --gemini
```

1. **Gemini 1.5 Pro** (`gemini-1.5-pro`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --gemini gemini-1.5-pro
   ```
2. **Gemini 1.5 Flash-8B** (`gemini-1.5-flash-8b`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --gemini gemini-1.5-flash-8b
   ```
3. **Gemini 1.5 Flash** (`gemini-1.5-flash`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --gemini gemini-1.5-flash
   ```
4. **Gemini 2.0 Flash-Lite** (`gemini-2.0-flash-lite`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --gemini gemini-2.0-flash-lite
   ```
5. **Gemini 2.0 Flash** (`gemini-2.0-flash`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --gemini gemini-2.0-flash
   ```

## DeepSeek

If you have set your `DEEPSEEK_API_KEY`:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=abc123" --deepseek
```

1. **DeepSeek Chat** (`deepseek-chat`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --deepseek deepseek-chat
   ```
2. **DeepSeek Reasoner** (`deepseek-reasoner`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --deepseek deepseek-reasoner
   ```

## Fireworks AI

If you have set your `FIREWORKS_API_KEY`:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=abc123" --fireworks
```

1. **LLAMA 3 1 405B** (`accounts/fireworks/models/llama-v3p1-405b-instruct`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --fireworks accounts/fireworks/models/llama-v3p1-405b-instruct
   ```
2. **LLAMA 3 1 70B** (`accounts/fireworks/models/llama-v3p1-70b-instruct`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --fireworks accounts/fireworks/models/llama-v3p1-70b-instruct
   ```
3. **LLAMA 3 1 8B** (`accounts/fireworks/models/llama-v3p1-8b-instruct`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --fireworks accounts/fireworks/models/llama-v3p1-8b-instruct
   ```
4. **LLAMA 3 2 3B** (`accounts/fireworks/models/llama-v3p2-3b-instruct`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --fireworks accounts/fireworks/models/llama-v3p2-3b-instruct
   ```
5. **QWEN 2 5 72B** (`accounts/fireworks/models/qwen2p5-72b-instruct`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --fireworks accounts/fireworks/models/qwen2p5-72b-instruct
   ```

## Together AI

If you have set your `TOGETHER_API_KEY`:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=abc123" --together
```

1. **LLAMA 3 2 3B** (`meta-llama/Llama-3.2-3B-Instruct-Turbo`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --together meta-llama/Llama-3.2-3B-Instruct-Turbo
   ```
2. **LLAMA 3 1 405B** (`meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --together meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo
   ```
3. **LLAMA 3 1 70B** (`meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --together meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo
   ```
4. **LLAMA 3 1 8B** (`meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --together meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo
   ```
5. **Gemma 2 27B** (`google/gemma-2-27b-it`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --together google/gemma-2-27b-it
   ```
6. **Gemma 2 9B** (`google/gemma-2-9b-it`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --together google/gemma-2-9b-it
   ```
7. **QWEN 2 5 72B** (`Qwen/Qwen2.5-72B-Instruct-Turbo`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --together Qwen/Qwen2.5-72B-Instruct-Turbo
   ```
8. **QWEN 2 5 7B** (`Qwen/Qwen2.5-7B-Instruct-Turbo`)
   ```bash
   npm run as -- --video "https://www.youtube.com/watch?v=abc123" --together Qwen/Qwen2.5-7B-Instruct-Turbo
   ```