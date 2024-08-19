# Todos/Roadmap/Future

This isn't exactly a full blown roadmap of upcoming milestones containing timeline estimations and features to prioritize but it is more detailed and organized than an unordered list of todos. At this time, Autoshow should not be considered production ready. I'm hoping to get it production ready by the end of 2024.

## Outline

- [Contributing](#contributing)
- [Version 0.1](#version-01)
  - [Documentation](#documentation)
  - [Server](#server)
  - [Frontend](#frontend)
  - [Greater Configurability](#greater-configurability)
- [Version 1.0](#version-10)

## Contributing

Right now this project intentionally does not have a `CONTRIBUTING.md` doc. I want to reach at least v0.1 before encouraging outside contributors, at which point I'll write up a thorough doc file explaining how to do so. However, if you want to discuss any of the information contained in the Roadmap or if you want to ask any general questions about the project, I highly encourage the following:

- Open a [GitHub Discussion](https://github.com/ajcwebdev/autoshow/discussions) for any and all non-bug-related topics.
- Please only open an issue to file a specific bug report (preferably with a minimum reproduction).
- Please open a discussion before creating a PR. Contributions are definitely welcome, but there's a high probability that I'll reject your PR unless we carefully align on the proposed changes ahead of time.

## Version 0.1

<details>
  <summary>Click to expand</summary>

My current plan is to implement the majority of the functionality outlined here before publishing `v0.1` of `autoshow` on npm.
  - While `v0.1` will introduce more stability to the project, it won't be considered production ready until `v1.0`.
  - Until that time, I'll do my best to push changes through clearly documented PRs.
  - In the meantime, this repo will be changing rapidly and breaking changes should be expected.

</details>

### Documentation

Update `examples.md` file with runnable examples of all possible CLI options and services, the majority of which currently resides in [`docs/examples.md`](./examples.md).

Also document the following for each third party service (click each to expand):

<details>
  <summary>ChatGPT</summary>

  - Pricing
    - [OpenAI Platform API Pricing](https://openai.com/api/pricing/)
    - [ChatGPT Subscription Pricing](https://openai.com/chatgpt/pricing/)
  - API Keys
    - [API Keys Dashboard Page](https://platform.openai.com/api-keys)
    - [API Auth Docs](https://platform.openai.com/docs/api-reference/authentication)
  - Usage
    - [Usage Dashboard Page](https://platform.openai.com/usage)
    - [Usage Tiers](https://platform.openai.com/docs/guides/rate-limits/usage-tiers)

</details>

<details>
  <summary>Claude</summary>

  - Pricing
    - [API Pricing](https://www.anthropic.com/api)
    - [Subscription Pricing](https://www.anthropic.com/claude)
    - [Model Comparison](https://docs.anthropic.com/en/docs/models-overview#model-comparison)
  - API Keys
    - [API Keys Dashboard Page](https://console.anthropic.com/settings/keys)
    - [API Auth Docs](https://docs.anthropic.com/en/api/getting-started)
  - Usage
    - [Usage Dashboard Page](https://console.anthropic.com/settings/usage)
    - [Rate and Usage Limits Docs](https://docs.anthropic.com/en/api/rate-limits)

</details>

<details>
  <summary>Cohere</summary>

  - Pricing
  - API Keys
  - Usage

</details>

<details>
  <summary>Mistral</summary>

  - Pricing
  - API Keys
  - Usage

</details>

<details>
  <summary>OctoAI</summary>

  - Pricing
  - API Keys
  - Usage

</details>

<details>
  <summary>Deepgram</summary>

  - Pricing
    - [API and Subscription Pricing](https://deepgram.com/pricing)
    - [Model and Feature Overview](https://developers.deepgram.com/docs/stt-streaming-feature-overview)
  - API
    - [API Keys Docs](https://developers.deepgram.com/docs/create-additional-api-keys)
    - [API Auth Docs](https://developers.deepgram.com/docs/authenticating)
    - [Create an API Key using the Deepgram API](https://developers.deepgram.com/docs/create-additional-api-keys#create-an-api-key-using-the-deepgram-api)
  - Usage
    - [Summarize Usage Endpoint](https://developers.deepgram.com/reference/summarize-usage)
    - [Usage Docs](https://developers.deepgram.com/docs/using-logs-usage)

</details>

<details>
  <summary>Assembly</summary>

  - Pricing
    - [Subscription and API Pricing](https://www.assemblyai.com/pricing)
    - [Select speech model](https://www.assemblyai.com/docs/speech-to-text/speech-recognition#select-the-speech-model-with-best-and-nano)
  - API Keys
    - [API Auth Docs](https://www.assemblyai.com/docs/api-reference/overview#authorization)
  - Usage
    - [Usage Dashboard Page](https://www.assemblyai.com/app/usage)
    - [Quotas and Limits Docs](https://www.assemblyai.com/docs/guides/real-time-streaming-transcription#quotas-and-limits)

</details>

### Server

The server will eventually replicate all functionality implemented by the CLI.

<details>
  <summary>Click to expand</summary>

This will include additional endpoints beyond `/video` such as:

- `/playlist` for the `processPlaylist.js` command
- `/urls` for the `processURLs.js` command
- `/rss` for the `processRSS.js` command

I'm starting with a plain Node.js server instead of using a framework like Express. In the future, I would like to also have adapters for Deno and Bun. Once those are all stable, I will try out some of the higher level frameworks. I intend to experiment a bit with each of the following and pick one or two to support long term:

- [Fastify](https://fastify.dev/)
- [Koa](https://koajs.com/)
- [Fresh](https://fresh.deno.dev/)
- [Hono](https://hono.dev/)
- [Elysia](https://elysiajs.com/)

With the exception of Fresh, I'll likely avoid more opinionated server frameworks like [Adonis](https://adonisjs.com/), [Sails](https://sailsjs.com/), and [Nest](https://nestjs.com/). Others I might check out but are lower priority include:

- [Hapi](https://github.com/hapijs/hapi)
- [Feathers](https://github.com/feathersjs/feathers)
- [Oak](https://oakserver.org/)

</details>

### Frontend

Once I've settled on the handful of server frameworks I want to support, I'll build out a React frontend.

<details>
  <summary>Click to expand</summary>

After all functionality is implemented on the server-side and exposed through a React frontend, I'll go through a similar process of experimentation with:

- [Next](https://nextjs.org/)
- [Redwood](https://redwoodjs.com/)
- [The Epic Stack](https://github.com/epicweb-dev/epic-stack)
- [Astro](https://astro.build/)
- [SolidStart](https://start.solidjs.com/)
- [Qwik City](https://qwik.dev/docs/qwikcity/)

The framework I'll pick for building the final app will need to include authentication, database integration, and JSX support so I'll likely exclude [Nuxt](https://nuxt.com/), [SvelteKit](https://kit.svelte.dev/), and [Marko Run](https://github.com/marko-js/run) from consideration.

</details>

### Greater Configurability

Click any of the following to expand.

<details>
  <summary>Explore whether to integrate other Whisper-enabled open source tools</summary>

[mlx-whisper](https://github.com/ml-explore/mlx-examples/tree/main/whisper)
[WhisperKit](https://github.com/argmaxinc/WhisperKit)
[whisperkittools](https://github.com/argmaxinc/whisperkittools)

</details>

<details>
  <summary>Set better defaults for context limit, entropy threshold, and max temperature to improve transcript output.</summary>

[Improving hallucinations and repetitions](https://github.com/ggerganov/whisper.cpp/discussions/2286)

</details>

<details>
  <summary>Set default behavior to automatically download and use smallest Whisper model if none is available.</summary>

- [Whisper model files](https://github.com/ggerganov/whisper.cpp/blob/master/models/README.md)

</details>

<details>
  <summary>Allow configuring prompt.</summary>

  - `titles`
  - `summary`
  - `chapters`

</details>

<details>
  <summary>Allow configuring temperature and max token output for LLMs.</summary>

- [OpenAI `max_tokens`](https://platform.openai.com/docs/api-reference/chat/create#chat-create-max_tokens)
- [OpenAI `temperature`](https://platform.openai.com/docs/api-reference/chat/create#chat-create-temperature)
- [Claude Messages API](https://docs.anthropic.com/en/api/messages)

</details>

<details>
  <summary>Include the ability to run multiple transcription services and LLMs on a given video URL.</summary>

For example, the following would output four show note files for each combination of transcription and LLM services:

```bash
node --env-file=.env autoshow.js --deepgram --assembly --chatgpt --claude --video "https://www.youtube.com/watch?v=-jF0g_YGPdI"
```

</details>

<details>
  <summary>Allow configuring whether to delete or keep intermediary files.</summary>

  - Follow example for an [option that may be a boolean or an option-argument declared with square brackets like `--optional [value]`](https://github.com/tj/commander.js/blob/master/examples/options-boolean-or-value.js):
  - `--cleanUp` can be set to `true` or `false`.
  - File clean up will be set to `false` by default.
  - Decide between `--noCleanUp` and `--cleanUpOff` for option-argument that sets clean up to `false`.

</details>

<details>
  <summary>Allow configuring different models for LLM and transcription providers with option-arguments.</summary>

  - ChatGPT option-arguments
    - `gpt4o` for `gpt-4o`
    - `gpt4t` for `gpt-4-turbo`
    - `gpt4` for `gpt-4`
    - `gpt3` for `gpt-3.5-turbo`
  - Claude option-arguments
    - `opus` for `claude-3-opus-20240229`
    - `sonnet` for `claude-3-sonnet-20240229`
    - `haiku` for `claude-3-haiku-20240307`
  - Deepgram option-arguments
    - `base`
    - `enhanced`
    - `nova`
    - `nova2` for `nova-2`
  - Assembly option-arguments
    - `best`
    - `nano`

</details>

## Version 1.0

For me to consider this project production ready, `v1.0` will need to include the following:

<details>
  <summary>Click to expand</summary>

- An interactive CLI, potentially using [Inquirer](https://github.com/SBoudrias/Inquirer.js).
  - This will walk through all options and arguments in an interactive manner.
  - The goal is for a user to be able to run only `npx autoshow` and process their content without needing to read any documentation or CLI help pages.
- A full test suite for each function and utility. This will need either:
  - Some kind of file data mocking for testing the end-to-end flow with audio and video.
  - Example URLs that host easily accessible and available audio or video content files.
- Astro integration so the markdown files that are generated with the show notes can be used to generate a complete website.
- Docker support and setup instructions.
- Deployment instructions for self hosting a Node.js server.

</details>