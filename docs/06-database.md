# Database Operations Guide

## Outline

- [Database Setup Process](#database-setup-process)
  - [Link to Remote Project](#link-to-remote-project)
  - [Start Local Development](#start-local-development)
  - [Create Migration](#create-migration)
  - [Apply Migrations Locally](#apply-migrations-locally)
  - [Push Migration to Remote](#push-migration-to-remote)
  - [Seed the Database](#seed-the-database)

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