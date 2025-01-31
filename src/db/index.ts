// src/db/index.ts

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

// Path to your SQLite database file
const sqlite = new Database("./drizzle/db.sqlite");

// Drizzle ORM connection
export const db = drizzle(sqlite);