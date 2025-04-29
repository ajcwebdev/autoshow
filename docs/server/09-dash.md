# Dash

## Outline

- [Create Data Contract](#create-data-contract)
- [Save Content on Dash Platform](#save-content-on-dash-platform)

## Create Data Contract

```bash
npm run create-data-contract
```

## Get Wallet Balance

Fastify endpoint:

```bash
curl -X POST http://localhost:3000/dash-balance \
  -H 'Content-Type: application/json' \
  -d '{"mnemonic":"coil evidence seed guide craft thrive kangaroo height goat pilot bless visa","walletAddress":"yQHygFk4px2zxtvHk33o5YCySUWjZNqdPh"}'
```

Astro endpoint:

```bash
curl -X POST http://localhost:4321/api/dash-balance \
  -H 'Content-Type: application/json' \
  -d '{"mnemonic":"coil evidence seed guide craft thrive kangaroo height goat pilot bless visa","walletAddress":"yQHygFk4px2zxtvHk33o5YCySUWjZNqdPh"}'
```