# .github/Dockerfile

# ---------------------------------------------------
# 1) Node base image with your usual packages
# ---------------------------------------------------
FROM node:22 AS base

RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    make \
    curl \
    docker.io \
    ca-certificates \
    cmake \
    libopenblas-dev \
 && rm -rf /var/lib/apt/lists/*

RUN update-ca-certificates
WORKDIR /usr/src/app

RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

RUN npm install -g tsx

# Copy package.json and package-lock.json from build context (..)
# (Because of "context: .." in docker-compose.yml)
COPY package*.json ./

RUN npm ci

# Copy source code
COPY src ./src

# Copy entrypoint script from .github directory
COPY .github/docker-entrypoint.sh ./
RUN chmod +x /usr/src/app/docker-entrypoint.sh

# ---------------------------------------------------
# 2) Pull the official Ollama image to copy out `ollama`
# ---------------------------------------------------
FROM ollama/ollama:latest AS ollama-stage
# The official image might have /bin/ollama or /usr/local/bin/ollama

# ---------------------------------------------------
# 3) Final stage: combine everything
# ---------------------------------------------------
FROM base

# COPY from the Ollama stage to your final image:
# (Check which path works for your version of the image)
COPY --from=ollama-stage /bin/ollama /usr/local/bin/ollama
# If that fails, try:
# COPY --from=ollama-stage /usr/local/bin/ollama /usr/local/bin/ollama

ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]
CMD ["--help"]