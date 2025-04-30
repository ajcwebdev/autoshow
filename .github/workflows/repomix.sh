#!/bin/zsh

# Script to run repomix on the current repository
# Creates a summary in markdown format

# Run repomix command
repomix \
  --instruction-file-path ".github/repomix-instruction.md" \
  --output "new-llm.md" \
  --style markdown \
  --remove-comments \
  --remove-empty-lines \
  --top-files-len 5 \
  --token-count-encoding "o200k_base" \
  --ignore "test,.github,.github/workflows/,.github/*.md,.github/FUNDING.yml,content/,docs/,src/prisma/migrations/,src/images/,src/prompts/sections.ts,src/utils/embeddings/create-embed.ts,src/utils/embeddings/query-embed.ts,test/models.test.ts,test/prompts.test.ts,public,.astro,src/env.d.ts,.gitignore,.npmrc,src/pages/404.astro,src/styles,README.md,tsconfig.json,.dockerignore,.env,.env.example,.gitignore,LICENSE,new-llm.md,new-*.md,new*.md,package-lock.json,railway.json,README.md,repomix.config.json,tsconfig.json"

# Check if command was successful
if [ $? -eq 0 ]; then
  echo "Successfully created new-llm.md"
else
  echo "Error running repomix command"
fi