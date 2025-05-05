// db/config.ts

import { defineDb, defineTable, column } from 'astro:db'

const ShowNotes = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    showLink: column.text({ optional: true }),
    channel: column.text({ optional: true }),
    channelURL: column.text({ optional: true }),
    title: column.text(),
    description: column.text({ optional: true }),
    publishDate: column.text(),
    coverImage: column.text({ optional: true }),
    frontmatter: column.text({ optional: true }),
    prompt: column.text({ optional: true }),
    transcript: column.text({ optional: true }),
    llmOutput: column.text({ optional: true }),
    walletAddress: column.text({ optional: true }),
    mnemonic: column.text({ optional: true }),
    llmService: column.text({ optional: true }),
    llmModel: column.text({ optional: true }),
    llmCost: column.number({ optional: true }),
    transcriptionService: column.text({ optional: true }),
    transcriptionModel: column.text({ optional: true }),
    transcriptionCost: column.number({ optional: true }),
    finalCost: column.number({ optional: true })
  },
  indexes: [
    { on: ['walletAddress'] },
    { on: ['publishDate'] },
    { on: ['title'] }
  ]
})

const Embeddings = defineTable({
  columns: {
    filename: column.text({ primaryKey: true }),
    vector: column.json()
  }
})

export default defineDb({
  tables: { ShowNotes, Embeddings }
})