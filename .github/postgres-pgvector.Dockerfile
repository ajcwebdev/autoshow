# .github/postgres-pgvector.Dockerfile

# docker build -t custom-pgvector -f .github/postgres-pgvector.Dockerfile .

FROM postgres:17
RUN apt-get update && apt-get install -y postgresql-17-pgvector