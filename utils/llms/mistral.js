import fs from 'fs'
import MistralClient from '@mistralai/mistralai'

const mistralModel = {
  MIXTRAL_8x7b: "open-mixtral-8x7b",
  MIXTRAL_8x22b: "open-mixtral-8x22b",
  MISTRAL_SMALL: "mistral-small-latest",
  MISTRAL_MEDIUM: "mistral-medium-latest",
  MISTRAL_LARGE: "mistral-large-latest",
}

export async function callMistral(transcriptContent, outputFilePath) {
  const mistral = new MistralClient(process.env.MISTRAL_API_KEY)

  const response = await mistral.chat({
    model: mistralModel.MISTRAL_SMALL,
    messages: [{ role: 'user', content: transcriptContent }],
  })

  const { choices: [{ message: { content }, finish_reason }], model, usage } = response

  fs.writeFileSync(outputFilePath, content, err => {
    if (err) {
      console.error('Error writing to file', err)
    } else {
      console.log(`Transcript saved to ${outputFilePath}`)
    }
  })

  console.log(`\nMistral response:\n\n${JSON.stringify(response, null, 2)}`)
  console.log(`\nFinish Reason: ${finish_reason}\nModel: ${model}`)
  console.log(`Token Usage:\n  - ${usage.prompt_tokens} prompt tokens\n  - ${usage.completion_tokens} completion tokens\n  - ${usage.total_tokens} total tokens\n`)
}