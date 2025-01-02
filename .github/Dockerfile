# .github/Dockerfile

# ---------------------------------------------------
# 1) Node base image - Using Debian slim for smaller footprint
# ---------------------------------------------------

FROM node:22-slim AS base

# Install only required system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg git make curl ca-certificates cmake python3 python3-pip \
    libopenblas-dev g++ build-essential && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

RUN update-ca-certificates

WORKDIR /usr/src/app

# Install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Install tsx globally
RUN npm install -g tsx

# Install whisper.cpp and download models
RUN git clone --depth=1 https://github.com/ggerganov/whisper.cpp.git && \
    cd whisper.cpp && \
    cmake -B build && \
    cmake --build build -j --config Release && \
    ./models/download-ggml-model.sh large-v3-turbo && \
    ./models/download-ggml-model.sh base && \
    ./models/download-ggml-model.sh tiny && \
    rm -rf .git

# Copy package files and install deps
COPY package*.json ./
RUN npm ci --production && npm cache clean --force

# Copy source code
COPY src ./src
COPY .github/docker-entrypoint.sh ./
RUN chmod +x /usr/src/app/docker-entrypoint.sh

# ---------------------------------------------------
# 2) Setup Ollama with models
# ---------------------------------------------------

FROM ollama/ollama:latest AS ollama
WORKDIR /root/.ollama

# Start Ollama server and pull models
RUN ollama serve & \
    sleep 10 && \
    ollama pull llama3.2:1b && \
    pkill ollama

# ---------------------------------------------------
# 3) Final stage combining everything
# ---------------------------------------------------

FROM base

# Copy Ollama binary and the pre-downloaded models
COPY --from=ollama /bin/ollama /usr/local/bin/ollama
COPY --from=ollama /root/.ollama /root/.ollama

# Create content directory
RUN mkdir -p content

# Set proper permissions
# RUN chown -R node:node /usr/src/app

# Use non-root user
# USER node

EXPOSE 3000
ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]
CMD ["serve"]