#!/bin/sh

# docker-entrypoint.sh
# Run the autoshow command with all arguments passed to the container
exec node --env-file=.env --no-warnings src/autoshow.js "$@"