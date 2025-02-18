#!/usr/bin/env tsx

/**
 * @file Docker entrypoint script for the Autoshow container.
 *
 * This script handles:
 * 1. Executing Prisma migrations (deploy).
 * 2. Generating the Prisma client.
 * 3. Determining whether to run the Autoshow CLI or server.
 *
 * By default, if no argument is given, it will run the Autoshow server.
 *
 * @param process.argv - The command-line arguments passed to the container
 *
 * @example
 * // Run the server (default if no args are specified):
 * // docker run autoshow
 *
 * @example
 * // Run the server (explicit):
 * // docker run autoshow serve
 *
 * @example
 * // Run the CLI:
 * // docker run autoshow <any-other-command>
 */

import { execSync } from 'node:child_process'
import { argv, exit } from 'node:process'

async function main(): Promise<void> {
  try {
    console.log('Running prisma migrate deploy to ensure DB schema is up to date...')
    execSync('npx prisma migrate deploy --schema=/usr/src/app/prisma/schema.prisma', { stdio: 'inherit' })

    console.log('Generating Prisma client...')
    execSync('npx prisma generate --schema=/usr/src/app/prisma/schema.prisma', { stdio: 'inherit' })
  } catch (error) {
    console.error('Error running migrations or generating Prisma client:', error)
    exit(1)
  }

  const [, , ...args] = argv
  const command = args[0] || 'serve'

  if (command === 'serve') {
    console.log('Starting Autoshow server...')
    const serverArgs = args.slice(1).join(' ')
    try {
      execSync(`npx tsx --no-warnings src/fastify.ts ${serverArgs}`, { stdio: 'inherit' })
    } catch (error) {
      console.error('Server failed to start:', error)
      exit(1)
    }
  } else {
    console.log('Running Autoshow CLI...')
    try {
      execSync(`npx tsx --no-warnings src/commander.ts ${args.join(' ')}`, { stdio: 'inherit' })
    } catch (error) {
      console.error('CLI failed to run:', error)
      exit(1)
    }
  }
}

main()
  .then(() => {})
  .catch(err => {
    console.error('Unexpected error in docker-entrypoint:', err)
    exit(1)
  })