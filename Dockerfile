# Dockerfile

# Use the official Node.js 22 image as the base
FROM node:22

# Install necessary packages
RUN apt-get update && apt-get install -y ffmpeg git make curl docker.io

# Set the working directory
WORKDIR /usr/src/app

# Install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Install tsx globally
RUN npm install -g tsx

# Copy only package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci

# Copy the application source code (excluding files specified in .dockerignore)
COPY src ./src
COPY packages ./packages
COPY docker-entrypoint.sh ./

# Ensure the entrypoint script is executable
RUN chmod +x /usr/src/app/docker-entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]

# Default command (can be overridden)
CMD ["--help"]