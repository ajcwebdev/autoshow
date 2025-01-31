# .github/Dockerfile

# 1. Use Node 22-slim as base image
FROM node:22-alpine AS base

# 2. Install system dependencies
RUN apk add --no-cache \
    ffmpeg git wget ca-certificates cmake python3 build-base \
 && update-ca-certificates

# 3. Set working directory to /usr/src/app
WORKDIR /usr/src/app

# 4. Install yt-dlp
RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -O /usr/local/bin/yt-dlp \
 && chmod a+rx /usr/local/bin/yt-dlp

# 5. Install tsx globally
RUN npm install -g tsx

# 6. Clone whisper.cpp
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
COPY shared ./shared

# 16. Copy Docker entrypoint script
COPY .github/docker-entrypoint.sh ./

# 17. Set permissions to make the script executable
RUN chmod +x /usr/src/app/docker-entrypoint.sh

# 18. Set environment variables for Whisper
ENV WHISPER_FORCE_CPU=1
ENV WHISPER_NO_GPU=1

# 19. Create content directory first
RUN mkdir -p /usr/src/app/content

# 20. Set proper permissions for the entire app directory including content
RUN chown -R node:node /usr/src/app \
 && chmod -R 755 /usr/src/app \
 && chmod 777 /usr/src/app/content

# 21. Switch to non-root user
USER node

# 22. Expose port 3000
EXPOSE 3000

# 23. Set the entrypoint and default command
ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]
CMD ["serve"]