#!/bin/sh
# .github/docker-entrypoint.sh

# Enable error logging
set -e

log_error() {
    echo "Error: $1" >&2
    if [ -f "/tmp/cmake_config.log" ]; then
        echo "CMake configuration log:" >&2
        cat /tmp/cmake_config.log >&2
    fi
    if [ -f "/tmp/cmake_build.log" ]; then
        echo "CMake build log:" >&2
        cat /tmp/cmake_build.log >&2
    fi
    exit 1
}

# Start Ollama server in the background
echo "Starting Ollama server..."
ollama serve &

# Wait for Ollama server to start
sleep 5

# If first argument is "serve", then start the server.
if [ "$1" = "serve" ]; then
    echo "Starting Autoshow server..."
    # Remove first arg ("serve") so we don't pass that to the server script.
    shift
    tsx --no-warnings --experimental-sqlite src/server/index.ts "$@" || log_error "Server failed to start"
fi

# Otherwise, run the CLI by default.
echo "Running Autoshow CLI..."
tsx --no-warnings --experimental-sqlite src/commander.ts "$@" || log_error "CLI failed to start"