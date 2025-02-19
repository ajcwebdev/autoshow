#!/usr/bin/env bash
# .github/setup/03-ollama.sh

##############################################################################
# Checks if Ollama is installed and starts the server + pulls model
##############################################################################

if command_exists ollama; then
  echo "Checking if Ollama server is running..."
  if curl -s "http://127.0.0.1:11434" &>/dev/null; then
    echo "Ollama server is already running."
  else
    echo "Starting Ollama server..."
    ollama serve > ollama.log 2>&1 &
    sleep 5
  fi

  echo "Checking if 'qwen2.5:0.5b' model is available..."
  if ollama list | grep -q "qwen2.5:0.5b"; then
    echo "'qwen2.5:0.5b' model is already available."
  else
    echo "Pulling 'qwen2.5:0.5b' model..."
    ollama pull "qwen2.5:0.5b"
  fi
fi