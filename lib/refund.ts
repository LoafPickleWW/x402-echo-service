import algosdk from "algosdk";
import { ECHO_CONFIG } from "./constants";

/**
 * Auto-refund: sends back (payment - network fee) to the original sender.
 */
export async function sendRefund(params: {
  senderAddress: string;    // The original payer to refund
  amount: number;           // Original payment amount in microunits
  asset: number;            // 0 = ALGO, otherwise ASA ID
  network: string;          // "algorand:mainnet" or "algorand:testnet"
}): Promise<{ txId: string; refundAmount: number; feeRetained: number }> {
  const { senderAddress, amount, asset, network } = params;
  // For USDC (non-zero asset), return the full amount back.
  // For native ALGO (asset 0), retain the network fee.
  const feeRetained = asset === 0 ? ECHO_CONFIG.networkFeeMicro : 0;
  const refundAmount = amount - feeRetained;
  const assetLabel = asset === 0 ? "microALGO" : "micro-USDC";

  if (refundAmount <= 0) {
    throw new Error(
      `Payment of ${amount} ${assetLabel} is too small. ` +
      `Minimum payment: ${feeRetained + 1} ${assetLabel} to cover network fee + refund.`
    );
  }

  // 1. Wait 6 seconds to allow the settlement transaction to be fully committed and indexed by the node
  // preventing the 'underflow on subtracting ... from sender amount 0' pool validation race condition.
  await new Promise((resolve) => setTimeout(resolve, 6000));

  // 2. Create an Algod client dynamically
  const isTestnet = network.includes("testnet");
  const algodServer = isTestnet
    ? "https://testnet-api.4160.nodely.dev"
    : "https://mainnet-api.4160.nodely.dev";

  const algod = new algosdk.Algodv2(
    "",
    algodServer,
    "" // Port
  );

  // 2. Get suggested params
  const suggestedParams = await algod.getTransactionParams().do();

  // 3. Build refund payment: RECEIVER_ADDRESS → senderAddress
  let txn: algosdk.Transaction;
  
  if (asset === 0) {
    txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: ECHO_CONFIG.receiverAddress,
      receiver: senderAddress,
      amount: refundAmount,
      suggestedParams,
      note: new Uint8Array(Buffer.from("x402-echo auto-refund")),
    });
  } else {
    txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: ECHO_CONFIG.receiverAddress,
      receiver: senderAddress,
      amount: refundAmount,
      assetIndex: asset,
      suggestedParams,
      note: new Uint8Array(Buffer.from("x402-echo auto-refund")),
    });
  }

  // 4. Sign with your mnemonic
  if (!process.env.ALGORAND_MNEMONIC) {
    throw new Error("ALGORAND_MNEMONIC environment variable is not set.");
  }
  const account = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
  const signedTxn = txn.signTxn(account.sk);
  const txId = txn.txID();

  // 5. Submit and wait for confirmation
  await algod.sendRawTransaction(signedTxn).do();
  await algosdk.waitForConfirmation(algod, txId, 4);

  return { txId, refundAmount, feeRetained };
}
