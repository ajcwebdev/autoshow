// shared/constants.ts

export const ENV_VARS_MAP = {
  deepgramApiKey: 'DEEPGRAM_API_KEY',
  assemblyApiKey: 'ASSEMBLY_API_KEY',
  groqApiKey: 'GROQ_API_KEY',
  openaiApiKey: 'OPENAI_API_KEY',
  anthropicApiKey: 'ANTHROPIC_API_KEY',
  geminiApiKey: 'GEMINI_API_KEY',
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
      { modelName: 'GPT o1', modelId: 'o1', inputCostC: 750, outputCostC: 3000 },
      { modelName: 'GPT o3', modelId: 'o3', inputCostC: 500, outputCostC: 2000 },
      { modelName: 'GPT 4o', modelId: 'gpt-4o', inputCostC: 125, outputCostC: 500 },
      { modelName: 'GPT 4.1', modelId: 'gpt-4.1', inputCostC: 100, outputCostC: 400 },
      { modelName: 'GPT o4 MINI', modelId: 'o4-mini', inputCostC: 55, outputCostC: 220 },
      { modelName: 'GPT o3 MINI', modelId: 'o3-mini', inputCostC: 55, outputCostC: 220 },
      { modelName: 'GPT o1 MINI', modelId: 'o1-mini', inputCostC: 55, outputCostC: 220 },
      { modelName: 'GPT 4.1 MINI', modelId: 'gpt-4.1-mini', inputCostC: 20, outputCostC: 80 },
      { modelName: 'GPT 4o MINI', modelId: 'gpt-4o-mini', inputCostC: 7.5, outputCostC: 30 },
      { modelName: 'GPT 4.1 NANO', modelId: 'gpt-4.1-nano', inputCostC: 5, outputCostC: 20 },
    ]
  },
  claude: {
    serviceName: 'Anthropic Claude',
    value: 'claude',
    label: 'Claude',
    apiKeyPropName: 'anthropicApiKey',
    models: [
      { modelName: 'Claude 3 Opus', modelId: 'claude-3-opus-latest', inputCostC: 1500, outputCostC: 7500 },
      { modelName: 'Claude 3.7 Sonnet', modelId: 'claude-3-7-sonnet-latest', inputCostC: 300, outputCostC: 1500 },
      { modelName: 'Claude 3.5 Haiku', modelId: 'claude-3-5-haiku-latest', inputCostC: 80, outputCostC: 400 },
    ]
  },
  gemini: {
    serviceName: 'Google Gemini',
    value: 'gemini',
    label: 'Gemini',
    apiKeyPropName: 'geminiApiKey',
    models: [
      { modelName: 'Gemini 2.5 Pro Preview', modelId: 'gemini-2.5-pro-preview-03-25', inputCostC: 250, outputCostC: 1500 },
      { modelName: 'Gemini 1.5 Pro', modelId: 'gemini-1.5-pro', inputCostC: 250, outputCostC: 1000 },
      { modelName: 'Gemini 2.5 Flash Preview', modelId: 'gemini-2.5-flash-preview-04-17', inputCostC: 100, outputCostC: 350 },
      { modelName: 'Gemini 2.0 Flash', modelId: 'gemini-2.0-flash', inputCostC: 70, outputCostC: 40 },
      { modelName: 'Gemini 1.5 Flash', modelId: 'gemini-1.5-flash', inputCostC: 15, outputCostC: 60 },
      { modelName: 'Gemini 2.0 Flash-Lite', modelId: 'gemini-2.0-flash-lite', inputCostC: 7.5, outputCostC: 30 },
      { modelName: 'Gemini 1.5 Flash-8B', modelId: 'gemini-1.5-flash-8b', inputCostC: 7.5, outputCostC: 30 },
    ]
  }
}