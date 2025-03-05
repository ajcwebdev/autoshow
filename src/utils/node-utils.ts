// src/utils/node-utils.ts

import { promisify } from 'node:util'
import { argv, env, exit } from 'node:process'
import { fileURLToPath } from 'node:url'
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import { exec, execFile, spawn } from 'node:child_process'
import { readFile, readdir, writeFile, access, unlink } from 'node:fs/promises'
import { basename, extname, join, dirname, isAbsolute, resolve, relative } from 'node:path'

import { XMLParser } from 'fast-xml-parser'

export const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
})

export const execPromise = promisify(exec)
export const execFilePromise = promisify(execFile)

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
  existsSync,
  writeFileSync,
  readFileSync,
  mkdirSync,
  exec,
  execFile,
  spawn
}