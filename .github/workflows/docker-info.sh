#!/usr/bin/env bash

docker images
docker-compose -f .github/docker-compose.yml images
docker ps
docker-compose -f .github/docker-compose.yml ps
docker volume ls
