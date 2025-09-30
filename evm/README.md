# EVM Smart Contracts

This directory contains a simple Counter smart contract with tests and deployment scripts.

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Install Forge dependencies:
   ```bash
   forge install
   ```

## Building

```bash
forge build
```

## Testing

```bash
forge test
```

## Deployment

### Deploy Counter to Mainnet
```bash
bun run deploy:counter:mainnet
```

### Deploy Counter to Local Network
```bash
bun run deploy:counter:local
```

## Environment Variables

Make sure to set the following environment variables:
- `PRIVATE_KEY`: Your private key for deployment
- `MAINNET_RPC_URL`: Your mainnet RPC endpoint (for mainnet deployment)
- `ETHERSCAN_API_KEY`: Your Etherscan API key for contract verification