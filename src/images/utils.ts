// src/utils/images/utils.ts

import { existsSync } from 'fs'
import { join } from 'path'

/**
 * Generates a unique filename for an image
 * @param prefix - Prefix for the filename (e.g., 'dalle', 'stability')
 * @param extension - File extension (e.g., 'png', 'jpg')
 * @returns A unique filepath
 */
export function generateUniqueFilename(prefix: string, extension: string = 'png'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const randomString = Math.random().toString(36).substring(2, 8)
  
  let filename = `${prefix}-${timestamp}-${randomString}.${extension}`
  let filepath = join('./outputs', filename)
  
  // In the extremely unlikely case the file already exists, add another random string
  if (existsSync(filepath)) {
    const extraRandom = Math.random().toString(36).substring(2, 8)
    filename = `${prefix}-${timestamp}-${randomString}-${extraRandom}.${extension}`
    filepath = join('./outputs', filename)
  }
  
  return filepath
}

/**
 * Sleep for a specified number of milliseconds
 * @param ms - Milliseconds to sleep
 * @returns A promise that resolves after the specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}