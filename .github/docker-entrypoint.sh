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

# If first argument is "dev", then start the development server with SolidStart.
if [ "$1" = "dev" ]; then
    echo "Starting Autoshow server..."
    shift
    npm run dev "$@" || log_error "Server failed to start"
fi

# Otherwise, run the CLI by default.
echo "Running Autoshow CLI..."
tsx --no-warnings --experimental-sqlite src/commander.ts "$@" || log_error "CLI failed to start"