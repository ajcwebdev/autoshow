// scripts/supabase-setup.ts

import { writeFileSync } from '../src/utils'

const setupSupabase = async (): Promise<void> => {
  console.log('[supabase-setup] Setting up Supabase...')
  
  try {
    console.log('[supabase-setup] Creating migration SQL for pgvector...')
    const migrationSql = `
-- Enable pgvector extension
create extension if not exists vector;

-- Create custom vector type for embeddings
create type vector_3072 as (
  data vector(3072)
);
`
    
    writeFileSync('migration-supabase.sql', migrationSql)
    console.log('[supabase-setup] Migration SQL created: migration-supabase.sql')
    
    console.log('[supabase-setup] To apply migration:')
    console.log('1. Run this SQL in your Supabase SQL editor')
    console.log('2. Create the tables using astro db push --remote')
    
  } catch (error) {
    console.error('[supabase-setup] Error setting up Supabase:', error)
    throw error
  }
}

export default setupSupabase