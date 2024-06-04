# Todos/Roadmap/Future

This isn't exactly a full blown roadmap of upcoming milestones containing timeline estimations and features to prioritize but it is more detailed and organized than an unordered list of todos.

At this time, Autoshow should not be considered production ready. I'm hoping to get it production ready by the end of 2024 although this is a very conservative estimate so it could arrive sooner.

## Version 0.1

My current plan is to implement the majority of the functionality outlined here before publishing `v0.1` of `autoshow` on npm.
  - While `v0.1` will introduce more stability to the project, it won't be considered production ready until `v1.0`.
  - Until that time, I'll do my best to push changes through clearly documented PRs.
  - In the meantime, this repo will be changing rapidly and breaking changes should be expected.

### Greater Configurability

<details>
  <summary>Enable downloading and passing any Whisper.cpp model size.</summary>

| Model         | Disk    | SHA                                        |
| ------------- | ------- | ------------------------------------------ |
| tiny          | 75 MiB  | `bd577a113a864445d4c299885e0cb97d4ba92b5f` |
| tiny.en       | 75 MiB  | `c78c86eb1a8faa21b369bcd33207cc90d64ae9df` |
| base          | 142 MiB | `465707469ff3a37a2b9b8d8f89f2f99de7299dac` |
| base.en       | 142 MiB | `137c40403d78fd54d454da0f9bd998f78703390c` |
| small         | 466 MiB | `55356645c2b361a969dfd0ef2c5a50d530afd8d5` |
| small.en      | 466 MiB | `db8a495a91d927739e50b3fc1cc4c6b8f6c2d022` |
| small.en-tdrz | 465 MiB | `b6c6e7e89af1a35c08e6de56b66ca6a02a2fdfa1` |
| medium        | 1.5 GiB | `fd9727b6e1217c2f614f9b698455c4ffd82463b4` |
| medium.en     | 1.5 GiB | `8c30f0e44ce9560643ebd10bbe50cd20eafd3723` |
| large-v1      | 2.9 GiB | `b1caaf735c4cc1429223d5a74f0f4d0b9b59a299` |
| large-v2      | 2.9 GiB | `0f4c8e34f21cf1a914c59d8b3ce882345ad349d6` |
| large-v2-q5_0 | 1.1 GiB | `00e39f2196344e901b3a2bd5814807a769bd1630` |
| large-v3      | 2.9 GiB | `ad82bf6a9043ceed055076d0fd39f5f186ff8062` |
| large-v3-q5_0 | 1.1 GiB | `e6e2ed78495d403bef4b7cff42ef4aaadcfea8de` |

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
node --env-file=.env autogen.js --deepgram --assembly --chatgpt --claude --video "https://www.youtube.com/watch?v=-jF0g_YGPdI"
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

### Examples

Update `examples.md` file with runnable examples of all possible CLI options and services, the majority of which currently resides in [`docs/examples.md`](./examples.md).

### Documentation

Document the following for each third party service:

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