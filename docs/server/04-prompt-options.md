# Server Prompt Options

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
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["titles", "longChapters"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

## Prompt Categories

### Summaries, Chapters, and Titles

Create five title ideas:

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["titles"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

Generate a bullet-point list summarizing the transcript:

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["bulletPoints"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

Create a short, one sentence description of the transcript:

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["shortSummary"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

Create a one paragraph summary of the transcript:

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["longSummary"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

Create a one sentence AND one paragraph summary (combines shortSummary and longSummary):

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["summary"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

Create a short, one sentence description for each chapter (25 words or fewer):

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["shortChapters"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

Create a one paragraph description for each chapter (~50 words each):

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["mediumChapters"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

Create a two paragraph description for each chapter (75+ words each):

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["longChapters"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

### Takeaways, Questions, Quotes, and FAQ

Create three key takeaways about the content:

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["takeaways"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

Create ten questions about the content for comprehension:

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["questions"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

Select five important quotes from the transcript:

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["quotes"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

Generate an FAQ with answers based on the transcript:

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["faq"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

Create chapter titles with timestamps and representative quotes:

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["chapterTitlesAndQuotes"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

### Social Media Content, Blog Posts, and Songs

Write a concise and engaging social media post optimized for X (Twitter):

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["x"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

Write an engaging and conversational Facebook post:

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["facebook"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

Write a professional and insightful LinkedIn post:

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["linkedin"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

Generate a list of chapter titles with timestamps:

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["chapterTitles"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

Generate a blog outline and a first draft blog post (750+ words):

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["blog"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

Write an Eminem-inspired rap song based on the transcript:

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["rapSong"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

Write a high-energy, anthemic rock song based on the transcript:

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["rockSong"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

Write a heartfelt, storytelling country song based on the transcript:

```bash
curl --json '{
  "filePath": "autoshow/content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4.1-nano",
    "prompts": ["countrySong"]
  }
}' http://localhost:4321/api/run-llm -s | json_pp
```

## Write a Custom Prompt

You can also provide a fully custom prompt via a file or raw text, along with your source file or URL. For example, if you have a separate `.md` file containing a custom prompt:

```bash
# TODO
```