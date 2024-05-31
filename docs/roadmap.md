# Todos/Roadmap/Future

This isn't exactly a full blown roadmap of upcoming milestones containing timeline estimations and features to prioritize but it is more detailed and organized than an unordered list of todos.

At this time, Autoshow should not be considered production ready. I'm hoping to get it production ready by the end of 2024 although this is a very conservative estimate so it could arrive sooner.

## Version 0.1

My current plan is to implement the majority of the functionality outlined here before publishing `v0.1` of `autoshow` on npm.
  - While `v0.1` will introduce more stability to the project, it won't be considered production ready until `v1.0`.
  - Until that time, I'll do my best to push changes through clearly documented PRs.
  - In the meantime, this repo will be changing rapidly and breaking changes should be expected.

### Local LLMs

Integrate options for local LLMs.

- Llama.cpp
  - [`node-llama-cpp`](https://withcatai.github.io/node-llama-cpp/)
  - [`node-llama-cpp` v3](https://github.com/withcatai/node-llama-cpp/pull/105)
  - [`node-llama-cpp` GitHub repo](https://github.com/withcatai/node-llama-cpp)
  - [`llama.cpp`](https://github.com/ggerganov/llama.cpp)

- LM Studio
  - [LM Studio GitHub](https://github.com/lmstudio-ai)
  - [LM Studio Local Server](https://lmstudio.ai/docs/local-server)
  - [`lmstudio.js` Quick Start Guide](https://lmstudio.ai/docs/lmstudio-sdk/quick-start)
  - [`lmstudio.js` Code Examples](https://lmstudio.ai/docs/lmstudio-sdk/examples)

- [Jan](https://jan.ai/)
  - [`jan`](https://github.com/janhq/jan)
  - [Jan Local API Server](https://jan.ai/docs/local-api)

### Greater Configurability

- Allow configuring whether to delete or keep intermediary files.
  - Follow example for an [option that may be a boolean or an option-argument declared with square brackets like `--optional [value]`](https://github.com/tj/commander.js/blob/master/examples/options-boolean-or-value.js):
  - `--cleanUp` can be set to `true` or `false`.
  - File clean up will be set to `false` by default.
  - Decide between `--noCleanUp` and `--cleanUpOff` for option-argument that sets clean up to `false`.

- Allow configuring different models for LLM and transcription providers with option-arguments to `--chatgpt`, `--claude`, `--deepgram`, and `--assembly` options.
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

- Include the ability to run multiple transcription services and LLMs on a given video URL.
  - For example, the following would output four show note files for each combination of transcription and LLM services:

```bash
node --env-file=.env autogen.js --deepgram --assembly --chatgpt --claude --video "https://www.youtube.com/watch?v=-jF0g_YGPdI"
```

### Examples

Update `examples.md` file with runnable examples of all possible CLI options and services, the majority of which currently resides in [`docs/examples.md`](./examples.md).

### Documentation

Document the following for each third party service:

- ChatGPT
  - Pricing
    - [OpenAI Platform API Pricing](https://openai.com/api/pricing/)
    - [ChatGPT Subscription Pricing](https://openai.com/chatgpt/pricing/)
  - API Keys
    - [API Keys Dashboard Page](https://platform.openai.com/api-keys)
    - [API Auth Docs](https://platform.openai.com/docs/api-reference/authentication)
  - Usage
    - [Usage Dashboard Page](https://platform.openai.com/usage)
    - [Usage Tiers](https://platform.openai.com/docs/guides/rate-limits/usage-tiers)
- Claude
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
- Deepgram
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
- Assembly
  - Pricing
    - [Subscription and API Pricing](https://www.assemblyai.com/pricing)
    - [Select speech model](https://www.assemblyai.com/docs/speech-to-text/speech-recognition#select-the-speech-model-with-best-and-nano)
  - API Keys
    - [API Auth Docs](https://www.assemblyai.com/docs/api-reference/overview#authorization)
  - Usage
    - [Usage Dashboard Page](https://www.assemblyai.com/app/usage)
    - [Quotas and Limits Docs](https://www.assemblyai.com/docs/guides/real-time-streaming-transcription#quotas-and-limits)

## Version 1.0

For me to consider this project production ready, `v1.0` will need to include:

- An interactive CLI, potentially using [Inquirer](https://github.com/SBoudrias/Inquirer.js).
  - This will walk through all options and arguments in an interactive manner.
  - The goal is for a user to be able to run only `npx autoshow` and process their content without needing to read any documentation or CLI help pages.
- A full test suite for each function and utility. This will need either:
  - Some kind of file data mocking for testing the end-to-end flow with audio and video.
  - Example URLs that host easily accessible and available audio or video content files.
- Astro integration so the markdown files that are generated with the show notes can be used to generate a complete website.
- Deno and Bun compatibility and documentation.
- Docker support and setup instructions.
- Deployment instructions for self hosting a Node.js server with PM2.