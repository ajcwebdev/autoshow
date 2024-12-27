# Dockerfile

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

# Install tsx globally
RUN npm install -g tsx

# Copy only package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci

# Copy the application source code (excluding files specified in .dockerignore)
COPY src ./src
COPY docker-entrypoint.sh ./

# Ensure the entrypoint script is executable
RUN chmod +x /usr/src/app/docker-entrypoint.sh

# ---------------------------------------------------
# 2) Pull the official Ollama image to copy out `ollama`
# ---------------------------------------------------
FROM ollama/ollama:latest AS ollama-stage
# The official image puts the `ollama` binary in /bin/ollama (Alpine-based),
# or /usr/local/bin/ollama (Debian-based). We'll see which is correct.

# ---------------------------------------------------
# 3) Final stage: combine everything
# ---------------------------------------------------
FROM base

# COPY from the Ollama stage to your final image:
# (Check *which* path works for your version of the image)
COPY --from=ollama-stage /bin/ollama /usr/local/bin/ollama
# or if that fails, try:
# COPY --from=ollama-stage /usr/local/bin/ollama /usr/local/bin/ollama

ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]
CMD ["--help"]