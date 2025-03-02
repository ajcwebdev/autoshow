# .github/Dockerfile

FROM node:22-alpine AS base

# 1. Install system dependencies + psql client
RUN apk add --no-cache \
    ffmpeg git wget curl ca-certificates cmake python3 build-base postgresql-client \
 && update-ca-certificates

# 2. Set working directory
WORKDIR /usr/src/app

# 3. Install yt-dlp
RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -O /usr/local/bin/yt-dlp \
 && chmod a+rx /usr/local/bin/yt-dlp

# 4. Install tsx globally
RUN npm install -g tsx

# 5. Clone whisper.cpp
RUN git clone --depth=1 https://github.com/ggerganov/whisper.cpp.git

# 6. CMake config
RUN cmake -B whisper.cpp/build -S whisper.cpp \
    -DGGML_NATIVE=OFF \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_VERBOSE_MAKEFILE=ON \
    -DWHISPER_BUILD_EXAMPLES=ON

# 7. Build
RUN cmake --build whisper.cpp/build --config Release -j \
 || (cat whisper.cpp/build/CMakeFiles/CMakeError.log && \
     cat whisper.cpp/build/CMakeFiles/CMakeOutput.log && false)

# 8. Debug listing
RUN ls -l whisper.cpp/build/bin || true

# 9. Symlink whisper-cli
RUN chmod +x /usr/src/app/whisper.cpp/build/bin/whisper-cli \
 && ln -s /usr/src/app/whisper.cpp/build/bin/whisper-cli /usr/local/bin/whisper-cli

# 10. Confirm whisper-cli
RUN ls -l /usr/local/bin/whisper-cli

# 11. Download the “base”, “tiny”, and “large-v3-turbo” models
RUN whisper.cpp/models/download-ggml-model.sh base
RUN whisper.cpp/models/download-ggml-model.sh tiny
    # whisper.cpp/models/download-ggml-model.sh large-v3-turbo

# 12. Expose environment variables for model paths
ENV WHISPER_BASE_MODEL=/usr/src/app/whisper.cpp/models/ggml-base.bin
ENV WHISPER_TINY_MODEL=/usr/src/app/whisper.cpp/models/ggml-tiny.bin
ENV WHISPER_FORCE_CPU=1
ENV WHISPER_NO_GPU=1

# 13. Copy package files + install Node deps
COPY package*.json ./
RUN npm ci --production --legacy-peer-deps && npm cache clean --force

# 14. Copy prisma folder so we have `prisma/schema.prisma` and copy source code
COPY prisma ./prisma
COPY src ./src
COPY shared ./shared

# 15. Generate the Prisma client
RUN npx prisma generate --schema=/usr/src/app/prisma/schema.prisma

# 16. Create + set permissions on content directory
RUN mkdir -p /usr/src/app/content \
 && chown -R node:node /usr/src/app \
 && chmod -R 755 /usr/src/app \
 && chmod 777 /usr/src/app/content

# 17. Switch to non-root user
USER node

# 18. Expose port 3000
EXPOSE 3000

# 19. Always run server
ENTRYPOINT [ "npm", "start" ]