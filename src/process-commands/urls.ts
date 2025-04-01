import { processVideo } from './video.ts'
import { checkAndHandleInfo } from './info-utils.ts'
import { l, err, logSeparator, logInitialFunctionCall } from '../utils/logging.ts'
import { readFile } from '../utils/node-utils.ts'
import type { ProcessingOptions } from '../../shared/types.ts'

export async function processURLs(
  options: ProcessingOptions,
  filePath: string,
  llmServices?: string,
  transcriptServices?: string
) {
  logInitialFunctionCall('processURLs', { llmServices, transcriptServices })
  try {
    const content = await readFile(filePath, 'utf8')
    const urls = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))

    if (urls.length === 0) {
      err('Error: No URLs found in the file.')
      process.exit(1)
    }
    l.opts(`\nFound ${urls.length} URLs in the file...`)

    // Info check
    const handledInfo = await checkAndHandleInfo(options, 'urls', urls, '')
    if (handledInfo) {
      return
    }

    for (const [index, url] of urls.entries()) {
      logSeparator({
        type: 'urls',
        index,
        total: urls.length,
        descriptor: url
      })
      try {
        await processVideo(options, url, llmServices, transcriptServices)
      } catch (error) {
        err(`Error processing URL ${url}: ${(error as Error).message}`)
      }
    }
  } catch (error) {
    err(`Error reading or processing file ${filePath}: ${(error as Error).message}`)
    process.exit(1)
  }
}
