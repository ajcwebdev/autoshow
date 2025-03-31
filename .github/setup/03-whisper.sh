#!/usr/bin/env bash
# .github/setup/03-whisper.sh

##############################################################################
# Clones whisper.cpp and downloads models if not present
##############################################################################

if [ -d "whisper.cpp" ]; then
  echo "whisper.cpp already exists, skipping."
else
  echo "Cloning whisper.cpp..."
  git clone https://github.com/ggerganov/whisper.cpp.git &>/dev/null

  echo "Downloading whisper models (tiny, base, large-v3-turbo)..."
  bash ./whisper.cpp/models/download-ggml-model.sh tiny &>/dev/null
  bash ./whisper.cpp/models/download-ggml-model.sh base &>/dev/null
  bash ./whisper.cpp/models/download-ggml-model.sh large-v3-turbo &>/dev/null

  echo "Compiling whisper.cpp..."
  cmake -B whisper.cpp/build -S whisper.cpp &>/dev/null
  cmake --build whisper.cpp/build --config Release &>/dev/null

  rm -rf whisper.cpp/.git
fi