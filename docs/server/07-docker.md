# Docker

## Outline

- [Usage](#usage)
  - [Build and Run the Image](#build-and-run-the-image)
  - [Stop the Image](#stop-the-image)
- [Logging](#logging)
  - [Get Docker Info](#get-docker-info)
  - [Get Docker Logs](#get-docker-logs)
  - [Inspect Docker](#inspect-docker)
  - [Get Docker Info](#get-docker-info)
- [Docker Hosting](#docker-hosting)
  - [Docker Hub](#docker-hub)
  - [GitHub Container Registry](#github-container-registry)
  - [Test Pull and Run](#test-pull-and-run)
- [Database](#database)
  - [Get Database Content](#get-database-content)
  - [Wipe Database](#wipe-database)
- [Railway](#railway)
  - [Setup Database on Railway](#setup-database-on-railway)
  - [Get Info](#get-info)
  - [Test Requests](#test-requests)

## Usage

### Build and Run the Image

```bash
npm run up
```

### Stop the Image

```bash
.github/workflows/docker-down.sh
```

Free up space on your machine by pruning Docker files:

*Warning: This will delete your builds, containers, images, volumes, networks, and everything else.*

```bash
.github/workflows/prune.sh
```

## Logging

### Get Docker Info

```bash
./.github/docker-info.sh
```

### Get Docker Logs

```bash
.github/workflows/docker-logs.sh
```

### Inspect Docker

```bash
.github/workflows/docker-inspect.sh
```

### Get Docker Info

```bash
.github/workflows/docker-info.sh
```

## Docker Hosting

### Docker Hub

Login to Docker Hub.

```bash
docker login
```

Tag and push.

```bash
docker tag autoshow:latest ajcwebdev/autoshow:latest
docker push ajcwebdev/autoshow:latest
```

Pull and run.

```bash
docker pull ajcwebdev/autoshow:latest
docker run --rm -p 3000:3000 ajcwebdev/autoshow:latest serve
```

### GitHub Container Registry

To login, create a PAT [(personal access token)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) with the ability to upload packages to GitHub Package Registry. Include your key instead of xxxx.

```bash
CR_PAT="xxxx" && echo $CR_PAT | docker login ghcr.io -u ajcwebdev --password-stdin
```

Tag and push.

```bash
docker tag autoshow:latest ghcr.io/ajcwebdev/autoshow:latest
docker push ghcr.io/ajcwebdev/autoshow:latest
```

### Test Pull and Run

Pull and run.

```bash
docker pull ghcr.io/ajcwebdev/autoshow:latest
docker run --rm -p 3000:3000 ghcr.io/ajcwebdev/autoshow:latest serve
```

## Database

### Get Database Content

```bash
.github/workflows/get-db.sh
```

### Wipe Database

```bash
.github/workflows/wipe-db.sh
```

## Railway

### Setup Database on Railway

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

### Get Info

```bash
npm run railway-info
```

### Test Requests

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