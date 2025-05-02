#!/bin/zsh

# Script to run repomix on the current repository
# Creates a summary in markdown format

# Run repomix command
repomix \
  --instruction-file-path ".github/repomix-instruction.md" \
  --output "new-llm.xml" \
  --style xml \
  --remove-comments \
  --remove-empty-lines \
  --no-git-sort-by-changes \
  --top-files-len 20 \
  --token-count-encoding "o200k_base" \
  --include "docs/server/08-database.md,docs/server/05-step-endpoints.md,scripts,db,src,server.mjs,package.json" \
  --ignore "src/prompts.ts,src/pages/api/embeddings.ts,src/styles/global.css,src/layouts/Base.astro,src/prisma/migrations"

# Check if command was successful
if [ $? -eq 0 ]; then
  echo "Successfully created new-llm.md"
else
  echo "Error running repomix command"
fi