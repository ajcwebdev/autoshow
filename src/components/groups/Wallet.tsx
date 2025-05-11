// src/components/groups/Wallet.tsx

import type { Setter } from 'solid-js'
const l = console.log
const err = console.error
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
  const handleCheckBalance = async (): Promise<void> => {
    l(`[WalletStep] Checking balance for wallet: ${props.walletAddress}`)
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
        err(`[WalletStep] Error checking balance: ${balanceRes.statusText}`)
        throw new Error('Error getting balance')
      }
      const data = await balanceRes.json()
      l(`[WalletStep] Successfully retrieved balance: ${data.balance} duff`)
      props.setDashBalance(data.balance)
    } catch (error) {
      err(`[WalletStep] Error in handleCheckBalance:`, error)
      if (error instanceof Error) props.setError(error.message)
      else props.setError('An unknown error occurred.')
    } finally {
      props.setIsLoading(false)
    }
  }
  l('[WalletStep] Rendering wallet step component')
  return (
    <div class="space-y-4">
      <div class="space-y-2">
        <label for="walletAddress" class="block text-sm font-medium text-foreground">Wallet Address</label>
        <input 
          type="text" 
          id="walletAddress" 
          value={props.walletAddress} 
          onInput={e => props.setWalletAddress(e.target.value)} 
          class="form__input w-full py-2"
        />
      </div>
      <div class="space-y-2">
        <label for="mnemonic" class="block text-sm font-medium text-foreground">Mnemonic</label>
        <input 
          type="text" 
          id="mnemonic" 
          value={props.mnemonic} 
          onInput={e => props.setMnemonic(e.target.value)} 
          class="form__input w-full py-2"
        />
      </div>
      <div class="flex gap-4">
        <button 
          disabled={props.isLoading} 
          onClick={handleCheckBalance}
          class="button button--primary"
        >
          {props.isLoading ? 'Checking...' : 'Check Balance'}
        </button>
        <button 
          onClick={() => props.setCurrentStep(1)}
          class="button button--secondary"
        >
          Next Step
        </button>
      </div>
      {props.dashBalance !== null && (
        <div class="bg-base-800 p-4 rounded-md mt-4">
          <p class="text-primary-300">Balance: {props.dashBalance} duff</p>
          <p class="text-primary-300">Credits: {(props.dashBalance / 500).toFixed(0)}</p>
        </div>
      )}
    </div>
  )
}