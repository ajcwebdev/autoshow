// db/config.ts
import { defineDb, defineTable, column } from 'astro:db';

/**
 * Defines a "ShowNote" table to match your existing "show_notes" schema:
 * 
 * CREATE TABLE IF NOT EXISTS show_notes (
 *   id INTEGER PRIMARY KEY AUTOINCREMENT,
 *   showLink TEXT,
 *   channel TEXT,
 *   channelURL TEXT,
 *   title TEXT NOT NULL,
 *   description TEXT,
 *   publishDate TEXT NOT NULL,
 *   coverImage TEXT,
 *   frontmatter TEXT,
 *   prompt TEXT,
 *   transcript TEXT,
 *   llmOutput TEXT
 * )
 */
export const ShowNote = defineTable({
  columns: {
    // PRIMARY KEY (autoincrement)
    id: column.number({ primaryKey: true, autoIncrement: true }),

    // Additional columns from your original schema
    showLink: column.text(),
    channel: column.text(),
    channelURL: column.text(),
    title: column.text(),
    description: column.text(),
    publishDate: column.text(),
    coverImage: column.text(),
    frontmatter: column.text(),
    prompt: column.text(),
    transcript: column.text(),
    llmOutput: column.text(),
  },
});

export default defineDb({
  /**
   * Register all tables here.
   * 
   * From anywhere in your Astro project, you can then import:
   *   import { db, ShowNote } from 'astro:db';
   */
  tables: { ShowNote },
});