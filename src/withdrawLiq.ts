import { pumpSwapPoolCreator } from "./PumpSwapPoolCreatorInstance";

async function main() {
  const { WITHDRAW_LP_AMOUNT } = process.env;
  if (!WITHDRAW_LP_AMOUNT) {
    throw new Error("❌ Missing WITHDRAW_LP_AMOUNT environment variable");
  }
  await pumpSwapPoolCreator.withDrawLP(Number(WITHDRAW_LP_AMOUNT));
}

main().catch(console.error);
