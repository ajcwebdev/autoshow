// utils/getModel.js

export function getModel(modelType) {
  switch (modelType) {
    case 'base':
      return "ggml-base.bin"
    case 'medium':
      return "ggml-medium.bin"
    case 'large':
      return "ggml-large-v2.bin"
    // case 'custom':
    //   return "ggml-base.en.bin"
    default:
      console.error(`Unknown model type: ${modelType}`)
      process.exit(1)
  }
}