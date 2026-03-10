import "dotenv/config";
import { PumpSwapPoolCreator } from "./PumpSwapPool";

const {
  RPC_URL,
  WALLET_SECRET_KEY,
  BASE_MINT,
  BASE_MINT_DECIMALS,
  QUOTE_MINT,
  QUOTE_MINT_DECIMALS,
  INITIAL_BASE,
  INITIAL_QUOTE,
  POOL_INDEX,
} = process.env;

if (
  !WALLET_SECRET_KEY ||
  !BASE_MINT ||
  !QUOTE_MINT ||
  !INITIAL_BASE ||
  !INITIAL_QUOTE ||
  !BASE_MINT_DECIMALS ||
  !QUOTE_MINT_DECIMALS
) {
  throw new Error("❌ Missing environment variables");
}

export const pumpSwapPoolCreator = new PumpSwapPoolCreator(
  RPC_URL || "https://api.mainnet-beta.solana.com",
  WALLET_SECRET_KEY,
  POOL_INDEX ? Number(POOL_INDEX) : 0,
  BASE_MINT,
  QUOTE_MINT,
  Number(BASE_MINT_DECIMALS),
  Number(QUOTE_MINT_DECIMALS)
);
