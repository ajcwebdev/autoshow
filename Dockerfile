# Dockerfile

FROM node:20

# Install ffmpeg, git, make, and curl
RUN apt-get update && apt-get install -y ffmpeg git make curl docker.io
WORKDIR /usr/src/app

# Install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Copy package.json, package-lock.json, and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application and create a directory for content
COPY . .
RUN mkdir -p /usr/src/app/content

# Make sure the entrypoint script is executable and set the entrypoint
RUN chmod +x /usr/src/app/docker-entrypoint.sh
ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]

# Default command (can be overridden)
CMD ["--help"]