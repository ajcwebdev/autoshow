// web/src/pages/api/dash-balance.ts

import type { APIRoute } from "astro"
import Dash from "dash"

export const POST: APIRoute = async ({ request }) => {
  console.log("[api/dash-balance] POST request started")
  let client = null
  
  try {
    const body = await request.json()
    console.log(`[api/dash-balance] Processing request for wallet`)
    
    const { mnemonic, walletAddress } = body
    
    if (!mnemonic || !walletAddress) {
      console.error("[api/dash-balance] Missing required parameters")
      return new Response(JSON.stringify({ error: 'mnemonic and walletAddress are required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    console.log(`[api/dash-balance] Connecting to Dash client for wallet: ${walletAddress}`)
    client = new Dash.Client({ 
      network: 'testnet', 
      wallet: { 
        mnemonic, 
        unsafeOptions: { 
          skipSynchronizationBeforeHeight: 1000000 
        } 
      } 
    })
    
    console.log(`[api/dash-balance] Getting wallet account`)
    const account = await client.getWalletAccount()
    console.log(`[api/dash-balance] Retrieving balance`)
    const totalBalance = account.getTotalBalance()
    console.log(`[api/dash-balance] Balance retrieved successfully: ${totalBalance}`)
    
    return new Response(JSON.stringify({ address: walletAddress, balance: totalBalance }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error(`[api/dash-balance] Error processing request: ${error}`)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  } finally {
    if (client) {
      console.log(`[api/dash-balance] Disconnecting Dash client`)
      try {
        await client.disconnect()
      } catch (error) {
        console.error(`[api/dash-balance] Error disconnecting client: ${error}`)
      }
    }
  }
}