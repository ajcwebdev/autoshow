#!/bin/bash

# Check if .env file exists
if [ -f ".env" ]; then
    echo ".env file already exists. Skipping copy of .env.example."
else
    echo ".env file does not exist. Copying .env.example to .env."
    cp .env.example .env
fi

# Check if yt-dlp is installed, if not, install it
if ! command -v yt-dlp &> /dev/null
then
    echo "yt-dlp could not be found, refer to installation instructions for your OS of choice:"
    echo "https://github.com/yt-dlp/yt-dlp/wiki/Installation"
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

# Download Qwen 2.5 1.5B model for Llama.cpp
curl -L "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q6_k.gguf" -o "./src/llms/models/qwen2.5-1.5b-instruct-q6_k.gguf"

# Start Ollama server (allowing Ollama to run without the desktop application) and pull Llama 3.1 1B model
ollama pull llama3.2:1b

echo "Setup completed successfully!"