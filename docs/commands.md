# Commands

The files in the `commands` folder are the key components of Autoshow that enable choosing which type of content to process and with what options. Different language models can be used for show notes and different transcription services can be used for transcripts. Each file handles different aspects of processing various types of content including:

- Single videos (`processVideo.js`)
- YouTube playlists (`processPlaylist.js`)
- Podcast RSS feeds (`processRSS.js`)
- Lists of video URLs (`processURLs.js`)

They work together to offer flexibility in handling different content sources while maintaining a consistent approach to generating transcripts and show notes. The main `autoshow.js` file uses these modules to provide a unified command-line interface for the user.

## processVideo

This is the core processing file for individual video or audio content. It handles:

- Downloading video metadata and audio from a given URL
- Converting audio to WAV format
- Transcribing audio using either Whisper.cpp, Deepgram, or AssemblyAI
- Generating markdown files with metadata and transcripts
- Calling various language models (ChatGPT, Claude, Cohere, Mistral, Octo) to generate show notes
- Cleaning up temporary files

It's the foundation for processing single pieces of content and is used by the other processing files.

## processPlaylist

This file is responsible for handling YouTube playlists. It:

- Fetches playlist information and extracts video URLs
- Saves playlist information to a JSON file
- Creates a markdown file with all video URLs
- Iterates through each video URL, calling `processVideo.js` for each one

This allows Autoshow to process entire YouTube playlists, generating show notes for each video in the playlist.

## processRSS

This file deals with podcast RSS feeds. It:

- Fetches and parses the RSS feed
- Extracts relevant information (title, publish date, audio URL, etc.) for each item
- Processes each item similarly to `processVideo.js`, but with RSS-specific metadata
- Allows for processing items from oldest to newest or newest to oldest

This enables Autoshow to handle podcast episodes from RSS feeds, expanding its capabilities beyond YouTube content.

## processURLs

This file processes multiple videos from a list of URLs stored in a file. It:

- Reads a file containing video URLs
- Iterates through each URL, calling `processVideo.js` for each one

This allows for batch processing of multiple videos that aren't necessarily part of a YouTube playlist or RSS feed.

## processFile

TODO