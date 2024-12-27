# Autoshow Package Scripts

A list of scripts in Autoshow's `package.json` along with explanations for what each script does.

## Outline

- [Setup Scripts](#setup-scripts)
  - [`setup`](#setup)
  - [`setup-all`](#setup-all)
- [Base, Main, and Serve Commands](#base,-main,-and-serve-commands)
  - [`tsx:base`](#tsx:base)
  - [`as`](#as)
  - [`serve`](#serve)
- [Process Commands](#process-commands)
  - [`video`](#video)
  - [`urls`](#urls)
  - [`playlist`](#playlist)
  - [`file`](#file)
  - [`rss`](#rss)
  - [`info`](#info)
- [Test Commands](#test-commands)
  - [`test-local`](#test-local)
  - [`test-docker`](#test-docker)
  - [`test-services`](#test-services)
  - [`test-all`](#test-all)
  - [`t`](#t)
  - [`clean`](#clean)
  - [`test-server-local`](#test-server-local)
  - [`test-server-all`](#test-server-all)
- [Benchmarking Commands](#benchmarking-commands)
- [Docker Commands](#docker-commands)
  - [`docker-setup`](#docker-setup)
  - [`docker-cli`](#docker-cli)
  - [`docker-serve`](#docker-serve)
- [`bun`](#bun)
- [`deno`](#deno)

## Setup Scripts

### `setup`

Executes the `setup.sh` bash script located in the `./scripts/` directory. Initializes the project by installing necessary dependencies and performing initial configuration tasks.

```json
"setup": "bash ./scripts/setup.sh"
```

### `setup-all`

Runs all setup scripts sequentially to fully initialize the project.

- `npm run setup`: Initializes the project.
- `npm run docker-setup`: Prepares the Docker environment.

```json
"setup-all": "npm run setup && npm run docker-setup"
```

## Base, Main, and Serve Commands

### `tsx:base`

Sets up a base command for running TypeScript files using `tsx`, a TypeScript execution environment. This script includes common options that are reused in other scripts.

- `--env-file=.env`: Loads environment variables from a `.env` file.
- `--no-warnings`: Suppresses warnings during execution.
- `--experimental-sqlite`: Enables experimental SQLite features.

```json
"tsx:base": "tsx --env-file=.env --no-warnings --experimental-sqlite"
```

### `as`

Executes the main command-line interface (CLI) application. Runs `src/cli/commander.ts` using `tsx` with the base options defined in `tsx:base`.

```json
"as": "npm run tsx:base -- src/cli/commander.ts"
```

### `serve`

Starts the server in watch mode, recompiling on changes. Runs `src/server/index.ts`, the server entry point.

- `--watch`: Enables watch mode.
- `--experimental-sqlite`: Enables experimental SQLite features.

```json
"serve": "npm run tsx:base -- --watch --experimental-sqlite src/server/index.ts"
```

## Process Commands

### `video`

Processes a single YouTube video using the CLI. Runs the main CLI script with the `--video` option.

```json
"video": "npm run as -- --video"
```

### `urls`

Processes a list of YouTube URLs from a file. Runs the CLI with the `--urls` option.

```json
"urls": "npm run as -- --urls"
```

### `playlist`

Processes all videos in a YouTube playlist. Runs the CLI with the `--playlist` option.

```json
"playlist": "npm run as -- --playlist"
```

### `file`

Processes a local audio or video file. Runs the CLI with the `--file` option.

```json
"file": "npm run as -- --file"
```

### `rss`

Processes a podcast RSS feed. Runs the CLI with the `--rss` option.

```json
"rss": "npm run as -- --rss"
```

### `info`

Generates JSON files containing metadata information. Runs the CLI with the `--info` option which is useful for retrieving information without processing the content.

```json
"info": "npm run as -- --info"
```

## Test Commands

### `test-local`

Runs local unit tests. Executes `test/local.test.ts` using `tsx` in test mode.

```json
"test-local": "tsx --test test/local.test.ts"
```

### `test-docker`

Runs tests related to Docker services. Executes `test/docker.test.ts` to verify Docker integrations.

```json
"test-docker": "tsx --test test/docker.test.ts"
```

### `test-services`

Tests external services and APIs used by the application. Runs `test/services.test.ts` to ensure service integrations are functioning.

```json
"test-services": "tsx --test test/services.test.ts"
```

### `test-all`

Runs all tests including:

- Local tests.
- Service integration tests.
- Docker-related tests.

```json
"test-all": "tsx --test test/all.test.ts"
```

### `t`

Alias for the `test-local` script. Provides a shorthand command for running local tests.

```json
"t": "npm run test-local"
```

### `test-server-local`

Tests the local server functionality. Runs `src/server/tests/fetch-local.ts` using `tsx`.

```json
"test-server-local": "npm run tsx:base -- src/server/tests/fetch-local.ts"
```

### `test-server-all`

Tests all server functionalities. Runs `src/server/tests/fetch-all.ts` using `tsx`.

```json
"test-server-all": "npm run tsx:base -- src/server/tests/fetch-all.ts"
```

## Benchmarking Commands

Runs performance benchmarks for different configurations or dataset sizes.

- Each script runs a specific test file located in the `test/bench/` directory.
- Helps in assessing the performance and scalability of the application.

Scripts include:

- `bench-tiny`: `tsx --test test/bench/tiny.test.ts`
- `bench-base`: `tsx --test test/bench/base.test.ts`
- `bench-small`: `tsx --test test/bench/small.test.ts`
- `bench-medium`: `tsx --test test/bench/medium.test.ts`
- `bench-large`: `tsx --test test/bench/large.test.ts`
- `bench-turbo`: `tsx --test test/bench/turbo.test.ts`

## Docker

### `docker-setup`

Prepares the Docker environment without starting the containers.

- `--build`: Builds images before starting containers.
- `-d`: Runs containers in detached mode.
- `--remove-orphans`: Removes containers not defined in the `docker-compose.yml`.
- `--no-start`: Does not start the containers after creating them.

```json
"docker-setup": "docker compose up --build -d --remove-orphans --no-start"
```

### `docker-cli`

TODO

### `docker-serve`

TODO

## `bun`

Runs the CLI application using `Bun`, an alternative JavaScript runtime.

- `--env-file=.env`: Loads environment variables from a `.env` file.
- `--no-warnings`: Suppresses warnings during execution.

```json
"bun": "bun --env-file=.env --no-warnings src/cli/commander.ts"
```

## `deno`

Runs the CLI application using `Deno`, another JavaScript and TypeScript runtime.

- `--allow-sys`: Allows access to system-related APIs.
- `--allow-read`: Allows file system read access.
- `--allow-run`: Allows spawning subprocesses.
- `--allow-write`: Allows file system write access.
- `--allow-env`: Allows access to environment variables.
- `--unstable-sloppy-imports`: Enables experimental import features.

```json
"deno": "deno run --allow-sys --allow-read --allow-run --allow-write --allow-env --unstable-sloppy-imports src/cli/commander.ts"
```