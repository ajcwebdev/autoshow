# Autoshow Server

This is currently a very simple proof-of-concept that only implements the most basic Autoshow command for [processing a single video file from a YouTube URL](/docs/examples.md#process-single-video-or-audio-file):

```bash
npm run autoshow -- --video "https://www.youtube.com/watch?v=jKB0EltG9Jo"
```

See the [server section of the roadmap](/docs/readmap.md#server) for more information about future development on the server implementation.

## Start Server

Run the following command to start the server:

```bash
npm run serve
```

<details>
  <summary>Note on Node versioning, click to expand.</summary>

Under the hood this runs `node --env-file=.env --watch server/index.js` which eliminates the need for `dotenv` or `nodemon` as dependencies. This means Node v20 or higher is required. I do not plan on supporting previous Node versions as I believe it's generally a bad idea to try and support versions that have passed their end of life dates.

Version 20 enters its maintenance period in October 2024 and end-of-life in April 2026. With that in mind, I plan to transition to Version 22 in 2025 and deprecate Version 20 support in the beginning of 2026. For more information on Node's release schedule, see the [Node.js Release Working Group repository](https://github.com/nodejs/Release).

</details>

## Send Request with YouTube URL

Once the server is running, send a `POST` request to `http://localhost:3000/video` containing a JSON object with the YouTube URL:

```bash
curl -X POST http://localhost:3000/video \
  -H "Content-Type: application/json" \
  -d '{
    "youtubeUrl": "https://www.youtube.com/watch?v=jKB0EltG9Jo"
  }'
```

Configure `model`.

```bash
curl -X POST http://localhost:3000/video \
  -H "Content-Type: application/json" \
  -d '{
    "youtubeUrl": "https://www.youtube.com/watch?v=jKB0EltG9Jo",
    "model": "medium"
  }'
```

Use LLM.

```bash
curl -X POST http://localhost:3000/video \
  -H "Content-Type: application/json" \
  -d '{
    "youtubeUrl": "https://www.youtube.com/watch?v=jKB0EltG9Jo",
    "model": "large",
    "llm": "chatgpt"
  }'
```