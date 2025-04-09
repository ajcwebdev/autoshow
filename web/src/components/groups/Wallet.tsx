// web/src/components/groups/Wallet.tsx

import React from 'react'

export const Wallet: React.FC<{
  walletAddress: string
  setWalletAddress: React.Dispatch<React.SetStateAction<string>>
  mnemonic: string
  setMnemonic: React.Dispatch<React.SetStateAction<string>>
}> = ({
  walletAddress,
  setWalletAddress,
  mnemonic,
  setMnemonic
}) => {
  return (
    <>
      <label htmlFor="walletAddress">Wallet Address</label>
      <input
        type="text"
        id="walletAddress"
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
      />

      <label htmlFor="mnemonic">Mnemonic</label>
      <input
        type="text"
        id="mnemonic"
        value={mnemonic}
        onChange={(e) => setMnemonic(e.target.value)}
      />
    </>
  )
}