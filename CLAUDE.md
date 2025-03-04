# AutoShow Development Guidelines

## Build & Test Commands
```bash
# TypeScript check
npm run check

# Start server (runs Prisma migrations)
npm run start

# Run all CLI tests
npm run cli-all-test

# Run specific test groups
npm run cli-local-test
npm run cli-prompts-test
npm run cli-services-test

# Run server tests
npm run server-local-test
npm run server-all-test

# Run a single test file
npx node --test test/cli/cli-local.test.ts
```

## Code Style Guidelines
- **Naming**: camelCase for variables/functions, PascalCase for classes/interfaces, kebab-case for files
- **Imports**: Group by source (node:* first, then external packages, then local)
- **Types**: Use TypeScript strict mode with explicit types; avoid implicit any/this
- **Error Handling**: Use try/catch with custom logging utilities (err(), l.dim())
- **Structure**: Step-based architecture with utility separation (nn-feature.ts, nn-feature-utils.ts)
- **Comments**: Use JSDoc for functions, parameters, and examples
- **Testing**: Node.js test framework with integration-style verification