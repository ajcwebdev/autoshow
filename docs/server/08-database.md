# Database Operations Guide

## Outline

- [Database Setup Process](#database-setup-process)
  - [Link to Remote Project](#link-to-remote-project)
  - [Start Local Development](#start-local-development)
  - [Create Migration](#create-migration)
  - [Apply Migrations Locally](#apply-migrations-locally)
  - [Push Migration to Remote](#push-migration-to-remote)
  - [Seed the Database](#seed-the-database)
- [Database Verification](#database-verification)
  - [CI/CD Integration](#cicd-integration)

## Database Setup Process

### Link to Remote Project

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

### Start Local Development

```bash
npx supabase start
```

Verify services are running:

```bash
npx supabase status
```

### Create Migration

```bash
npx supabase migration new initial_schema
```

### Apply Migrations Locally

```bash
npx supabase migration up
```

Verify migration applied:

```bash
npx supabase db dump
```

### Push Migration to Remote

```bash
npx supabase db push
```

Verify remote changes:

```bash
npx supabase db pull
```

### Seed the Database

```bash
npx tsx --env-file=.env db/seed.ts
```

## Database Verification

If you encounter issues:

```bash
# Reset local database
npx supabase db reset

# View detailed migration status
npx supabase migration repair

# Force apply migrations
npx supabase db push --db-only
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