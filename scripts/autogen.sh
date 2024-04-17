#!/bin/bash

autogen() {
    # Check if a URL argument was provided
    if [ "$#" -ne 1 ]; then
        echo "Usage: autogen <URL>"
        return 1
    fi

    # Use the first argument as the URL
    url="$1"

    # Download and extract audio as WAV into the content directory
    yt-dlp --extract-audio \
      --audio-format wav \
      --postprocessor-args "-ar 16000" \
      -o "content/output.wav" \
      "$url"

    # Run the whisper.cpp processing
    ./whisper.cpp/main \
      -m "whisper.cpp/models/ggml-large-v2.bin" \
      -f "content/output.wav" \
      -of "content/transcript" \
      --output-lrc

    node scripts/transform.js transcript

    cat scripts/prompt.md content/transcript.md > content/chatgpt.md
    rm content/output.wav content/transcript.lrc content/transcript.md

    echo "Process completed successfully."
}

# Call autogen function if script is executed, not when sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    autogen "$@"
fi