// drizzle.config.ts

export default {
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations/",
  dbCredentials: {
    // Path to your SQLite database file
    url: "./drizzle/db.sqlite",
  },
};