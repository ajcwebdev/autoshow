// web/src/components/groups/Wallet.tsx

import React from 'react'

export const WalletStep: React.FC<{
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
  walletAddress: string
  setWalletAddress: React.Dispatch<React.SetStateAction<string>>
  mnemonic: string
  setMnemonic: React.Dispatch<React.SetStateAction<string>>
  dashBalance: number | null
  setDashBalance: React.Dispatch<React.SetStateAction<number | null>>
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
}> = ({
  isLoading,
  setIsLoading,
  setError,
  walletAddress,
  setWalletAddress,
  mnemonic,
  setMnemonic,
  dashBalance,
  setDashBalance,
  setCurrentStep
}) => {
  const handleCheckBalance = async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (!walletAddress || !mnemonic) {
        throw new Error('Please enter wallet address and mnemonic')
      }
      const balanceRes = await fetch('http://localhost:3000/dash-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mnemonic, walletAddress })
      })
      if (!balanceRes.ok) throw new Error('Error getting balance')
      const data = await balanceRes.json()
      setDashBalance(data.balance)
      setCurrentStep(1)
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError('An unknown error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <label htmlFor="walletAddress">Wallet Address</label>
      <input
        type="text"
        id="walletAddress"
        value={walletAddress}
        onChange={e => setWalletAddress(e.target.value)}
      />
      <label htmlFor="mnemonic">Mnemonic</label>
      <input
        type="text"
        id="mnemonic"
        value={mnemonic}
        onChange={e => setMnemonic(e.target.value)}
      />
      <button disabled={isLoading} onClick={handleCheckBalance}>
        {isLoading ? 'Checking...' : 'Check Balance'}
      </button>
      {dashBalance !== null && (
        <p>Balance: {dashBalance}</p>
      )}
    </>
  )
}
