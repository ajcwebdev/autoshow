// scripts/install-migration-deps.ts

import { execPromise } from '../src/utils'

const installMigrationDependencies = async (): Promise<void> => {
  console.log('[install-deps] Starting migration dependency installation...')
  
  try {
    console.log('[install-deps] Installing Astro DB...')
    await execPromise('npx astro add db')
    
    console.log('[install-deps] Installing Supabase client...')
    await execPromise('npm install @supabase/supabase-js')
    
    console.log('[install-deps] Installing additional dependencies...')
    await execPromise('npm install pg-dump dotenv')
    
    console.log('[install-deps] All dependencies installed successfully')
    
  } catch (error) {
    console.error('[install-deps] Failed to install dependencies:', error)
    throw error
  }
}

export default installMigrationDependencies