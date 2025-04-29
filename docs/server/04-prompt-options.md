# Server Prompt Options

*Needs to be updated to `/run-llm` endpoint.*

## Outline

- [Outline](#outline)
- [Default Prompt](#default-prompt)
- [Prompt Categories](#prompt-categories)
  - [Summaries, Chapters, and Titles](#summaries-chapters-and-titles)
  - [Takeaways, Questions, Quotes, and FAQ](#takeaways-questions-quotes-and-faq)
  - [Social Media Content, Blog Posts, and Songs](#social-media-content-blog-posts-and-songs)
- [Write a Custom Prompt](#write-a-custom-prompt)

## Default Prompt

This request will generate a set of titles and long chapter summaries from a YouTube video:

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles", "longChapters"]
}' http://localhost:3000/api/process
```

Use an LLM (e.g., `deepseek`) for generating content with the selected prompt:

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles"],
  "llm": "deepseek"
}' http://localhost:3000/api/process
```

## Prompt Categories

### Summaries, Chapters, and Titles

Create five title ideas:

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles"]
}' http://localhost:3000/api/process
```

Generate a bullet-point list summarizing the transcript:

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["bulletPoints"]
}' http://localhost:3000/api/process
```

Create a short, one sentence description of the transcript:

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["shortSummary"]
}' http://localhost:3000/api/process
```

Create a one paragraph summary of the transcript:

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["longSummary"]
}' http://localhost:3000/api/process
```

Create a one sentence AND one paragraph summary (combines shortSummary and longSummary):

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["summary"]
}' http://localhost:3000/api/process
```

Create a short, one sentence description for each chapter (25 words or fewer):

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["shortChapters"]
}' http://localhost:3000/api/process
```

Create a one paragraph description for each chapter (~50 words each):

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["mediumChapters"]
}' http://localhost:3000/api/process
```

Create a two paragraph description for each chapter (75+ words each):

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["longChapters"]
}' http://localhost:3000/api/process
```

### Takeaways, Questions, Quotes, and FAQ

Create three key takeaways about the content:

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["takeaways"]
}' http://localhost:3000/api/process
```

Create ten questions about the content for comprehension:

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["questions"]
}' http://localhost:3000/api/process
```

Select five important quotes from the transcript:

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["quotes"]
}' http://localhost:3000/api/process
```

Generate an FAQ with answers based on the transcript:

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["faq"]
}' http://localhost:3000/api/process
```

Create chapter titles with timestamps and representative quotes:

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["chapterTitlesAndQuotes"]
}' http://localhost:3000/api/process
```

### Social Media Content, Blog Posts, and Songs

Write a concise and engaging social media post optimized for X (Twitter):

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["x"]
}' http://localhost:3000/api/process
```

Write an engaging and conversational Facebook post:

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["facebook"]
}' http://localhost:3000/api/process
```

Write a professional and insightful LinkedIn post:

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["linkedin"]
}' http://localhost:3000/api/process
```

Generate a list of chapter titles with timestamps:

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["chapterTitles"]
}' http://localhost:3000/api/process
```

Generate a blog outline and a first draft blog post (750+ words):

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["blog"]
}' http://localhost:3000/api/process
```

Write an Eminem-inspired rap song based on the transcript:

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["rapSong"]
}' http://localhost:3000/api/process
```

Write a high-energy, anthemic rock song based on the transcript:

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["rockSong"]
}' http://localhost:3000/api/process
```

Write a heartfelt, storytelling country song based on the transcript:

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["countrySong"]
}' http://localhost:3000/api/process
```

## Write a Custom Prompt

You can also provide a fully custom prompt via a file or raw text, along with your source file or URL. For example, if you have a separate `.md` file containing a custom prompt:

```bash
curl --json '{
  "type": "audio",
  "file": "content/examples/audio.mp3",
  "prompts": [],
  "customPrompt": "content/examples/custom-prompt.md"
}' http://localhost:3000/api/process
```