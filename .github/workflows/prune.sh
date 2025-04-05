#!/usr/bin/env bash

docker kill $(docker ps -q) 2>/dev/null || true
docker rm -f $(docker ps -aq) 2>/dev/null || true
docker builder prune -af
docker network prune -f
docker image prune -af
docker volume prune -af
docker system prune -af --volumes
docker network rm $(docker network ls -q) 2>/dev/null || true
