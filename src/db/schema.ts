// src/db/schema.ts

import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const showNotes = sqliteTable("show_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  showLink: text("showLink"),
  channel: text("channel"),
  channelURL: text("channelURL"),
  title: text("title").notNull(),
  description: text("description"),
  publishDate: text("publishDate").notNull(),
  coverImage: text("coverImage"),
  frontmatter: text("frontmatter"),
  prompt: text("prompt"),
  transcript: text("transcript"),
  llmOutput: text("llmOutput"),
});