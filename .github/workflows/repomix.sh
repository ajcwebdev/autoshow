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
  --no-git-sort-by-changes \
  --top-files-len 20 \
  --token-count-encoding "o200k_base" \
  --include "docs,scripts,db,src,server.mjs,package.json" \
  --ignore "src/components,src/prompts.ts,src/pages/api/embeddings.ts,src/styles/global.css,src/layouts/Base.astro,src/prisma/migrations"
  # --ignore "src/pages/api/embeddings.ts,README.md,src/prompts.ts,.github/FUNDING.yml,docs,test,.github/workflows,.astro,src/prisma/migrations,.env.example,.gitignore,.npmrc,astro.config.ts,LICENSE,railway.json,tsconfig.json,.github/repomix-instruction.md"

# Check if command was successful
if [ $? -eq 0 ]; then
  echo "Successfully created new-llm.md"
else
  echo "Error running repomix command"
fi