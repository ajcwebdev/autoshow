# Dash

## Outline

- [Get Wallet Balance](#get-wallet-balance)

## Get Wallet Balance

```bash
curl --json '{
  "mnemonic":"coil evidence seed guide craft thrive kangaroo height goat pilot bless visa",
  "walletAddress":"yQHygFk4px2zxtvHk33o5YCySUWjZNqdPh"
}' http://localhost:4321/api/dash-balance -s | json_pp
```