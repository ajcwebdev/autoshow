#!/usr/bin/env bash
# scripts/setup.sh

# ------------------------------------------------------------------------------
# A single script to set up your environment on macOS (brew) or Linux (apt).
# Installs yt-dlp, ffmpeg, and ollama if they are missing, plus sets up whisper.cpp.
# ------------------------------------------------------------------------------

# ------------------------------------------------------------------------------
# 1. OS DETECTION
# ------------------------------------------------------------------------------
IS_MAC=false
IS_LINUX=false

case "$OSTYPE" in
  darwin*)
    IS_MAC=true
    ;;
  linux*)
    IS_LINUX=true
    ;;
  *)
    echo "Unsupported OS: $OSTYPE"
    echo "Please install dependencies manually."
    exit 1
    ;;
esac

# ------------------------------------------------------------------------------
# 2. HELPER FUNCTIONS
# ------------------------------------------------------------------------------

# Check if a command is available
command_exists() {
  command -v "$1" &>/dev/null
}

# Ensure Homebrew on macOS
ensure_homebrew() {
  if ! command_exists brew; then
    echo "Homebrew is not installed on your system."
    echo "Please install Homebrew from https://brew.sh/ then rerun this script."
    exit 1
  fi
}

# Ensure apt on Linux
ensure_apt() {
  if ! command_exists apt-get; then
    echo "This script requires apt-get, but it was not found."
    echo "Please install dependencies manually, or add logic for your package manager."
    exit 1
  fi
}

# Install package if missing (macOS)
install_if_missing_brew() {
  local pkg=$1
  if ! command_exists "$pkg"; then
    echo "$pkg not found. Installing with Homebrew..."
    brew install "$pkg"
  else
    echo "$pkg is already installed."
  fi
}

# Install package if missing (Linux/apt)
install_if_missing_apt() {
  local pkg=$1
  if ! command_exists "$pkg"; then
    echo "$pkg not found. Installing with apt-get..."
    sudo apt-get update -y
    sudo apt-get install -y "$pkg"
  else
    echo "$pkg is already installed."
  fi
}

# Check if Ollama server is running
check_ollama_server() {
  if curl -s "http://127.0.0.1:11434" &> /dev/null; then
    echo "Ollama server is already running."
  else
    echo "Ollama server is not running. Starting Ollama server..."
    ollama serve > ollama.log 2>&1 &
    OLLAMA_PID=$!
    echo "Ollama server started with PID $OLLAMA_PID"
    # Allow server a few seconds to initialize
    sleep 5
  fi
}

# Check if a model is available, and pull it if not
check_and_pull_model() {
  local model=$1
  if ollama list | grep -q "$model"; then
    echo "Model '$model' is already available."
  else
    echo "Model '$model' is not available. Pulling the model..."
    ollama pull "$model"
  fi
}

# ------------------------------------------------------------------------------
# 3. INSTALL DEPENDENCIES (yt-dlp, ffmpeg, ollama)
# ------------------------------------------------------------------------------

# On macOS, make sure Homebrew is installed and install packages
if [ "$IS_MAC" = true ]; then
  ensure_homebrew
  BREW_PACKAGES=("yt-dlp" "ffmpeg" "ollama")
  for pkg in "${BREW_PACKAGES[@]}"; do
    install_if_missing_brew "$pkg"
  done
fi

# On Linux, we’ll assume apt and install packages
if [ "$IS_LINUX" = true ]; then
  ensure_apt
  
  # There's no official apt package for "ollama" at the time of writing.

  APT_PACKAGES=("yt-dlp" "ffmpeg")
  for pkg in "${APT_PACKAGES[@]}"; do
    install_if_missing_apt "$pkg"
  done
  
  # Check if Ollama is installed
  if ! command_exists ollama; then
    echo "Ollama is not installed. There's no official apt package yet."
    echo "Please follow instructions here: https://github.com/jmorganca/ollama"
    echo "After installing Ollama, re-run this script."
    exit 1
  else
    echo "Ollama is already installed."
  fi
fi

# ------------------------------------------------------------------------------
# 4. SETUP .ENV
# ------------------------------------------------------------------------------
if [ -f ".env" ]; then
  echo ""
  echo ".env file already exists. Skipping copy of .env.example."
  echo ""
else
  echo ""
  echo ".env file does not exist. Copying .env.example to .env."
  echo ""
  cp .env.example .env
fi

# ------------------------------------------------------------------------------
# 5. OLLAMA SERVER AND MODELS
# ------------------------------------------------------------------------------
# If Ollama is installed, let's start the server and pull models
if command_exists ollama; then
  check_ollama_server
#   check_and_pull_model "llama3.2:1b"
  check_and_pull_model "qwen2.5:0.5b"
fi

# ------------------------------------------------------------------------------
# 6. NPM DEPENDENCIES
# ------------------------------------------------------------------------------
echo ""
echo "Installing npm dependencies..."
echo ""
npm install

# ------------------------------------------------------------------------------
# 7. WHISPER.CPP SETUP
# ------------------------------------------------------------------------------
if [ -d "whisper.cpp" ]; then
  echo "whisper.cpp directory already exists. Skipping clone and setup."
else
  echo "Cloning whisper.cpp repository..."
  git clone https://github.com/ggerganov/whisper.cpp.git
  
  echo "Downloading whisper models..."
  bash ./whisper.cpp/models/download-ggml-model.sh tiny
  bash ./whisper.cpp/models/download-ggml-model.sh base
  bash ./whisper.cpp/models/download-ggml-model.sh large-v3-turbo
  
  echo "Compiling whisper.cpp..."
  cmake -B whisper.cpp/build -S whisper.cpp
  cmake --build whisper.cpp/build --config Release
  
  # Optionally remove .git folder to keep workspace clean
  rm -rf whisper.cpp/.git
fi

echo ""
echo "Setup completed successfully!"