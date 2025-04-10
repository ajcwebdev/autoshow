# .github/Dockerfile

FROM node:22-alpine AS base

# 1. Install system dependencies + psql client
RUN apk add --no-cache \
    ffmpeg git wget curl ca-certificates python3 build-base postgresql-client \
 && update-ca-certificates

# 2. Set working directory
WORKDIR /usr/src/app

# 3. Install yt-dlp
RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -O /usr/local/bin/yt-dlp \
 && chmod a+rx /usr/local/bin/yt-dlp

# 4. Copy package files + install Node deps
COPY package*.json ./
RUN npm ci --production --legacy-peer-deps && npm cache clean --force

# 5. Copy prisma folder so we have `prisma/schema.prisma` and copy source code
COPY prisma ./prisma
COPY src ./src
COPY shared ./shared

# 6. Generate the Prisma client
RUN npx prisma generate --schema=/usr/src/app/prisma/schema.prisma

# 7. Create + set permissions on content directory
RUN mkdir -p /usr/src/app/content \
 && chown -R node:node /usr/src/app \
 && chmod -R 755 /usr/src/app \
 && chmod 777 /usr/src/app/content

# 8. Switch to non-root user
USER node

# 9. Expose port 3000
EXPOSE 3000

# 10. Always run server
ENTRYPOINT [ "npm", "start" ]