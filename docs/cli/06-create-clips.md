# Create Clips

If your show note chapters are formatted correctly with three headers `###`, and you've saved the audio file, you can run this command to automatically create multiple audio files corresponding to the timestamps for each clip.

```bash
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --saveAudio --chatgpt
```

```bash
tsx src/utils/scripts/create-clips.ts \
  content/2021-05-10-thoughts-on-lambda-school-layoffs-chatgpt-shownotes.md \
  content/2021-05-10-thoughts-on-lambda-school-layoffs.wav
```