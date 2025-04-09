// shared/constants.ts

export const ENV_VARS_MAP = {
  deepgramApiKey: 'DEEPGRAM_API_KEY',
  assemblyApiKey: 'ASSEMBLY_API_KEY',
  groqApiKey: 'GROQ_API_KEY',
  openaiApiKey: 'OPENAI_API_KEY',
  anthropicApiKey: 'ANTHROPIC_API_KEY',
  geminiApiKey: 'GEMINI_API_KEY',
  deepseekApiKey: 'DEEPSEEK_API_KEY',
  togetherApiKey: 'TOGETHER_API_KEY',
  fireworksApiKey: 'FIREWORKS_API_KEY',
}

export const PROCESS_TYPES = [
  { value: 'video', label: 'Video' },
  { value: 'file', label: 'File' },
]

export const PROMPT_CHOICES = [
  { name: 'Titles', value: 'titles' },
  { name: 'Summary', value: 'summary' },
  { name: 'Short Summary', value: 'shortSummary' },
  { name: 'Long Summary', value: 'longSummary' },
  { name: 'Bullet Point Summary', value: 'bulletPoints' },
  { name: 'Chapter Titles', value: 'chapterTitles' },
  { name: 'Short Chapters', value: 'shortChapters' },
  { name: 'Medium Chapters', value: 'mediumChapters' },
  { name: 'Long Chapters', value: 'longChapters' },
  { name: 'Key Takeaways', value: 'takeaways' },
  { name: 'Questions', value: 'questions' },
  { name: 'FAQ', value: 'faq' },
  { name: 'Blog', value: 'blog' },
  { name: 'Rap Song', value: 'rapSong' },
  { name: 'Rock Song', value: 'rockSong' },
  { name: 'Country Song', value: 'countrySong' },
  { name: 'Quotes', value: 'quotes' },
  { name: 'Chapter Titles and Quotes', value: 'chapterTitlesAndQuotes' },
  { name: 'Social Post (X)', value: 'x' },
  { name: 'Social Post (Facebook)', value: 'facebook' },
  { name: 'Social Post (LinkedIn)', value: 'linkedin' },
]

export const T_CONFIG = {
  deepgram: {
    serviceName: 'Deepgram',
    value: 'deepgram',
    label: 'Deepgram',
    models: [
      { modelId: 'nova-2', costPerMinuteCents: 0.43 },
      { modelId: 'base', costPerMinuteCents: 1.25 },
      { modelId: 'enhanced', costPerMinuteCents: 1.45 },
    ]
  },
  assembly: {
    serviceName: 'AssemblyAI',
    value: 'assembly',
    label: 'AssemblyAI',
    models: [
      { modelId: 'best', costPerMinuteCents: 0.62 },
      { modelId: 'nano', costPerMinuteCents: 0.2 },
    ]
  },
  groq: {
    serviceName: 'Groq',
    value: 'groq',
    label: 'Groq Whisper-v3',
    models: [
      { modelId: 'whisper-large-v3', costPerMinuteCents: 0.185 },
      { modelId: 'whisper-large-v3-turbo', costPerMinuteCents: 0.067 },
      { modelId: 'distil-whisper-large-v3-en', costPerMinuteCents: 0.033 },
    ]
  },
}

export const L_CONFIG = {
  skip: {
    serviceName: 'Skip LLM Processing',
    value: null,
    label: 'Skip LLM Processing',
    models: []
  },
  chatgpt: {
    serviceName: 'OpenAI ChatGPT',
    value: 'chatgpt',
    label: 'ChatGPT',
    apiKeyPropName: 'openaiApiKey',
    models: [
      { modelName: 'GPT 4.5 PREVIEW', modelId: 'gpt-4.5-preview', inputCostC: 7500, outputCostC: 15000 },
      { modelName: 'GPT 4o', modelId: 'gpt-4o', inputCostC: 250, outputCostC: 1000 },
      { modelName: 'GPT 4o MINI', modelId: 'gpt-4o-mini', inputCostC: 15, outputCostC: 60 },
      { modelName: 'GPT o1 MINI', modelId: 'o1-mini', inputCostC: 110, outputCostC: 440 }
    ]
  },
  claude: {
    serviceName: 'Anthropic Claude',
    value: 'claude',
    label: 'Claude',
    apiKeyPropName: 'anthropicApiKey',
    models: [
      { modelName: 'Claude 3.7 Sonnet', modelId: 'claude-3-7-sonnet-latest', inputCostC: 300, outputCostC: 1500 },
      { modelName: 'Claude 3.5 Haiku', modelId: 'claude-3-5-haiku-latest', inputCostC: 80, outputCostC: 400 },
      { modelName: 'Claude 3 Opus', modelId: 'claude-3-opus-latest', inputCostC: 1500, outputCostC: 7500 },
    ]
  },
  gemini: {
    serviceName: 'Google Gemini',
    value: 'gemini',
    label: 'Gemini',
    apiKeyPropName: 'geminiApiKey',
    models: [
      { modelName: 'Gemini 1.5 Pro', modelId: 'gemini-1.5-pro', inputCostC: 250, outputCostC: 1000 },
      { modelName: 'Gemini 1.5 Flash-8B', modelId: 'gemini-1.5-flash-8b', inputCostC: 7.5, outputCostC: 30 },
      { modelName: 'Gemini 1.5 Flash', modelId: 'gemini-1.5-flash', inputCostC: 15, outputCostC: 60 },
      { modelName: 'Gemini 2.0 Flash-Lite', modelId: 'gemini-2.0-flash-lite', inputCostC: 7.5, outputCostC: 30 },
      { modelName: 'Gemini 2.0 Flash', modelId: 'gemini-2.0-flash', inputCostC: 10, outputCostC: 40 },
    ]
  },
  deepseek: {
    serviceName: 'DeepSeek',
    value: 'deepseek',
    label: 'Deepseek',
    apiKeyPropName: 'deepseekApiKey',
    models: [
      { modelName: 'DeepSeek Chat', modelId: 'deepseek-chat', inputCostC: 7, outputCostC: 110 },
      { modelName: 'DeepSeek Reasoner', modelId: 'deepseek-reasoner', inputCostC: 14, outputCostC: 219 },
    ]
  },
  fireworks: {
    serviceName: 'Fireworks AI',
    value: 'fireworks',
    label: 'Fireworks',
    apiKeyPropName: 'fireworksApiKey',
    models: [
      { modelName: 'LLAMA 3 1 405B', modelId: 'accounts/fireworks/models/llama-v3p1-405b-instruct', inputCostC: 300, outputCostC: 300 },
      { modelName: 'LLAMA 3 1 70B', modelId: 'accounts/fireworks/models/llama-v3p1-70b-instruct', inputCostC: 90, outputCostC: 90 },
      { modelName: 'LLAMA 3 1 8B', modelId: 'accounts/fireworks/models/llama-v3p1-8b-instruct', inputCostC: 20, outputCostC: 20 },
      { modelName: 'QWEN 2 5 72B', modelId: 'accounts/fireworks/models/qwen2p5-72b-instruct', inputCostC: 90, outputCostC: 90 },
    ]
  },
  together: {
    serviceName: 'Together AI',
    value: 'together',
    label: 'Together AI',
    apiKeyPropName: 'togetherApiKey',
    models: [
      { modelName: 'LLAMA 3 2 3B', modelId: 'meta-llama/Llama-3.2-3B-Instruct-Turbo', inputCostC: 6, outputCostC: 6 },
      { modelName: 'LLAMA 3 1 405B', modelId: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', inputCostC: 350, outputCostC: 350 },
      { modelName: 'LLAMA 3 1 70B', modelId: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', inputCostC: 88, outputCostC: 88 },
      { modelName: 'LLAMA 3 1 8B', modelId: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', inputCostC: 18, outputCostC: 18 },
      { modelName: 'Gemma 2 27B', modelId: 'google/gemma-2-27b-it', inputCostC: 80, outputCostC: 80 },
      { modelName: 'Gemma 2 9B', modelId: 'google/gemma-2-9b-it', inputCostC: 30, outputCostC: 30 },
      { modelName: 'QWEN 2 5 72B', modelId: 'Qwen/Qwen2.5-72B-Instruct-Turbo', inputCostC: 120, outputCostC: 120 },
      { modelName: 'QWEN 2 5 7B', modelId: 'Qwen/Qwen2.5-7B-Instruct-Turbo', inputCostC: 30, outputCostC: 30 },
    ]
  }
}