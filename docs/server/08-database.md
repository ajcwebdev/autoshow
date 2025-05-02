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

### Project Initialization

Initialize your local project:

```bash
# Initialize Astro project with database
npm install
npm run setup

# Initialize Supabase configuration
supabase init
```

### Environment Configuration

```bash
# Generate example environment file
npm run scripts/setup-supabase-env.ts

# Copy the example to create your actual .env file
cp .env.supabase.example .env

# Edit .env with your Supabase credentials
```

Your `.env` file should contain:

```
ASTRO_DB_REMOTE_URL="https://your-project-id.supabase.co"
ASTRO_DB_APP_TOKEN="your-supabase-token"
SERVER_MODE=true
AWS_REGION=us-east-2
S3_BUCKET_NAME=autoshow-test
ADMIN_WALLET=your-wallet-address
```

### Link to Supabase Project

You can either create a new Supabase project or use an existing one:

```bash
# Login to Supabase
supabase login

# Create a new project (if needed)
supabase projects create autoshow-project --org-id your-org-id

# Link existing project
supabase link --project-ref your-project-ref
```

### Database Migration Setup

Set up the database with the required extensions:

```bash
# Apply custom migration
npm run scripts/supabase-setup.ts

# Run the generated SQL in Supabase SQL editor
cat migration-supabase.sql | supabase db exec

# Create database tables
npm run db:push:remote
```

## Local Development

### Start Local Services

Start the local development environment:

```bash
# Start local Supabase instance
supabase start

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
supabase db reset
```

### Check Local Status

```bash
# Check status of local Supabase stack
supabase status

# Verify local database
npm run db:verify
```

## Database Operations

### Schema Management

```bash
# Create a new migration
supabase migration new schema_update

# List migrations in both local and remote
supabase migration list

# Apply pending migrations
supabase migration up

# Squash migrations
supabase migration squash
```

### Backup and Restore

```bash
# Manual backup
npm run scripts/backup-database.ts

# Find backup files
ls -la backups/

# Restore from backup
npm run scripts/rollback-migration.ts
```

### Database Inspection

```bash
# Inspect database health
supabase inspect db bloat
supabase inspect db cache-hit
supabase inspect db table-sizes

# Check long-running queries
supabase inspect db long-running-queries

# Generate comprehensive report
supabase inspect report --output-dir ./db-report
```

### Data Management

```bash
# Dump schema without data
supabase db dump -f schema.sql

# Dump data only
supabase db dump --data-only -f data.sql

# Pull schema from remote
supabase db pull
```

## Testing

### Database Tests

```bash
# Run all tests
npm run test:steps
npm run test:prompts
npm run test:models

# Run database-specific tests
npm run scripts/test-db-operations.ts
```

### Test Database Operations

```bash
# Test connection to remote database
npm run scripts/verify-supabase.ts

# Test with specific database URL
supabase db lint --db-url "postgres://username:password@host:port/database"
```

## Deployment

### Prepare for Deployment

```bash
# Verify deployment prerequisites
npm run scripts/verify-deployment.ts

# Install required dependencies
npm run scripts/install-migration-deps.ts
```

### Deploy to Production

```bash
# Build and deploy in one command
npm run deploy

# Alternative manual steps:
npm run build
npm run db:push:remote
```

### Verify Deployment

```bash
# Verify deployment was successful
npm run scripts/post-deployment-verify.ts
```

## Maintenance

### Regular Health Checks

Schedule these checks to maintain database health:

```bash
# Generate regular health report
supabase inspect db bloat
supabase inspect db vacuum-stats
supabase inspect db unused-indexes

# Fix issues with bloated tables (run in Supabase SQL editor)
VACUUM FULL ANALYZE your_bloated_table;
```

### Database Optimization

```bash
# Identify query performance issues
supabase inspect db outliers
supabase inspect db seq-scans

# Find and fix unused indexes
supabase inspect db unused-indexes
```

## Troubleshooting

### Connection Issues

If you encounter connection issues to Supabase:

```bash
# Verify Supabase status
npm run scripts/verify-supabase.ts

# Check network restrictions
supabase network-restrictions get
```

### Migration Problems

If migrations fail:

```bash
# List migration status
supabase migration list

# Repair migration history
supabase migration repair 20230222032233 --status applied
```

### Performance Issues

If experiencing slow queries:

```bash
# Identify slow running queries
supabase inspect db long-running-queries

# Check cache hit rates
supabase inspect db cache-hit

# Look for sequential scans (missing indexes)
supabase inspect db seq-scans
```

### Data Recovery

If you need to recover data:

```bash
# List available backups
ls -la backups/

# Restore from a backup
npm run scripts/rollback-migration.ts
```

## Advanced Usage

### Custom Database Configuration

```bash
# Get current Postgres configuration
supabase postgres-config get

# Update configuration
supabase postgres-config update --config "max_connections=100"

# Reset configuration
supabase postgres-config delete --config "max_connections"
```

### Database Branching (Preview Environments)

```bash
# Create a preview branch for testing
supabase branches create feature-branch --experimental

# List all branches
supabase branches list --experimental

# Delete a branch when done
supabase branches delete feature-branch --experimental
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
        run: npx tsx scripts/post-deployment-verify.ts
```