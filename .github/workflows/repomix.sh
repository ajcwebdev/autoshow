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
  --ignore ".astro,src/prisma/migrations,src/components,.env.example,.gitignore,.npmrc,astro.config.ts,LICENSE,railway.json,tsconfig.json,.github/repomix-instruction.md"

# Check if command was successful
if [ $? -eq 0 ]; then
  echo "Successfully created new-llm.md"
else
  echo "Error running repomix command"
fi