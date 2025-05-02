# Database

## Outline

- [Initial Setup](#initial-setup)
- [Local Development](#local-development)
- [Database Operations](#database-operations)
- [Testing](#testing)
- [Deployment](#deployment)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

## Initial Setup

### Link to Supabase Project

You can either create a new Supabase project or use an existing one:

```bash
# Login to Supabase
npx supabase login

# Link existing project
npx supabase link --project-ref your-project-ref
```

## Local Development

### Start Local Services

Start the local development environment:

```bash
# Start local Supabase instance
npx supabase start

# Start the application
npm run dev
```

### Local Database Operations

```bash
# Access local database shell
npm run db:shell

# Push local schema changes
npm run db:push

# Reset local database (wipes data)
npx supabase db reset
```

### Check Local Status

```bash
# Check status of local Supabase stack
npx supabase status

# Verify local database
npm run db:verify
```

## Database Operations

### Schema Management

```bash
# Create a new migration
npx supabase migration new schema_update

# List migrations in both local and remote
npx supabase migration list

# Apply pending migrations
npx supabase migration up

# Squash migrations
npx supabase migration squash
```

### Backup and Restore

```bash
# Manual backup
tsx --env-file=.env scripts/backup-database.ts

# Find backup files
ls -la backups/
```

### Database Inspection

```bash
# Inspect database health
npx supabase inspect db bloat
npx supabase inspect db cache-hit
npx supabase inspect db table-sizes

# Check long-running queries
npx supabase inspect db long-running-queries

# Generate comprehensive report
npx supabase inspect report --output-dir ./db-report
```

### Data Management

```bash
# Dump schema without data
npx supabase db dump -f schema.sql

# Dump data only
npx supabase db dump --data-only -f data.sql

# Pull schema from remote
npx supabase db pull
```

## Testing

### Database Tests

```bash
# Run all tests
npm run test:steps
npm run test:prompts
npm run test:models

# Run database-specific tests
tsx --env-file=.env scripts/test-db-operations.ts
```

### Test Database Operations

```bash
# Test connection to remote database
tsx --env-file=.env scripts/verify-supabase.ts

# Test with specific database URL
npx supabase db lint --db-url "postgres://username:password@host:port/database"
```

## Deployment

### Prepare for Deployment

```bash
# Verify deployment prerequisites
tsx --env-file=.env scripts/verify-deployment.ts
```

### Deploy to Production

```bash
# Build and deploy in one command
npm run deploy

# Alternative manual steps:
npm run build
npm run db:push:remote
```

## Maintenance

### Regular Health Checks

Schedule these checks to maintain database health:

```bash
# Generate regular health report
npx supabase inspect db bloat
npx supabase inspect db vacuum-stats
npx supabase inspect db unused-indexes

# Fix issues with bloated tables (run in Supabase SQL editor)
VACUUM FULL ANALYZE your_bloated_table;
```

### Database Optimization

```bash
# Identify query performance issues
npx supabase inspect db outliers
npx supabase inspect db seq-scans

# Find and fix unused indexes
npx supabase inspect db unused-indexes
```

## Troubleshooting

### Connection Issues

If you encounter connection issues to Supabase:

```bash
# Verify Supabase status
tsx --env-file=.env scripts/verify-supabase.ts

# Check network restrictions
npx supabase network-restrictions get
```

### Migration Problems

If migrations fail:

```bash
# List migration status
npx supabase migration list

# Repair migration history
npx supabase migration repair 20230222032233 --status applied
```

### Performance Issues

If experiencing slow queries:

```bash
# Identify slow running queries
npx supabase inspect db long-running-queries

# Check cache hit rates
npx supabase inspect db cache-hit

# Look for sequential scans (missing indexes)
npx supabase inspect db seq-scans
```

### Data Recovery

If you need to recover data:

```bash
# List available backups
ls -la backups/
```

## Advanced Usage

### Custom Database Configuration

```bash
# Get current Postgres configuration
npx supabase postgres-config get

# Update configuration
npx supabase postgres-config update --config "max_connections=100"

# Reset configuration
npx supabase postgres-config delete --config "max_connections"
```

### Database Branching (Preview Environments)

```bash
# Create a preview branch for testing
npx supabase branches create feature-branch --experimental

# List all branches
npx supabase branches list --experimental

# Delete a branch when done
npx supabase branches delete feature-branch --experimental
```

### Automated CI/CD Integration

For GitHub Actions CI/CD pipeline:

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
        run: npm run deploy
        
      - name: Verify deployment
        run: npx tsx scripts/verify-deployment.ts
```