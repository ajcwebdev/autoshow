# Create Embeddings

If you have generated multiple markdown files in the `content` directory, you can create embeddings for all the files and query them with ChatGPT.

*Note: Only supports ChatGPT at this point.*

```bash
npm run as -- --createEmbeddings "content"
```

```bash
npm run as -- --queryEmbeddings "What's the deal with these show notes? Answer in the voice of Jerry Seinfeld."
```