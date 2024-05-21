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

```bash
~/.cache/lm-studio/bin/lms bootstrap
lms
lms create node-javascript-empty
cd node-javascript-empty
lms server start
npm start  
```

- [Jan](https://jan.ai/)
  - [`jan`](https://github.com/janhq/jan)
  - [Jan Local API Server](https://jan.ai/docs/local-api)

```bash
npm install node-llama-cpp
echo > llm/llama.js
npx --yes node-llama-cpp@beta chat
```

Recommended models:

- `Llama 2 Chat 7B`              | 100% compatibility | 4.1K context  Size: 4.45GB
- `Llama 2 Chat 13B`             | 100% compatibility | 4.1K context  Size: 7.33GB
- `Llama 3 8B`                   | 100% compatibility | 8.2K context  Size: 7.95GB
- `Llama 3 70B`                  | 41% compatibility  | 8.2K context  Size: 37.57GB
- `Llama 2 Chat 70B`             | 43% compatibility  | 4.1K context  Size: 38.58GB

- `Code Llama 7B`                | 100% compatibility | 13K context   Size: 4.45GB
- `Code Llama 13B`               | 100% compatibility | 5K context    Size: 7.33GB
- `Code Llama 34B`               | 58% compatibility  | 9.4K context  Size: 18.83GB
- `Stable Code Instruct 3B`      | 100% compatibility | 16K context   Size: 1.85GB

- `Mistral 7B Instruct v0.2`     | 100% compatibility | 33K context   Size: 4.78GB
- `Mixtral 8x7B MoE`             | 53% compatibility  | 13K context   Size: 24.62GB
- `Dolphin 2.5 Mixtral 8x7B MoE` | 53% compatibility  | 13K context   Size: 24.62GB
- `Functionary Medium v2.4`      | 53% compatibility  | 13K context   Size: 24.62GB
- `Functionary Small v2.4`       | 100% compatibility | 24K context   Size: 7.17GB
- `Gemma 1.1 7B`                 | 100% compatibility | 5.8K context  Size: 8.45GB
- `Gemma 1.1 2B`                 | 100% compatibility | 8.2K context  Size: 2.48GB
- `Orca 2 13B`                   | 100% compatibility | 4.1K context  Size: 7.33GB

```
   Model description
   Llama 3 model was created by Meta and is optimized for an assistant-like chat use cases.
   This is the 8 billion parameters version of the model.

   Model info        Size: 7.95GB   Train context size: 8.2K
   Resolved config   100% compatibility   Context size: 8.2K   GPU layers: 33/33 (100%)   VRAM usage: 9.73GB
```

```bash
npm create --yes node-llama-cpp@beta
```

```
✔ Entered project name ajcwebdev-llama-node
✔ Selected template Node + TypeScript
✔ Selected model Llama 3 8B
✔ Scaffolded a Node + TypeScript project to ~/ajcwebdev-llama-node
```

Now run these commands:

```bash
cd ajcwebdev-llama-node
npm install
npm start
```

Note: running "npm install" may take a little while since it also downloads the model you selected