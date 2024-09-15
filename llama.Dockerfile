# llama.cpp/Dockerfile

FROM --platform=linux/arm64 ubuntu:22.04 AS build

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y build-essential libopenblas-dev pkg-config git curl && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# Copy the local llama.cpp directory into the Docker image
COPY . .

# Clean any previous builds
RUN make clean

# Build llama.cpp with OpenBLAS support
RUN make LLAMA_OPENBLAS=1

FROM --platform=linux/arm64 ubuntu:22.04 AS runtime

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y curl libopenblas-dev && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# Copy the built llama.cpp binaries from the build stage
COPY --from=build /app /app

ENTRYPOINT [ "bash", "-c" ]