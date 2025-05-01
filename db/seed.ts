// db/seed.ts

// import { db, ShowNotes, Embeddings } from 'astro:db'

export default async function seed(): Promise<void> {
  // console.log('[seed] Starting database seeding...')
  
  // try {
  //   console.log('[seed] Seeding show_notes table...')
  //   await db.insert(ShowNotes).values([
  //     {
  //       id: 1,
  //       title: 'Sample Show Note',
  //       publishDate: '2024-01-01',
  //       frontmatter: '---\ntitle: "Sample Show Note"\n---',
  //       transcript: 'This is a sample transcript',
  //       llmOutput: 'This is a sample LLM output',
  //       walletAddress: 'sample_wallet_address',
  //       mnemonic: 'sample_mnemonic'
  //     },
  //     {
  //       id: 2,
  //       title: 'Another Show Note',
  //       publishDate: '2024-01-02',
  //       frontmatter: '---\ntitle: "Another Show Note"\n---',
  //       transcript: 'Another sample transcript',
  //       llmOutput: 'Another sample LLM output',
  //       walletAddress: 'another_wallet_address',
  //       mnemonic: 'another_mnemonic'
  //     }
  //   ])
    
  //   console.log('[seed] Seeding embeddings table...')
  //   await db.insert(Embeddings).values([
  //     {
  //       filename: 'sample1.mp3',
  //       vector: [0.1, 0.2, 0.3]
  //     },
  //     {
  //       filename: 'sample2.mp3',
  //       vector: [0.4, 0.5, 0.6]
  //     }
  //   ])
    
  //   console.log('[seed] Database seeding completed successfully')
    
  // } catch (error) {
  //   console.error('[seed] Error seeding database:', error)
  //   throw error
  // }
}