// src/utils/dash-documents.ts

/**
 * @fileoverview Utilities for creating Dash documents to store show notes data.
 * This module exports a function for directly submitting the final
 * frontMatter, prompt, llmOutput, and transcript to a Dash contract.
 */

import Dash from 'dash'
import { err } from '../utils/logging.ts'

/**
 * Submits a "showNote" document to the given contractId and identityId, using the
 * final text fields produced by processing a video or file.
 * 
 * @async
 * @param {string} identityId - The Dash identity that owns the document
 * @param {string} contractId - The ID of the Dash data contract defining the "showNote" doc
 * @param {string} frontMatter - YAML front matter to store
 * @param {string} prompt - Prompt text used during processing
 * @param {string} llmOutput - Language model output
 * @param {string} transcript - Final transcript content
 * @param {string} [mnemonic] - The mnemonic used to create the wallet
 * @returns {Promise<string>} The document ID assigned by Dash Platform
 * @throws {Error} If creation or broadcast of the document fails
 */
export async function submitShowNoteDoc(
  identityId: string,
  contractId: string,
  frontMatter: string,
  prompt: string,
  llmOutput: string,
  transcript: string,
  mnemonic?: string
): Promise<string> {
  const client = new Dash.Client({
    network: process.env['NETWORK'] || 'testnet',
    wallet: {
      mnemonic: mnemonic || '',
      unsafeOptions: {
        skipSynchronizationBeforeHeight: 990000,
      },
    },
    apps: {
      showNoteContract: {
        contractId
      }
    }
  })

  try {
    const platform = client.platform

    const identity = await platform.identities.get(identityId)
    if (!identity) {
      throw new Error(`Identity not found for ID: ${identityId}`)
    }

    const showNoteDoc = await platform.documents.create(
      'showNoteContract.showNote',
      identity,
      {
        frontMatter: frontMatter || '',
        prompt: prompt || '',
        llmOutput: llmOutput || '',
        transcript: transcript || ''
      }
    )

    await platform.documents.broadcast(
      { create: [showNoteDoc] },
      identity
    )

    return showNoteDoc.toJSON().$id
  } catch (error) {
    err('Error submitting show note document to Dash:', error)
    throw error
  } finally {
    client.disconnect()
  }
}