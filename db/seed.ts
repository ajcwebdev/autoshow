// db/seed.ts

import { db, ShowNotes } from 'astro:db'

export default async function() {
  await db.insert(ShowNotes).values([
    {
      id: 1,
      title: 'Test Show Note',
      publishDate: '2024-01-01',
      transcript: 'Test transcript',
      showLink: 'https://example.com',
      channel: 'Test Channel',
      walletAddress: 'test-wallet',
      llmOutput: 'Test output',
      frontmatter: '---\ntitle: Test\n---',
    }
  ])
}