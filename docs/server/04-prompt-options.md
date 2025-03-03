# Prompt Options

## Default Prompt

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles", "longChapters"]
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles"],
  "llm": "deepseek"
}' http://localhost:3000/api/process
```