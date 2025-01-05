# .github/Dockerfile

# ---------------------------------------------------
# 1) Node base image - Using Debian slim for smaller footprint
# ---------------------------------------------------

# 1. Use Node 22-slim as base image
FROM node:22-slim AS base

# 2. Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg git make curl ca-certificates cmake python3 python3-pip \
    libopenblas-dev g++ build-essential \
 && rm -rf /var/lib/apt/lists/* \
 && apt-get clean \
 && update-ca-certificates

# 3. Set working directory to /usr/src/app
WORKDIR /usr/src/app

# 4. Install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp \
 && chmod a+rx /usr/local/bin/yt-dlp

# 5. Install tsx globally
RUN npm install -g tsx

# 6. Clone whisper.cpp at specific tag (v1.7.3)
RUN git clone --depth=1 https://github.com/ggerganov/whisper.cpp.git

# 7. Configure with CMake (verbose output)
RUN cmake -B whisper.cpp/build -S whisper.cpp \
    -DGGML_NATIVE=OFF \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_VERBOSE_MAKEFILE=ON \
    -DWHISPER_BUILD_EXAMPLES=ON

# 8. Build; if it fails, print CMakeError.log & CMakeOutput.log
RUN cmake --build whisper.cpp/build --config Release -j \
 || (cat whisper.cpp/build/CMakeFiles/CMakeError.log && \
     cat whisper.cpp/build/CMakeFiles/CMakeOutput.log && false)

# 9. Print out the files in the build/bin folder for debugging
RUN ls -l whisper.cpp/build/bin || true

# 10. Make sure the whisper-cli binary is executable + symlink to /usr/local/bin
RUN chmod +x /usr/src/app/whisper.cpp/build/bin/whisper-cli \
 && ln -s /usr/src/app/whisper.cpp/build/bin/whisper-cli /usr/local/bin/whisper-cli

# 11. Confirm that whisper-cli is found
RUN ls -l /usr/local/bin/whisper-cli

# 12. Download the “base” and “tiny” models
RUN whisper.cpp/models/download-ggml-model.sh base && \
    whisper.cpp/models/download-ggml-model.sh tiny

# 12a. Expose environment variables to reference model paths
ENV WHISPER_BASE_MODEL=/usr/src/app/whisper.cpp/models/ggml-base.bin
ENV WHISPER_TINY_MODEL=/usr/src/app/whisper.cpp/models/ggml-tiny.bin

# 13. Copy package.json and package-lock.json
COPY package*.json ./

# 14. Install Node deps
RUN npm ci --production && npm cache clean --force

# 15. Copy source code
COPY src ./src

# 16. Copy Docker entrypoint script
COPY .github/docker-entrypoint.sh ./

# 17. Set permissions to make the script executable
RUN chmod +x /usr/src/app/docker-entrypoint.sh

# ---------------------------------------------------
# 2) Setup Ollama with models
# ---------------------------------------------------

# 1. Use the Ollama image as a base
FROM ollama/ollama:latest AS ollama

# 2. Set working directory to Ollama config directory
WORKDIR /root/.ollama

# 3. Start Ollama server and pull models
RUN ollama serve & \
    sleep 10 && \
    ollama pull llama3.2:1b && \
    ollama ls && \
    pkill ollama

# ---------------------------------------------------
# 3) Final stage combining everything
# ---------------------------------------------------

FROM base

# 1. Copy Ollama binary
COPY --from=ollama /bin/ollama /usr/local/bin/ollama

# 2. Copy pre-downloaded models
COPY --from=ollama /root/.ollama /root/.ollama

# Set environment variables for Whisper
ENV WHISPER_FORCE_CPU=1
ENV WHISPER_NO_GPU=1

# 3. Create content directory first
RUN mkdir -p /usr/src/app/content

# 4. Set proper permissions for the entire app directory including content
RUN chown -R node:node /usr/src/app \
 && chmod -R 755 /usr/src/app \
 && chmod 777 /usr/src/app/content \
 && chown -R node:node /root/.ollama \
 && chmod -R 755 /root/.ollama

# Switch to non-root user
USER node

EXPOSE 3000
ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]
CMD ["serve"]