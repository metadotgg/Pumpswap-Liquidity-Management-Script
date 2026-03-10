import { pumpSwapPoolCreator } from "./PumpSwapPoolCreatorInstance";

async function main() {
  const { INITIAL_BASE, INITIAL_QUOTE } = process.env;

  if (!INITIAL_BASE || !INITIAL_QUOTE) {
    throw new Error("❌ Missing INITIAL_BASE or INITIAL_QUOTE environment variables");
  }

  await pumpSwapPoolCreator.createPool(
    Number(INITIAL_BASE),
    Number(INITIAL_QUOTE)
  );
}

main().catch(console.error);