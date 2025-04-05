#!/usr/bin/env bash

docker-compose -f .github/docker-compose.yml --env-file .env down --remove-orphans --volumes
