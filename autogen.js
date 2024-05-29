// autogen.js

import { Command } from 'commander'
import { processVideo } from './commands/processVideo.js'
import { processPlaylist } from './commands/processPlaylist.js'
import { processUrlsFile } from './commands/processUrlsFile.js'
import { processRssFeed } from './commands/processRssFeed.js'
import { getModel } from './utils/index.js'

const program = new Command()

program
  .name('autogen')
  .description('Automated processing of YouTube videos, playlists, and podcast RSS feeds')
  .option('-v, --video <url>', 'Process a single YouTube video')
  .option('-p, --playlist <playlistUrl>', 'Process all videos in a YouTube playlist')
  .option('-u, --urls <filePath>', 'Process YouTube videos from a list of URLs in a file')
  .option('-r, --rss <rssUrl>', 'Process podcast episodes from an RSS feed')
  .option('-m, --model <type>', 'Select model to use: base, medium, or large', 'large')
  .option('--chatgpt', 'Generate show notes with ChatGPT')
  .option('--claude', 'Generate show notes with Claude')

program.action(async (options) => {
  const model = getModel(options.model)
  if (options.video) {
    await processVideo(options.video, model, options.chatgpt, options.claude)
  }
  if (options.playlist) {
    await processPlaylist(options.playlist, model, options.chatgpt, options.claude)
  }
  if (options.urls) {
    await processUrlsFile(options.urls, model, options.chatgpt, options.claude)
  }
  if (options.rss) {
    await processRssFeed(options.rss, model, options.chatgpt, options.claude)
  }
})

program.parse(process.argv)