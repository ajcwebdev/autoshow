#!/usr/bin/env bash

docker-compose -f .github/docker-compose.yml exec -T autoshow-postgres \
  psql -U myuser -d mydatabase -t -q \
    --set AUTOCOMMIT=on \
    --set ON_ERROR_STOP=on \
    -c "SELECT row_to_json(s) FROM show_notes s"
