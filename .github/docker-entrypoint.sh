#!/bin/sh
# .github/docker-entrypoint.sh

# If first argument is "serve", then start the server.
if [ "$1" = "serve" ]; then
    echo "Starting Autoshow server..."
    # Remove first arg ("serve") so we don't pass that to the server script.
    shift
    exec tsx --no-warnings --experimental-sqlite src/server/index.ts "$@"
fi

# Otherwise, run the CLI by default.
echo "Running Autoshow CLI..."
exec tsx --no-warnings --experimental-sqlite src/cli/commander.ts "$@"