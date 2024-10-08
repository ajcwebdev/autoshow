#!/bin/sh

# docker-entrypoint.sh
# Run the autoshow command with all arguments passed to the container
exec tsx --env-file=.env --no-warnings src/autoshow.ts "$@"