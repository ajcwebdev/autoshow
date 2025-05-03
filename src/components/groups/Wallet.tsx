// src/components/groups/Wallet.tsx

import type { Setter } from 'solid-js'

export const WalletStep = (props: {
  isLoading: boolean
  setIsLoading: Setter<boolean>
  setError: Setter<string | null>
  walletAddress: string
  setWalletAddress: Setter<string>
  mnemonic: string
  setMnemonic: Setter<string>
  dashBalance: number | null
  setDashBalance: Setter<number | null>
  setCurrentStep: Setter<number>
}) => {
  const handleCheckBalance = async () => {
    console.log(`[WalletStep] Checking balance for wallet: ${props.walletAddress}`)
    props.setIsLoading(true)
    props.setError(null)
    
    try {
      if (!props.walletAddress || !props.mnemonic) throw new Error('Please enter wallet address and mnemonic')
      
      const balanceRes = await fetch('http://localhost:4321/api/dash-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mnemonic: props.mnemonic, walletAddress: props.walletAddress })
      })
      
      if (!balanceRes.ok) {
        console.error(`[WalletStep] Error checking balance: ${balanceRes.statusText}`)
        throw new Error('Error getting balance')
      }
      
      const data = await balanceRes.json()
      console.log(`[WalletStep] Successfully retrieved balance: ${data.balance} duff`)
      props.setDashBalance(data.balance)
    } catch (err) {
      console.error(`[WalletStep] Error in handleCheckBalance:`, err)
      if (err instanceof Error) props.setError(err.message)
      else props.setError('An unknown error occurred.')
    } finally {
      props.setIsLoading(false)
    }
  }
  
  return (
    <>
      <label for="walletAddress">Wallet Address</label>
      <input type="text" id="walletAddress" value={props.walletAddress} onInput={e => props.setWalletAddress(e.target.value)} />
      <label for="mnemonic">Mnemonic</label>
      <input type="text" id="mnemonic" value={props.mnemonic} onInput={e => props.setMnemonic(e.target.value)} />
      <button disabled={props.isLoading} onClick={handleCheckBalance}>{props.isLoading ? 'Checking...' : 'Check Balance'}</button>
      <br /><br />
      <button onClick={() => props.setCurrentStep(1)}>Next Step</button>
      {props.dashBalance !== null && (
        <>
          <p>Balance: {props.dashBalance} duff</p>
          <p>Credits: {(props.dashBalance / 500).toFixed(0)}</p>
        </>
      )}
    </>
  )
}