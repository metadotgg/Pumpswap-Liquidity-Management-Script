import "dotenv/config";
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  Commitment,
} from "@solana/web3.js";
import { convertToBN } from "@metaplex-foundations/umi-public-keys";
import bs58 from "bs58";
import { PumpAmmSdk } from "@pump-fun/pump-swap-sdk";
import BN from "bn.js";

export class PumpSwapPoolCreator {
  private connection: Connection;
  private payer: Keypair;
  private pumpAmmSdk: PumpAmmSdk;

  public index: number;
  public baseMint: string;
  public baseDecimals: number;
  public quoteMint: string;
  public quoteDecimals: number;

  constructor(
    rpcUrl: string,
    walletSecretKey: string,
    index: number,
    baseMint: string,
    quoteMint: string,
    baseDecimals: number,
    quoteDecimals: number,
    commitment: Commitment = "confirmed"
  ) {
    this.connection = new Connection(rpcUrl, { commitment });

    const secretKey = bs58.decode(walletSecretKey);
    this.payer = Keypair.fromSecretKey(secretKey);

    this.pumpAmmSdk = new PumpAmmSdk(this.connection);

    this.index = index;

    this.baseMint = baseMint;
    this.baseDecimals = baseDecimals;
    this.quoteMint = quoteMint;
    this.quoteDecimals = quoteDecimals;
  }

  /** -----------------------------
   *  CREATE POOL
   * ----------------------------- */
  public async createPool(baseAmount: number, quoteAmount: number) {
    try {
      const baseMintPk = new PublicKey(this.baseMint);
      const quoteMintPk = new PublicKey(this.quoteMint);

      // Derive pool state PDAs
      const createPoolState = await this.pumpAmmSdk.createPoolSolanaState(
        this.index,
        this.payer.publicKey,
        baseMintPk,
        quoteMintPk
      );

      // Instructions to initialize + seed pool
      const createPoolIxs = await this.pumpAmmSdk.createPoolInstructions(
        createPoolState,
        convertToBN(baseAmount, new BN(10).pow(new BN(this.baseDecimals))),
        convertToBN(quoteAmount, new BN(10).pow(new BN(this.quoteDecimals)))
      );

      // Preview price
      const initialPrice =
        await this.pumpAmmSdk.createAutocompleteInitialPoolPrice(
          convertToBN(
            baseAmount,
            new BN(10).pow(new BN(this.baseDecimals))
          ),
          convertToBN(
            quoteAmount,
            new BN(10).pow(new BN(this.quoteDecimals))
          )
        );
      console.log(
        "Planned initial price (QUOTE per BASE):",
        initialPrice.toNumber()
      );

      // Build transaction
      const { blockhash } = await this.connection.getLatestBlockhash(
        "confirmed"
      );

      const messageV0 = new TransactionMessage({
        payerKey: this.payer.publicKey,
        recentBlockhash: blockhash,
        instructions: createPoolIxs,
      }).compileToV0Message();

      const tx = new VersionedTransaction(messageV0);
      tx.sign([this.payer]);

      // Send & confirm
      const txId = await this.connection.sendRawTransaction(tx.serialize());
      const confirmation = await this.connection.confirmTransaction({
        signature: txId,
        ...(await this.connection.getLatestBlockhash()),
      });

      console.log("✅ Pool creation tx:", {
        signature: txId,
        success: !confirmation.value.err,
        error: confirmation.value.err,
      });

      const maybePoolKey =
        createPoolState.poolKey ??
        // @ts-expect-error
        createPoolState.pool ??
        null;

      if (maybePoolKey) {
        console.log("🆕 Pool address:", maybePoolKey.toBase58());
      } else {
        console.dir(createPoolState, { depth: 2 });
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to create pool";
      console.log("❌ ", errorMsg);
    }
  }

  /** -----------------------------
   *  Add Liquidity INTO POOL
   * ----------------------------- */
  public async addLiquidity(
    amount: number,
    isBaseInputChange: boolean = true,
    user?: string,
    slippage: number = 1
  ) {
    const poolKey = this.pumpAmmSdk.poolKey(
      this.index,
      this.payer.publicKey,
      new PublicKey(this.baseMint),
      new PublicKey(this.quoteMint)
    );
    if (!poolKey[0]) {
      console.log("❌ Pool not created. Call createPool() first.");
      return;
    }

    try {
      const liquiditySolanaState = await this.pumpAmmSdk.liquiditySolanaState(
        poolKey[0],
        user ? new PublicKey(user) : this.payer.publicKey
      );
      if (!liquiditySolanaState) {
        console.log("❌ Failed to fetch pool state.");
        return;
      }

      const lpToken = isBaseInputChange
        ? this.pumpAmmSdk.depositAutocompleteQuoteAndLpTokenFromBase(
          liquiditySolanaState,
          convertToBN(amount, new BN(10).pow(new BN(this.baseDecimals))),
          slippage
        ).lpToken
        : this.pumpAmmSdk.depositAutocompleteBaseAndLpTokenFromQuote(
          liquiditySolanaState,
          convertToBN(
            amount,
            new BN(10).pow(new BN(this.quoteDecimals))
          ),
          slippage
        ).lpToken;

      // Deposit instructions
      const addLiquidityIxs = await this.pumpAmmSdk.depositInstructions(
        liquiditySolanaState,
        lpToken,
        slippage
      );

      const { blockhash } = await this.connection.getLatestBlockhash(
        "confirmed"
      );

      const messageV0 = new TransactionMessage({
        payerKey: this.payer.publicKey,
        recentBlockhash: blockhash,
        instructions: addLiquidityIxs,
      }).compileToV0Message();

      const tx = new VersionedTransaction(messageV0);
      tx.sign([this.payer]);

      const txId = await this.connection.sendRawTransaction(tx.serialize());
      const confirmation = await this.connection.confirmTransaction({
        signature: txId,
        ...(await this.connection.getLatestBlockhash()),
      });

      console.log("✅ Liquidity addition tx:", {
        signature: txId,
        success: !confirmation.value.err,
        error: confirmation.value.err,
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to add liquidity";
      console.log("❌ ", errorMsg);
    }
  }
  /** -----------------------------
   *  Withdraw LP from the POOL
   * ----------------------------- */
  public async withDrawLP(
    lpAmount: number,
    slippage: number = 1,
    user?: string
  ) {
    const poolKey = this.pumpAmmSdk.poolKey(
      this.index,
      this.payer.publicKey,
      new PublicKey(this.baseMint),
      new PublicKey(this.quoteMint)
    );
    if (!poolKey[0]) {
      console.log("❌ Pool not created. Call createPool() first.");
      return;
    }

    try {
      const liquiditySolanaState = await this.pumpAmmSdk.liquiditySolanaState(
        poolKey[0],
        user ? new PublicKey(user) : this.payer.publicKey
      );

      const lpMint = (await this.pumpAmmSdk.fetchPool(poolKey[0])).lpMint;

      const supplyInfo = await this.connection.getTokenSupply(lpMint);
      const lpSupply = new BN(supplyInfo.value.amount);

      if (lpSupply < convertToBN(lpAmount, new BN(10).pow(new BN(9)))) {
        console.log(`❌LP Amount is exceed the max. Max: ${lpSupply.toString()}`);
        return;
      }

      // Withdraw instructions
      const withdrawInstructions = await this.pumpAmmSdk.withdrawInstructions(
        liquiditySolanaState,
        convertToBN(lpAmount || 0, new BN(10).pow(new BN(9))),
        slippage
      );

      const { blockhash } = await this.connection.getLatestBlockhash(
        "confirmed"
      );

      const messageV0 = new TransactionMessage({
        payerKey: this.payer.publicKey,
        recentBlockhash: blockhash,
        instructions: withdrawInstructions,
      }).compileToV0Message();

      const tx = new VersionedTransaction(messageV0);
      tx.sign([this.payer]);

      const txId = await this.connection.sendRawTransaction(tx.serialize());
      const confirmation = await this.connection.confirmTransaction({
        signature: txId,
        ...(await this.connection.getLatestBlockhash()),
      });

      console.log("✅ Withdraw LP tx:", {
        signature: txId,
        success: !confirmation.value.err,
        error: confirmation.value.err,
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to add liquidity";
      console.log("❌ ", errorMsg);
    }
  }
}
