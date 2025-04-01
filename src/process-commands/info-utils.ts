/**
 * src/process-commands/info-utils.ts
 *
 * Unifies repeated logic for handling --info. In some commands,
 * if (options.info) { saveInfo(...); return } was repeated.
 * We move that logic here, including special RSS usage of saveAudio('', true).
 */

import { saveInfo } from '../process-steps/01-generate-markdown-utils.ts'
import { saveAudio } from '../process-steps/02-download-audio-utils.ts'
import { l } from '../utils/logging.ts'
import type { ProcessingOptions } from '../../shared/types.ts'

type InfoType = 'channel' | 'playlist' | 'urls' | 'rss'

/**
 * Checks if options.info is set. If so, calls saveInfo with the appropriate type,
 * data, and label. For RSS, it also calls saveAudio('', true) to skip cleanup.
 *
 * @param options - The ProcessingOptions from CLI or server
 * @param type - The type of data we're handling ('channel','playlist','urls','rss')
 * @param data - The main data array or object used by saveInfo (e.g. video items, url list)
 * @param label - An optional label or title (like channelTitle or playlistTitle)
 * @returns true if info was handled, meaning the caller should return immediately.
 */
export async function checkAndHandleInfo(
  options: ProcessingOptions,
  type: InfoType,
  data: any,
  label: string
): Promise<boolean> {
  if (!options.info) {
    return false
  }

  // For RSS feeds, we also call saveAudio('', true). Because in old code, we had that logic.
  if (type === 'rss') {
    // This ensures we skip cleaning up or do anything else needed to keep metadata
    await saveAudio('', true)
  }

  await saveInfo(type, data, label)

  l.dim(`\n[checkAndHandleInfo] --info was set, we saved metadata and returned early.\n`)
  return true
}
