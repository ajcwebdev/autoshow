## Docker

### Build the Image

```bash
npm run docker-up
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
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{
    "type": "video",
    "url": "https://www.youtube.com/watch?v=MORMZXEaONk"
  }'
```

```bash
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{
    "type": "video",
    "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
    "transcriptServices": "whisper",
    "whisperModel": "base"
  }'
```