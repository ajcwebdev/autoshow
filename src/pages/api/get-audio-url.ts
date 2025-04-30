// web/src/pages/api/get-audio-url.ts

import type { APIRoute } from "astro"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { dbService } from "../../db.ts"
import { env } from "../../utils.ts"

export const POST: APIRoute = async ({ request }) => {
  console.log("[api/get-audio-url] POST request started")
  try {
    const body = await request.json()
    console.log(`[api/get-audio-url] Raw request body: ${JSON.stringify(body, null, 2)}`)
    
    const id = body?.id
    const walletAddress = body?.walletAddress
    
    console.log(`[api/get-audio-url] id: ${id}, walletAddress: ${walletAddress}`)
    
    if (!id || !walletAddress) {
      console.error("[api/get-audio-url] Missing required parameters")
      return new Response(JSON.stringify({ error: 'id and walletAddress are required' }), { status: 400 })
    }
    
    const showNote = await dbService.getShowNote(id)
    if (!showNote) {
      console.error("[api/get-audio-url] Show note not found")
      return new Response(JSON.stringify({ error: 'Show note not found' }), { status: 404 })
    }
    
    if (showNote.walletAddress !== walletAddress && walletAddress !== env['ADMIN_WALLET']) {
      console.error("[api/get-audio-url] Unauthorized access attempt")
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 })
    }
    
    const region = env['AWS_REGION'] || 'us-east-2'
    const bucket = env['S3_BUCKET_NAME'] || 'autoshow-test'
    const key = `${showNote.title}.wav`
    
    const client = new S3Client({ region })
    const command = new GetObjectCommand({ Bucket: bucket, Key: key })
    const url = await getSignedUrl(client, command, { expiresIn: 3600 })
    
    console.log("[api/get-audio-url] Successfully generated signed URL")
    return new Response(JSON.stringify({ url }), { status: 200 })
  } catch (error) {
    console.error(`[api/get-audio-url] Caught error: ${error}`)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({ error: `An error occurred while generating audio URL: ${errorMessage}` }), { status: 500 })
  }
}