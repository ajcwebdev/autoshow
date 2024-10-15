#!/bin/bash

# Clone the repository
git clone https://github.com/MahmoudAshraf97/whisper-diarization.git

# Create and activate virtual environment
python3.12 -m venv whisper-diarization/venv
source whisper-diarization/venv/bin/activate

# Install the requirements
pip install -c whisper-diarization/constraints.txt -r whisper-diarization/requirements.txt

echo "Setup complete. To activate this environment in the future, run:"
echo "source whisper-diarization/venv/bin/activate"
echo ""
echo "To deactivate this environment, run:"
echo "deactivate"