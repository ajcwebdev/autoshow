# .github/Dockerfile

FROM node:22-alpine AS base

RUN apk add --no-cache \
    ffmpeg git wget curl ca-certificates python3 build-base postgresql-client \
 && update-ca-certificates

WORKDIR /usr/src/app

RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -O /usr/local/bin/yt-dlp \
 && chmod a+rx /usr/local/bin/yt-dlp

COPY package*.json ./
RUN npm ci --production --legacy-peer-deps && npm cache clean --force

COPY prisma ./prisma
COPY src ./src
COPY shared ./shared
COPY content ./content

# Add a quick check to verify 'content' folder is actually present
RUN ls -la && ls -la content

RUN npx prisma generate --schema=/usr/src/app/prisma/schema.prisma \
 && chown -R node:node /usr/src/app \
 && chmod -R 755 /usr/src/app \
 && chmod 777 /usr/src/app/content

USER node
EXPOSE 3000
ENTRYPOINT [ "npm", "start" ]
