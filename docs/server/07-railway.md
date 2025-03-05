# Railway

## Setup Database on Railway

Link to staging environment in Autoshow project and deploy [`pgvector` template](https://railway.com/template/3jJFCA). Use your own team name in place of `--team Autoshow`.

```bash
railway link --team Autoshow --project autoshow --environment staging
railway deploy --template 3jJFCA
```

Get `DATABASE_URL_PRIVATE` variable from the newly deployed `pgvector` service and set it to `DATABASE_URL` in the `autoshow` service with `?sslmode=disable` appended to the end of the connection string for Prisma configuration.

```bash
railway variables --service autoshow --environment staging \
  --set "DATABASE_URL=$(railway variables -s pgvector --kv | grep DATABASE_URL_PRIVATE | cut -d'=' -f2)?sslmode=disable"
```

Use remote Postgres database on Railway for local development:

```bash
echo "\nDATABASE_URL=$(railway variables -s pgvector --kv | grep DATABASE_URL= | cut -d'=' -f2)?sslmode=require" >> .env
```

## Test Requests

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk"
}' -o "content/2024-09-24-ep0-fsjam-podcast-prompt.json" \
https://autodaily.show/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt",
  "openaiApiKey": ""
}' -o "content/2024-09-24-ep0-fsjam-podcast-chatgpt.json" \
https://autodaily.show/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "deepgram",
  "deepgramApiKey": ""
}' -o "content/2024-09-24-ep0-fsjam-podcast-prompt.json" \
https://autodaily.show/api/process
```