create extension if not exists vector;
create type vector_3072 as (
  data vector(3072)
);

create table if not exists show_notes (
  id serial primary key,
  show_link text,
  channel text,
  channel_url text,
  title text not null,
  description text,
  publish_date text not null,
  cover_image text,
  frontmatter text,
  prompt text,
  transcript text,
  llm_output text,
  wallet_address text,
  mnemonic text,
  llm_service text,
  llm_model text,
  llm_cost numeric,
  transcription_service text,
  transcription_model text,
  transcription_cost numeric,
  final_cost numeric
);

create table if not exists embeddings (
  filename text primary key,
  vector jsonb
);

create index if not exists idx_show_notes_wallet_address on show_notes(wallet_address);
create index if not exists idx_show_notes_publish_date on show_notes(publish_date);
create index if not exists idx_show_notes_title on show_notes(title);