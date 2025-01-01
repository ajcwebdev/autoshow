# .github/Dockerfile

# ---------------------------------------------------
# 1) Node base image
# ---------------------------------------------------

FROM node:22 AS base

RUN apt-get update && apt-get install -y \
    ffmpeg git make curl docker.io ca-certificates cmake \
    libopenblas-dev && rm -rf /var/lib/apt/lists/*

RUN update-ca-certificates

WORKDIR /usr/src/app

# Install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Install tsx globally
RUN npm install -g tsx

# Install whisper.cpp and download models
RUN git clone https://github.com/ggerganov/whisper.cpp.git && \
    cd whisper.cpp && \
    make && \
    ./models/download-ggml-model.sh base && \
    ./models/download-ggml-model.sh tiny

# Copy package files and install deps
COPY package*.json ./
RUN npm ci

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
    ollama pull llama2 && \
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

EXPOSE 3000
ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]
CMD ["--help"]