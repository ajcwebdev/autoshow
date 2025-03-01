# .github/postgres-pgvector.Dockerfile

FROM postgres:16
RUN apt-get update && apt-get install -y postgresql-16-pgvector