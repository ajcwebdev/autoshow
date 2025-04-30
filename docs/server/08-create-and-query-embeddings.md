# Create and Query Embeddings

## Outline

- [Create Embeddings](#create-embeddings)
- [Query Embeddings](#query-embeddings)

## Create Embeddings

```bash
curl --json '{
  "type": "createEmbeddings",
  "directory": "content"
}' http://localhost:4321/api/embeddings
```

## Query Embeddings

```bash
curl --json '{
  "type": "queryEmbeddings",
  "directory": "content",
  "question": "What'\''s the deal with these show notes? Answer in the voice of Jerry Seinfeld."
}' http://localhost:4321/api/embeddings
```