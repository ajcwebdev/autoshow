# Database Operations Guide

## Outline

- [Setup and Configuration](#setup-and-configuration)
  - [Project Setup](#project-setup)
  - [Environment Management](#environment-management)
- [Schema Management](#schema-management)
  - [Database Verification](#database-verification)
  - [Migrations](#migrations)
  - [Schema Synchronization](#schema-synchronization)
- [Local Development](#local-development)
- [Deployment](#deployment)
- [Database Lifecycle Management](#database-lifecycle-management)
  - [Data Operations](#data-operations)
  - [Testing](#testing)
  - [Maintenance and Troubleshooting](#maintenance-and-troubleshooting)
  - [Database Branching](#database-branching)
  - [CI/CD Integration](#cicd-integration)

## Setup and Configuration

### Project Setup

```bash
# Login to Supabase
npx supabase login

# Link existing project
npx supabase link --project-ref your-project-ref
```

### Environment Management

```bash
# Start local Supabase instance
npx supabase start

# Check status of local Supabase stack
npx supabase status
```

## Schema Management

### Database Verification

```bash
# Verify database schemas
npx supabase db diff
npx supabase db diff --schema public

# Compare local to remote (after linking project)
npx supabase db diff --target-db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Migrations

```bash
# Create and manage migrations
npx supabase migration new schema_update
npx supabase migration list
npx supabase migration up
npx supabase migration squash

# Fix migration issues
npx supabase migration repair 20230222032233 --status applied
```

### Schema Synchronization

```bash
# Pull schema from remote
npx supabase db pull

# Push local migrations to remote
npx supabase db push --db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

## Local Development

```bash
# Start environment with your JWT secret and keys
npx supabase start --jwt-secret super-secret-jwt-token-with-at-least-32-characters-long

# Reset local database
npx supabase db reset --db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

## Deployment

```bash
# Verify deployment prerequisites
tsx --env-file=.env scripts/verify-deployment.ts

# Deploy to production
npx supabase db push

# Generate types from database schema
npx supabase gen types typescript --db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres > types/supabase.ts
```

## Database Lifecycle Management

### Data Operations

```bash
# Manual backup
npx supabase db dump -f backups/schema_$(date +%Y%m%d).sql --db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres
ls -la backups/

# Export schema/data
npx supabase db dump -f schema.sql --db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres
npx supabase db dump --data-only -f data.sql --db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Testing

```bash
# Database verification using your connection string
npx supabase db lint --db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Test database connectivity
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT version()"
```

### Maintenance and Troubleshooting

```bash
# Database health and metrics
npx supabase inspect db bloat --db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres
npx supabase inspect db cache-hit --db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres
npx supabase inspect db table-sizes --db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres
npx supabase inspect db long-running-queries --db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Regular health checks
npx supabase inspect db vacuum-stats --db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres
npx supabase inspect db unused-indexes --db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Run in Supabase SQL editor at http://127.0.0.1:54323
# VACUUM FULL ANALYZE your_bloated_table;

# Generate comprehensive report
npx supabase inspect report --output-dir ./db-report --db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Use S3 storage commands with your keys
npx supabase storage ls --access-key 625729a08b95bf1b7ff351a663f3a23c --secret-key 850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907
```

### Database Branching

```bash
# Preview environments (experimental)
npx supabase branches create feature-branch --experimental
npx supabase branches list --experimental
npx supabase branches delete feature-branch --experimental
```

### CI/CD Integration

```yaml
name: Deploy Database Changes

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Supabase CLI
        run: npm install -g supabase
        
      - name: Link to Supabase project
        run: |
          supabase login --token ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          supabase link --project-ref ${{ secrets.PROJECT_REF }}
        
      - name: Deploy database changes
        run: npx supabase db push
        
      - name: Verify deployment
        run: npx tsx scripts/verify-deployment.ts
```