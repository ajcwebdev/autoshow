# Transcription Options

## Outline

- [Get Transcription Cost](#get-transcription-cost)
- [Transcription Services](#transcription-services)
  - [Whisper](#whisper)
  - [Deepgram](#deepgram)
  - [Assembly](#assembly)

## Get Transcription Cost

```bash
npm run as -- --transcriptCost "content/examples/audio.mp3" --deepgram
npm run as -- --transcriptCost "content/examples/audio.mp3" --assembly
```

## Transcription Services

### Whisper

If neither the `--deepgram` or `--assembly` option is included for transcription, `autoshow` will default to running the largest Whisper.cpp model. To configure the size of the Whisper model, use the `--model` option and select one of the following:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper tiny
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper base
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper small
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper medium
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper large-v3-turbo
```

### Deepgram

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --deepgram
```

Select model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --deepgram base
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --deepgram enhanced
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --deepgram nova-2
```

Include Deepgram API key directly in CLI command instead of in `.env` file:

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --deepgram \
  --deepgramApiKey ""
```

### Assembly

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --assembly
```

Select model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --assembly NANO
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --assembly BEST
```

Include speaker labels and number of speakers:

```bash
npm run as -- \
  --video "https://ajc.pics/audio/fsjam-short.mp3" \
  --assembly \
  --speakerLabels
```

Include Assembly API key directly in CLI command instead of in `.env` file:

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --assembly \
  --assemblyApiKey ""
```