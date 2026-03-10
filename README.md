# PumpSwap Liquidity Management

> **PumpSwap Liquidity Management** scripts for creating pools, depositing liquidity, and withdrawing LP tokens on the [PumpSwap](https://pump.fun/) AMM — the native decentralized exchange on Solana.

[![Language](https://img.shields.io/badge/language-TypeScript-3178C6.svg)](https://www.typescriptlang.org/)
[![Network](https://img.shields.io/badge/network-Solana-9945FF.svg)](https://solana.com/)
[![Stars](https://img.shields.io/github/stars/ElliteAnts/Pumpswap-Liquidity-Management-Script?style=flat-square)](https://github.com/ElliteAnts/Pumpswap-Liquidity-Management-Script/stargazers)

---

## What Is This?

PumpSwap is a constant-product AMM (`x * y = k`) deployed on Solana mainnet at program address `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA`. Tokens that complete their bonding curve on Pump.fun migrate directly into PumpSwap pools, where liquidity providers earn a share of the 0.25% trade fee (0.20% to LPs, 0.05% to the protocol).

This toolkit gives you a clean, environment-variable-driven interface to the three core liquidity operations on PumpSwap:

| Script | What It Does |
|--------|--------------|
| `createPool.ts` | Creates a new PumpSwap AMM pool with an initial base/quote deposit |
| `addLiq.ts` | Adds liquidity to an existing pool, minting proportional LP tokens |
| `withdrawLiq.ts` | Burns LP tokens and withdraws your share of base and quote reserves |

---

## Prerequisites

- **Node.js** ≥ 18
- **Yarn**
- A funded Solana wallet (mainnet-beta) whose private key you can set in `.env`
- Access to a Solana RPC endpoint (default: `https://api.mainnet-beta.solana.com`)

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/ElliteAnts/Pumpswap-Liquidity-Management-Script.git
cd Pumpswap-Liquidity-Management-Script
yarn
```

### 2. Configure Environment Variables

Copy the sample file and fill in your values:

```bash
cp .env.sample .env
```

| Variable | Description | Example |
|----------|-------------|---------|
| `SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` |
| `WALLET_SECRET_KEY` | Base-58 private key of your wallet | `Your_Wallet_Privatekey` |
| `BASE_MINT` | Mint address of the base token | *(your token mint. e.g. 2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv)* |
| `QUOTE_MINT` | Mint address of the quote token | *(e.g. So11111111111111111111111111111111111111112)* |
| `BASE_MINT_DECIMALS` | Decimal places of the base token | `9` |
| `QUOTE_MINT_DECIMALS` | Decimal places of the quote token | `6` |
| `INITIAL_BASE` | Initial base amount when creating a pool (UI units) | `10` |
| `INITIAL_QUOTE` | Initial quote amount when creating a pool (UI units) | `0.001` |
| `ADD_LIQ_AMOUNT` | Quote amount to add on deposit (UI units) | `0.001` |
| `WITHDRAW_LP_AMOUNT` | LP token amount to burn on withdrawal (UI units) | `0.001` |
| `POOL_INDEX` | Pool index for PDA derivation | `0` |

> **Security note:** Never commit your `.env` file. The `.gitignore` already excludes it.

### 3. Build

```bash
yarn run build
```

### 4. Run the Scripts

```bash
# Create a new PumpSwap pool
yarn run create

# Add liquidity to your pool
yarn run deposit

# Withdraw liquidity (burn LP tokens)
yarn run withdraw
```

---

## How PumpSwap Liquidity Works

Understanding the mechanics behind the scripts helps you tune parameters for your use case.

**Pool creation** derives a unique Pool PDA from `["pool", index, creator, base_mint, quote_mint]`. The first deposit sets the pool's initial price ratio based on `INITIAL_BASE` and `INITIAL_QUOTE`.

**Depositing liquidity** mints LP tokens proportionally to your contribution relative to the current pool reserves. The SDK ensures your deposit maintains the existing ratio; any excess from the larger side is refunded.

**Withdrawing liquidity** burns LP tokens and returns a pro-rata share of both base and quote reserves:

```
base_out  = (lp_burned / lp_supply) × base_reserves
quote_out = (lp_burned / lp_supply) × quote_reserves
```

---

## Project Structure

```
├── src/
│   ├── createPool.ts        # Pool creation logic
│   ├── addLiq.ts            # Liquidity deposit logic
│   └── withdrawLiq.ts       # Liquidity withdrawal logic
├── .env.sample              # Environment variable template
├── package.json             # Dependencies & npm scripts
├── tsconfig.json            # TypeScript configuration
└── yarn.lock                # Locked dependency versions
```

---

## On-Chain Verification

All transactions below were executed against mainnet-beta and can be inspected on Solscan.

| Action | Transaction / Account |
|--------|-----------------------|
| Create Pool | [CZe675tm…DCp5](https://solscan.io/tx/CZe675tm9FooE3Vb7EpjXgRAThiwsdM76zkMUudMRh6jjHnenF47FoXqynoct5gGoQ53vKqGxoGkPZ1bzJrDCp5) |
| Pool Key | [BeFYKqP…FEMd1](https://solscan.io/account/BeFYKqPUwpJDbhHHG3ugFWexUPct3FNhpHdZPdbFEMd1) |
| Add Liquidity | [2EhhZig…kf9Yi](https://solscan.io/tx/2EhhZigxynH1rfAT7NRFmf37jSihPPBTYrcsaDddP9gjq4kBkrCL7LyFc7ATuxtFkcEMJfmdpF8jBidXpNxkf9Yi) |
| Withdraw Liquidity | [3UX1A7T…fR5Wj](https://solscan.io/tx/3UX1A7TuiZWvFs5b4cdJgKG9me9WkV5ufN5bvkNGrbWRqLNHptQAWhXVuHyjCC6DFmV5PeqKnsyGoaePDc4fR5Wj) |

---

## Contributing

Pull requests are welcome. Please open an issue first to discuss the change you'd like to make.

---

## Contact

Have a feature request or integration question? Reach out on [Telegram](https://t.me/metaggdev).
