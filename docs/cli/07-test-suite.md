# CLI Test Suite

## Local Tests

Local services test, only uses Whisper for transcription and Ollama for LLM operations.

```bash
npm run cli-local-test
```

## Third Party Tests

Test all process commands and third party services.

- You'll need API keys for all services to make it through this entire command.
- Mostly uses transcripts of videos around one minute long and cheaper models when possible, so the total cost of running this for any given service should be at most only a few cents.

```bash
npm run cli-all-test
```

Integrated LLM and transcription model test.

```bash
npm run cli-models-test
```

## Prompt Tests

Test all prompts on a single video or audio file.

```bash
npm run cli-prompts-test
```

## LLM Tests

Test all available models for a certain LLM service.

```bash
npx tsx --test test/models/chatgpt.test.ts
npx tsx --test test/models/claude.test.ts
npx tsx --test test/models/deepseek.test.ts
npx tsx --test test/models/gemini.test.ts
npx tsx --test test/models/fireworks.test.ts
npx tsx --test test/models/together.test.ts
npx tsx --test test/models/ollama.test.ts
```

## Transcription Tests

Test all available models for a certain transcription service.

```bash
npx tsx --test test/models/deepgram.test.ts
npx tsx --test test/models/assembly.test.ts
```