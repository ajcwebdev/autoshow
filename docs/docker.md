## Docker

### Build the Image

```bash
npm run docker-setup
```

### Run CLI Commands with Docker

You can run any of the `as` CLI commands by passing arguments to the container via `docker-cli`.

```bash
npm run docker-cli -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --whisper base \
  --ollama "LLAMA_3_2_3B"
```

### Run the Server with Docker

To spin up the server on port 3000, run:

```bash
npm run docker-serve
```

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

Pull and run.

```bash
docker pull ghcr.io/ajcwebdev/autoshow:latest
docker run --rm -p 3000:3000 ghcr.io/ajcwebdev/autoshow:latest serve
```

```bash
curl -X POST http://localhost:3000/process \
  -H "Content-Type: application/json" \
  -d '{
    "type": "video",
    "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
    "transcriptServices": "whisper",
    "whisperModel": "base"
  }'
```

```bash
curl -X POST http://localhost:3000/process \
  -H "Content-Type: application/json" \
  -d '{
    "type": "video",
    "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
    "llm": "ollama",
    "llmModel": "LLAMA_3_2_3B",
    "transcriptServices": "whisper",
    "whisperModel": "base"
  }'
```

### Railway

Work in progress, still having issues getting the server to start on 3000.

```toml
# railway.toml

[build]
  builder = "DOCKERFILE"
  buildCommand = "docker build -t autoshow -f .github/Dockerfile ."
  dockerfilePath = ".github/Dockerfile"

[deploy]
  runtime = "V2"
  numReplicas = 1
  startCommand = "docker run -d -p 3000:3000 -v $PWD/content:/usr/src/app/content autoshow serve"
  sleepApplication = false
  multiRegionConfig = {"us-west1":{"numReplicas":1}}
  restartPolicyType = "ON_FAILURE"
  restartPolicyMaxRetries = 10
```

```bash
railway login
railway init
railway link
railway up
```

```bash
curl -X POST https://autoshow.up.railway.app/process \
  -H "Content-Type: application/json" \
  -d '{
    "type": "video",
    "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
    "transcriptServices": "whisper",
    "whisperModel": "base"
  }'
```