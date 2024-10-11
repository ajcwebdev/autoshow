#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if .env file exists
if [ -f ".env" ]; then
    echo ".env file already exists. Skipping copy of .env.example."
else
    echo ".env file does not exist. Copying .env.example to .env."
    cp .env.example .env
fi

# Check if yt-dlp is installed, if not, provide installation instructions
if ! command_exists yt-dlp; then
    echo "yt-dlp could not be found, refer to installation instructions here:"
    echo "https://github.com/yt-dlp/yt-dlp/wiki/Installation"
else
    echo "yt-dlp is already installed."
fi

# Check if Ollama is installed
if ! command_exists ollama; then
    echo "Ollama is not installed, refer to installation instructions here:"
    echo "https://github.com/ollama/ollama"
else
    echo "Ollama is installed."
fi

# Check if Ollama server is running
if ! curl -s "http://127.0.0.1:11434" &> /dev/null; then
    echo "Ollama server is not running. Starting Ollama server..."
    ollama serve > ollama.log 2>&1 &
    OLLAMA_PID=$!
    echo "Ollama server started with PID $OLLAMA_PID"
    sleep 5
else
    echo "Ollama server is already running."
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

# Pull Llama 3.1 1B model using Ollama
ollama pull llama3.2:1b

echo "Setup completed successfully!"