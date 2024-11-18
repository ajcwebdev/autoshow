#!/bin/bash
# scripts/setup.sh

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

# Function to check if Ollama server is running
check_ollama_server() {
    if curl -s "http://127.0.0.1:11434" &> /dev/null; then
        echo "Ollama server is already running."
    else
        echo "Ollama server is not running. Starting Ollama server..."
        ollama serve > ollama.log 2>&1 &
        OLLAMA_PID=$!
        echo "Ollama server started with PID $OLLAMA_PID"
        sleep 5
    fi
}

# Function to check if a model is available, and pull it if not
check_and_pull_model() {
    local model=$1
    if ollama list | grep -q "$model"; then
        echo "Model $model is already available."
    else
        echo "Model $model is not available. Pulling the model..."
        ollama pull "$model"
    fi
}

# Check if Ollama is installed
if ! command_exists ollama; then
    echo "Ollama is not installed, refer to installation instructions here:"
    echo "https://github.com/ollama/ollama"
else
    echo "Ollama is installed."
    
    # Check if Ollama server is running
    check_ollama_server
    
    # Check and pull required models
    check_and_pull_model "llama3.2:1b" && check_and_pull_model "llama3.2:3b"
fi

# Install npm dependencies
npm i

# Check if whisper.cpp directory exists
if [ -d "whisper.cpp" ]; then
    echo "whisper.cpp directory already exists. Skipping clone and setup."
else
    echo "Cloning whisper.cpp repository..."
    git clone https://github.com/ggerganov/whisper.cpp.git
    
    # Download whisper models
    echo "Downloading whisper models..."
    bash ./whisper.cpp/models/download-ggml-model.sh tiny
    bash ./whisper.cpp/models/download-ggml-model.sh base
    bash ./whisper.cpp/models/download-ggml-model.sh large-v3-turbo
    
    # Compile whisper.cpp
    echo "Compiling whisper.cpp..."
    make -C whisper.cpp
    
    # Copy Dockerfile
    echo "Copying Dockerfile..."
    cp .github/whisper.Dockerfile whisper.cpp/Dockerfile
    cp .github/whisper.dockerignore whisper.cpp/.dockerignore
    rm -rf whisper.cpp/.git
fi

echo "Setup completed successfully!"