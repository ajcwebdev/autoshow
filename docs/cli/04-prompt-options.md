# CLI Prompt Options

## Outline

- [Default Prompt](#default-prompt)
- [Prompt Categories](#prompt-categories)
  - [Summaries, Chapters, and Titles](#summaries-chapters-and-titles)
  - [Takeaways, Questions, Quotes, and FAQ](#takeaways-questions-quotes-and-faq)
  - [Social Media Content, Blog Posts, and Songs](#social-media-content-blog-posts-and-songs)
- [Print Select Prompts without Process Commands](#print-select-prompts-without-process-commands)
- [Write a Custom Prompt](#write-a-custom-prompt)

## Default Prompt

Running a command without including the prompt flag like so:

```bash
npm run as -- --rss "https://ajcwebdev.substack.com/feed"
```

Is the equivalent to including two options (`summary` and `longChapters`) to `--prompt`:

```bash
npm run as -- --rss "https://ajcwebdev.substack.com/feed" \
  --prompt summary longChapters
```

## Prompt Categories

### Summaries, Chapters, and Titles

```bash
# Create five title ideas:
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt titles

# Generate a bullet-point list summarizing the transcript:
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt bulletPoints

# Create a short, one sentence description of the transcript:
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt shortSummary

# Create a one paragraph summary of the transcript:
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt longSummary

# Create a one sentence and one paragraph summary (combines shortSummary and longSummary):
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt summary

# Create a short, one sentence description for each chapter that's 25 words or shorter.
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt shortChapters

# Create a one paragraph description for each chapter that's around 50 words.
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt mediumChapters

# Create a two paragraph description for each chapter that's over 75 words.
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt longChapters
```

### Takeaways, Questions, Quotes, and FAQ

```bash
# Create three key takeaways about the content:
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt takeaways

# Create ten questions about the content to check for comprehension:
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt questions

# Select five important quotes from the transcript:
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt quotes

# Generate frequently asked questions with answers based on the transcript:
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt faq

# Create chapter titles with timestamps and representative quotes:
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt chapterTitlesAndQuotes
```

### Social Media Content, Blog Posts, and Songs

```bash
# Write a concise and engaging social media post optimized for X (Twitter):
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt x

# Write an engaging and conversational Facebook post:
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt facebook

# Write a professional and insightful LinkedIn post:
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt linkedin

# Generate a list of chapter titles with timestamps:
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt chapterTitles

# Generate a blog outline and a first draft blog post (750+ words):
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt blog

# Write an Eminem-inspired rap song based on the transcript:
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt rapSong

# Write a high-energy, anthemic rock song based on the transcript:
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt rockSong

# Write a heartfelt, storytelling country song based on the transcript:
npm run as -- --rss "https://ajcwebdev.substack.com/feed" --prompt countrySong
```

## Print Select Prompts without Process Commands

```bash
npm run as -- --printPrompt summary longChapters
```

## Write a Custom Prompt

```bash
npm run as -- --file "content/audio.mp3" --customPrompt "content/custom-prompt.md" --chatgpt
```