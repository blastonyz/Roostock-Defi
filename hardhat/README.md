# Rootstock-Defi Demo: Sovryn Swap

Simple demo of WRBTC → DoC swap on Rootstock testnet via Sovryn AMM.

## Quick Start

```bash
npm install
npm run demo
```

## What It Does

Executes a token swap on Rootstock testnet:
- **Input**: 0.0001 WRBTC
- **Output**: ~6.5 DoC (via Sovryn AMM quote engine)
- **Chain**: Rootstock Testnet (ChainID 31)
- **Contracts**: Live Sovryn contracts on testnet

## Setup

1. Set `RSK_PRIVATE_KEY` in `.env` with your wallet's private key
2. Wallet must have tRBTC on testnet (get from [faucet.rootstock.io](https://faucet.rootstock.io))
3. Run: `npm run demo`

## Output Example

```
Wallet: 0x0571235134dc15a00f02916987c2c16b5fc52e2a
WRBTC balance: 0.0001

Quote: 0.0001 WRBTC → 6.498 DoC
✅ Approved WRBTC
✅ Swap executed: 0xfcd01c19...
✅ Final DoC balance: 12.97 DoC
```

## Files

- `scripts/sovryn-amm-swap.ts` - Swap logic
- `contracts/SovrynSwapper.sol` - Reference contract ABI
- `.env` - Configuration (testnet RPC, addresses)

```

### Make a deployment to Sepolia

This project includes an example Ignition module to deploy the contract. You can deploy this module to a locally simulated chain or to Sepolia.

To run the deployment to a local chain:

```shell
npx hardhat ignition deploy ignition/modules/Counter.ts
```

To run the deployment to Sepolia, set your values in `.env`:

```env
SEPOLIA_RPC_URL=https://rpc.sepolia.org
SEPOLIA_PRIVATE_KEY=your_private_key_without_0x
```

After setting the variables, you can run the deployment with the Sepolia network:

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
```
