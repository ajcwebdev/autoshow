// test/cli/cli-prompts.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  { prompt: 'titles', renamed: '04-PROMPTS-01-titles.md' },
  { prompt: 'summary', renamed: '04-PROMPTS-02-summary.md' },
  { prompt: 'shortSummary', renamed: '04-PROMPTS-03-short-summary.md' },
  { prompt: 'longSummary', renamed: '04-PROMPTS-04-long-summary.md' },
  { prompt: 'bulletPoints', renamed: '04-PROMPTS-05-bullet-points.md' },
  { prompt: 'quotes', renamed: '04-PROMPTS-06-quotes.md' },
  { prompt: 'chapterTitlesAndQuotes', renamed: '04-PROMPTS-07-chapter-titles-quotes.md' },
  { prompt: 'x', renamed: '04-PROMPTS-08-social-x.md' },
  { prompt: 'facebook', renamed: '04-PROMPTS-09-social-facebook.md' },
  { prompt: 'linkedin', renamed: '04-PROMPTS-10-social-linkedin.md' },
  { prompt: 'chapterTitles', renamed: '04-PROMPTS-11-chapter-titles.md' },
  { prompt: 'shortChapters', renamed: '04-PROMPTS-12-short-chapters.md' },
  { prompt: 'mediumChapters', renamed: '04-PROMPTS-13-medium-chapters.md' },
  { prompt: 'longChapters', renamed: '04-PROMPTS-14-long-chapters.md' },
  { prompt: 'takeaways', renamed: '04-PROMPTS-15-takeaways.md' },
  { prompt: 'questions', renamed: '04-PROMPTS-16-questions.md' },
  { prompt: 'faq', renamed: '04-PROMPTS-17-faq.md' },
  { prompt: 'blog', renamed: '04-PROMPTS-18-blog.md' },
  { prompt: 'rapSong', renamed: '04-PROMPTS-19-rap-song.md' },
  { prompt: 'rockSong', renamed: '04-PROMPTS-20-rock-song.md' },
  { prompt: 'countrySong', renamed: '04-PROMPTS-21-country-song.md' },
]

test('CLI Prompts Command Tests', async (t) => {
  for (const { prompt, renamed } of commands) {
    await t.test(`should generate ${prompt} successfully`, async () => {
      execSync(
        // `npm run as -- --rss https://ajcwebdev.substack.com/feed --prompt ${prompt} --whisper tiny --deepseek`,
        `npm run as -- --file "content/examples/audio.mp3" --prompt ${prompt} --whisper tiny --deepseek`,
        { stdio: 'inherit' }
      )

      // const generatedFile = join('content', '2021-05-10-thoughts-on-lambda-school-layoffs-deepseek-shownotes.md')
      const generatedFile = join('content', 'audio-deepseek-shownotes.md')
      const renamedFile = join('content', renamed)

      strictEqual(existsSync(generatedFile), true, `Expected file ${generatedFile} was not created`)
      renameSync(generatedFile, renamedFile)
      strictEqual(existsSync(renamedFile), true, `File was not renamed to ${renamedFile}`)
    })
  }
})