#!/usr/bin/env bash

docker logs autoshow-service
docker-compose -f .github/docker-compose.yml logs
