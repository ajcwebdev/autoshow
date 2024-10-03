#!/bin/bash

# Copy environment file
cp .env.example .env

# Check if yt-dlp is installed, if not, install it
if ! command -v yt-dlp &> /dev/null
then
    echo "yt-dlp could not be found, installing now..."
    brew install yt-dlp
else
    echo "yt-dlp is already installed."
fi

# Install npm dependencies
npm i

# Clone whisper.cpp repository
git clone https://github.com/ggerganov/whisper.cpp.git

# Download whisper models
bash ./whisper.cpp/models/download-ggml-model.sh base
bash ./whisper.cpp/models/download-ggml-model.sh large-v2

# Compile whisper.cpp
make -C whisper.cpp

# Copy Dockerfile
cp .github/whisper.Dockerfile whisper.cpp/Dockerfile

# Download Llama model
curl -L "https://huggingface.co/mradermacher/Llama-3.2-1B-i1-GGUF/resolve/main/Llama-3.2-1B.i1-Q6_K.gguf" -o "./src/llms/models/Llama-3.2-1B.i1-Q6_K.gguf"

echo "Setup completed successfully!"