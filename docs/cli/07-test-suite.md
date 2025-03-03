# Test Suite

Integration test.

- You'll need API keys for all services to make it through this entire command.
- Mostly uses transcripts of videos around one minute long and cheaper models when possible, so the total cost of running this for any given service should be at most only a few cents.

```bash
npm run test-cli-services
```

Local services test, only uses Whisper for transcription and Ollama for LLM operations.

```bash
npm run test-cli-local
```

Docker test, also uses Whisper for transcription but in a Docker container.

```bash
npm run test-docker-server-local
```

Test all available models for a certain LLM service.

```bash
npx tsx --test test/models/chatgpt.test.ts
npx tsx --test test/models/claude.test.ts
npx tsx --test test/models/gemini.test.ts
npx tsx --test test/models/fireworks.test.ts
npx tsx --test test/models/together.test.ts
```

Test all available models for a certain transcription service.

```bash
npx tsx --test test/models/deepgram.test.ts
npx tsx --test test/models/assembly.test.ts
```