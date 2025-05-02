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
npx astro db verify        # Local
npx astro db verify --remote  # Remote
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
# Push schema changes
npx astro db push          # Local
npx astro db push --remote # To production

# Pull schema from remote
npx supabase db pull
```

## Local Development

```bash
# Start environment
npx supabase start
npm run dev

# Reset local database
npx supabase db reset
```

## Deployment

```bash
# Verify deployment prerequisites
tsx --env-file=.env scripts/verify-deployment.ts

# Deploy to production
npx astro build && npx astro db push --remote

# Alternative manual steps
npm run build
npx astro db push --remote
```

## Database Lifecycle Management

### Data Operations

```bash
# Manual backup
tsx --env-file=.env scripts/backup-database.ts
ls -la backups/

# Export schema/data
npx supabase db dump -f schema.sql
npx supabase db dump --data-only -f data.sql
```

### Testing

```bash
# Database verification
tsx --env-file=.env scripts/test-db-operations.ts
tsx --env-file=.env scripts/verify-supabase.ts

# Lint database
npx supabase db lint --db-url "postgres://username:password@host:port/database"
```

### Maintenance and Troubleshooting

```bash
# Database health and metrics
npx supabase inspect db bloat
npx supabase inspect db cache-hit
npx supabase inspect db table-sizes
npx supabase inspect db long-running-queries

# Regular health checks
npx supabase inspect db vacuum-stats
npx supabase inspect db unused-indexes

# Run in Supabase SQL editor
# VACUUM FULL ANALYZE your_bloated_table;

# Performance optimization
npx supabase inspect db outliers
npx supabase inspect db seq-scans
npx supabase inspect db long-running-queries
npx supabase inspect db cache-hit
npx supabase inspect db unused-indexes

# Generate comprehensive report
npx supabase inspect report --output-dir ./db-report

# Verify connections
tsx --env-file=.env scripts/verify-supabase.ts

# Check network restrictions
npx supabase network-restrictions get

# List available backups
ls -la backups/
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
        run: npx astro build && npx astro db push --remote
        
      - name: Verify deployment
        run: npx tsx scripts/verify-deployment.ts
```