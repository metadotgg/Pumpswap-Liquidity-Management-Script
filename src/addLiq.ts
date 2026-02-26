import { pumpSwapPoolCreator } from "./PumpSwapPoolCreatorInstance";

async function main() {
  const { ADD_LIQ_AMOUNT } = process.env;
  if (!ADD_LIQ_AMOUNT) {
    throw new Error("❌ Missing ADD_LIQ_AMOUNT environment variable");
  }

  await pumpSwapPoolCreator.addLiquidity(Number(ADD_LIQ_AMOUNT), false);
}

main().catch(console.error);
