# Dash

## Outline

- [Create Data Contract](#create-data-contract)
- [Save Content on Dash Platform](#save-content-on-dash-platform)

## Create Data Contract

```bash
npm run create-data-contract
```

## Get Wallet Balance

```bash
curl -X POST http://localhost:3000/dash-balance \
  -H 'Content-Type: application/json' \
  -d '{"mnemonic":"YOUR_MNEMONIC","walletAddress":"YOUR_WALLET_ADDRESS"}'
```

## Save Content on Dash Platform

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt",
  "openaiApiKey": "",
  "walletAddress": "yQHygFk4px2zxtvHk33o5YCySUWjZNqdPh",
  "mnemonic": "coil evidence seed guide craft thrive kangaroo height goat pilot bless visa",
  "identityId": "5jM4nYqQeBQ8t1hgtF8yLUhXqMiwJUcb3Yibhaqatukb",
  "contractId": "9c9bYUsGoRrzq9g19Vw7QDRE6wkoZy9J1r4LKrCUeJqD"
}' \
  "http://localhost:3000/api/process"
```