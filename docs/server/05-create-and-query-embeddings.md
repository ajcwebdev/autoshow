# Create and Query Embeddings

```bash
curl --json '{
  "type": "createEmbeddings",
  "directory": "content"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "queryEmbeddings",
  "directory": "content",
  "question": "What'\''s the deal with these show notes? Answer in the voice of Jerry Seinfeld."
}' http://localhost:3000/api/process
```