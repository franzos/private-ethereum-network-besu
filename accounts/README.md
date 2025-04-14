# Accounts

This directory contains scripts for generating Ethereum accounts for your private network.

## Usage

Generate accounts with:

```bash
pnpm install
pnpm run generate
```

## Custom Account Configuration

1. Create a `spec.json` file in the accounts directory with the following format:

```json
{
  "accounts": [
    {
      "name": "account 1",
      "balance": "0xad78ebc5ac6200000"
    },
    {
      "name": "account 2",
      "balance": "90000000000000000000000"
    },
    {
      "name": "account 3",
      "balance": "90000000000000000000000"
    }
  ]
}
```

2. If `spec.json` doesn't exist, the script will use `spec.json.example` as a fallback.

### Notes:

- You can define any number of accounts in the `accounts` array
- Each account requires a `name` and `balance` field
- Balances can be specified in hex format (with 0x prefix) or as a decimal string
- The script will generate new private keys for each account and update the `qbftConfigFile.json` with the account addresses and balances
