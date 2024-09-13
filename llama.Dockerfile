# llama.cpp/Dockerfile

FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    curl \
    libopenblas-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clone llama.cpp repository
RUN git clone https://github.com/ggerganov/llama.cpp.git && \
    cd llama.cpp && \
    git checkout master  # or a specific commit/tag if needed

# Build llama.cpp
RUN cd llama.cpp && \
    mkdir build && \
    cd build && \
    cmake .. && \
    cmake --build . --config Release

# Copy your model file (adjust the path as needed)
COPY models/Meta-Llama-3.1-8B-Instruct.IQ4_XS.gguf /app/models/

# Set the working directory to llama.cpp
WORKDIR /app/llama.cpp

# Command to run when the container starts
ENTRYPOINT ["./build/bin/main"]