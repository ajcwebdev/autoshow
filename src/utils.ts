// src/utils.ts

import { promisify } from 'node:util'
import { argv, env, exit } from 'node:process'
import { fileURLToPath } from 'node:url'
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import { exec, execFile, spawn } from 'node:child_process'
import { readFile, readdir, writeFile, access, unlink, rename } from 'node:fs/promises'
import { basename, extname, join, dirname, isAbsolute, resolve, relative } from 'node:path'

export const execPromise = promisify(exec)
export const execFilePromise = promisify(execFile)

import chalk from 'chalk'

function createChainableLogger(baseLogger: (...args: any[]) => void) {
  const logger = (...args: any[]) => baseLogger(...args)
  const styledLogger = Object.assign(logger, {
    step: (...args: any[]) => baseLogger(chalk.bold.underline(...args)),
    dim: (...args: any[]) => baseLogger(chalk.dim(...args)),
    success: (...args: any[]) => baseLogger(chalk.bold.blue(...args)),
    warn: (...args: any[]) => baseLogger(chalk.bold.yellow(...args)),
    opts: (...args: any[]) => baseLogger(chalk.magentaBright.bold(...args)),
    info: (...args: any[]) => baseLogger(chalk.magentaBright.bold(...args)),
    wait: (...args: any[]) => baseLogger(chalk.bold.cyan(...args)),
    final: (...args: any[]) => baseLogger(chalk.bold.italic(...args)),
  })
  return styledLogger
}

export const l = createChainableLogger(console.log)
export const err = createChainableLogger(console.error)

export {
  argv,
  env,
  exit,
  fileURLToPath,
  readFile,
  readdir,
  access,
  writeFile,
  basename,
  extname,
  join,
  dirname,
  isAbsolute,
  resolve,
  relative,
  unlink,
  rename,
  existsSync,
  writeFileSync,
  readFileSync,
  mkdirSync,
  exec,
  execFile,
  spawn
}