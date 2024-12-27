#!/bin/sh
# .github/docker-entrypoint.sh

# Check if running from correct directory structure
if [ ! -d "/usr/src/app/content" ]; then
    echo "Error: content directory not mounted. Did you run from autoshow root with proper volume mount?"
    exit 1
fi

# Run the autoshow command with all arguments passed to the container
exec tsx --no-warnings --experimental-sqlite src/cli/commander.ts "$@"