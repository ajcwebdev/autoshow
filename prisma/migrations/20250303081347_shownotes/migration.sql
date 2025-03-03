-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "show_notes" (
    "id" SERIAL NOT NULL,
    "showLink" TEXT,
    "channel" TEXT,
    "channelURL" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "publishDate" TEXT NOT NULL,
    "coverImage" TEXT,
    "frontmatter" TEXT,
    "prompt" TEXT,
    "transcript" TEXT,
    "llmOutput" TEXT,
    "walletAddress" TEXT,
    "mnemonic" TEXT,

    CONSTRAINT "show_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embeddings" (
    "filename" TEXT NOT NULL,
    "vector" vector(3072) NOT NULL,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("filename")
);
