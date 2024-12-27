#!/bin/sh
# .github/docker-entrypoint.sh

# Run the autoshow command with all arguments passed to the container
# exec tsx --env-file=.env --no-warnings --experimental-sqlite src/cli/commander.ts "$@"
exec tsx --no-warnings --experimental-sqlite src/cli/commander.ts "$@"