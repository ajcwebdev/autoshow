# .github/whisper.Dockerfile

# Use the Ubuntu 22.04 base image for the build stage
FROM ubuntu:22.04 AS build

# Set the working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y build-essential libopenblas-dev pkg-config git wget && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# Clone the whisper.cpp repository into the container
RUN git clone https://github.com/ggerganov/whisper.cpp.git .

# Build the whisper.cpp project with OpenBLAS support
RUN make clean && make GGML_OPENBLAS=1

# Use the Ubuntu 22.04 base image for the runtime stage
FROM ubuntu:22.04 AS runtime

# Set the working directory
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y curl ffmpeg libopenblas-dev git wget && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# Copy the built binaries and scripts from the build stage
COPY --from=build /app /app

# Ensure that the main executable and scripts have execute permissions
RUN chmod +x /app/main && \
    chmod +x /app/models/download-ggml-model.sh

# Set the entrypoint to bash
ENTRYPOINT [ "bash", "-c" ]