// scripts/create-dash-contract.ts

import Dash from 'dash'

/**
 * Creates a new data contract for storing show notes.
 * The contract schema includes frontMatter, prompt, llmOutput, and transcript as strings.
 */
async function createDashContract() {
  const client = new Dash.Client({
    network: process.env['NETWORK'] || 'testnet',
    wallet: {
      mnemonic: process.env['MNEMONIC'] || '',
      unsafeOptions: {
        skipSynchronizationBeforeHeight: 990000
      }
    }
  })

  try {
    const platform = client.platform
    const identityId = process.env['IDENTITY_ID']
    if (!identityId) {
      throw new Error('Missing IDENTITY_ID environment variable')
    }
    const identity = await platform.identities.get(identityId)
    if (!identity) {
      throw new Error(`Could not find identity with ID ${identityId}`)
    }
    const contractDocuments = {
      showNote: {
        type: 'object',
        properties: {
          frontMatter: { type: 'string', position: 0 },
          prompt: { type: 'string', position: 1 },
          llmOutput: { type: 'string', position: 2 },
          transcript: { type: 'string', position: 3 }
        },
        additionalProperties: false
      }
    }
    const contract = await platform.contracts.create(contractDocuments, identity)
    await platform.contracts.publish(contract, identity)
    console.log('Data contract created successfully with ID:', contract.toJSON().id)
    console.log('Set the following in your .env:\n')
    console.log(`DASH_CONTRACT_ID="${contract.toJSON().id}"`)
  } catch (error) {
    console.error('Error creating Dash contract:', error)
  } finally {
    client.disconnect()
  }
}

createDashContract()