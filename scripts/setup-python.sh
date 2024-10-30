#!/bin/bash

# scripts/setup-python.sh

# Clone the repository if it doesn't exist
if [ ! -d "whisper-diarization" ]; then
  echo "Cloning the whisper-diarization repository..."
  git clone https://github.com/MahmoudAshraf97/whisper-diarization.git
  rm -rf whisper-diarization/.git
else
  echo "whisper-diarization repository already exists. Skipping clone."
fi

# Create the virtual environment if it doesn't exist
if [ ! -f "whisper-diarization/venv/bin/activate" ]; then
  echo "Creating virtual environment..."
  python3.12 -m venv whisper-diarization/venv
else
  echo "Virtual environment already exists. Skipping creation."
fi

# Install requirements if not already installed
if [ ! -f "whisper-diarization/.requirements_installed" ]; then
  echo "Installing requirements..."
  source whisper-diarization/venv/bin/activate
  pip install -c whisper-diarization/constraints.txt -r whisper-diarization/requirements.txt
  deactivate
  touch whisper-diarization/.requirements_installed
else
  echo "Requirements already installed. Skipping installation."
fi

echo "Setup complete. To activate this environment in the future, run:"
echo "source whisper-diarization/venv/bin/activate"
echo ""
echo "To deactivate this environment, run:"
echo "deactivate"