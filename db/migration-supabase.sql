
-- Enable pgvector extension
create extension if not exists vector;

-- Create custom vector type for embeddings
create type vector_3072 as (
  data vector(3072)
);
