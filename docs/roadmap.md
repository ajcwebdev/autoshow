# Todos/Roadmap/Future

This isn't exactly a full blown roadmap of upcoming milestones containing timeline estimations and features to prioritize but it is more detailed and organized than an unordered list of todos. At this time, Autoshow should not be considered production ready. I'm hoping to get it production ready by the end of 2024.

## Outline

- [Contributing](#contributing)
- [Version 0.1](#version-01)
  - [Server and Frontend](#server-and-frontend)
  - [Greater Configurability](#greater-configurability)
- [Version 1.0](#version-10)

## Contributing

Right now this project intentionally does not have a `CONTRIBUTING.md` doc. I want to reach at least v0.1 before encouraging outside contributors, at which point I'll write up a thorough doc file explaining how to do so. However, if you want to discuss any of the information contained in the Roadmap or if you want to ask any general questions about the project, I highly encourage the following:

- Open a [GitHub Discussion](https://github.com/ajcwebdev/autoshow/discussions) for any and all non-bug-related topics.
- Please only open an issue to file a specific bug report (preferably with a minimum reproduction).
- Please open a discussion before creating a PR. Contributions are definitely welcome, but there's a high probability that I'll reject your PR unless we carefully align on the proposed changes ahead of time.

## Version 0.1

My current plan is to implement the majority of the functionality outlined here before publishing `v0.1` of `autoshow` on npm.
  - While `v0.1` will introduce more stability to the project, it won't be considered production ready until `v1.0`.
  - Until that time, I'll do my best to push changes through clearly documented PRs.
  - In the meantime, this repo will be changing rapidly and breaking changes should be expected.

### Server and Frontend

The server will eventually replicate all functionality implemented by the CLI.

<details>
  <summary>Click to expand</summary>

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

Set better defaults for context limit, entropy threshold, and max temperature to improve transcript output and allow configuring temperature and max token output for LLMs.

- [Improving hallucinations and repetitions](https://github.com/ggerganov/whisper.cpp/discussions/2286)
- [OpenAI `max_tokens`](https://platform.openai.com/docs/api-reference/chat/create#chat-create-max_tokens)
- [OpenAI `temperature`](https://platform.openai.com/docs/api-reference/chat/create#chat-create-temperature)
- [Claude Messages API](https://docs.anthropic.com/en/api/messages)

Include the ability to run multiple transcription services and LLMs on a given video URL. For example, the following would output four show note files for each combination of transcription and LLM services:

```bash
node --env-file=.env autoshow.js --deepgram --assembly --chatgpt --claude --video "https://www.youtube.com/watch?v=-jF0g_YGPdI"
```

Allow configuring different models for LLM and transcription providers with option-arguments.

- Deepgram option-arguments
  - `base`
  - `enhanced`
  - `nova`
  - `nova2` for `nova-2`
- Assembly option-arguments
  - `best`
  - `nano`

## Version 1.0

For me to consider this project production ready, `v1.0` will need to include the following:

- Astro integration so the markdown files that are generated with the show notes can be used to generate a complete website.
- Docker support and setup instructions.
- Deployment instructions for self hosting a Node.js server.