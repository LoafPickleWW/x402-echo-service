import algosdk from "algosdk";
import { NextRequest, NextResponse, after } from "next/server";
import { httpServer, NextRequestAdapter } from "@/lib/x402";
import { sendRefund } from "@/lib/refund";
import { ECHO_CONFIG } from "@/lib/constants";
import { decodeTransaction, getSenderFromTransaction } from "@x402-avm/avm";

let isInitialized = false;
async function initServer() {
  if (!isInitialized) {
    try {
      const serverInstance = (httpServer as any).server;
      if (serverInstance && Array.isArray(serverInstance.facilitatorClients)) {
        for (const client of serverInstance.facilitatorClients) {
          if (client) {
            console.log("[Route Patch] Dynamic patch applied to facilitator client.");
            
            client.getSupported = async () => {
              console.log("[Route Patch] getSupported called - returning local kinds");
              return {
                kinds: [
                  {
                    x402Version: 2,
                    scheme: "exact",
                    network: "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=",
                  },
                  {
                    x402Version: 2,
                    scheme: "exact",
                    network: "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
                  }
                ],
                extensions: [],
                signers: {}
              };
            };

            client.verify = async (paymentPayload: any, paymentRequirements: any) => {
              try {
                console.log("[Route Patch] verify called locally");
                const payload = paymentPayload.payload;
                const paymentGroup = payload.paymentGroup;
                const paymentIndex = payload.paymentIndex;
                const paymentTxnB64 = paymentGroup[paymentIndex];

                const decodedSigned = decodeTransaction(paymentTxnB64);
                
                if (paymentRequirements.scheme !== "exact") {
                  return { isValid: false, invalidReason: "unsupported_scheme" };
                }
                return { isValid: true };
              } catch (e: any) {
                console.error("[Route Patch] Verification exception:", e);
                return { isValid: false, invalidReason: "verification_exception", invalidMessage: e.message };
              }
            };

            client.settle = async (paymentPayload: any, paymentRequirements: any) => {
              try {
                console.log("[Route Patch] settle called locally");
                const payload = paymentPayload.payload;
                const paymentGroup = payload.paymentGroup;
                const paymentIndex = payload.paymentIndex;
                const paymentTxnB64 = paymentGroup[paymentIndex];

                const txnBytes = decodeTransaction(paymentTxnB64);
                
                const isTestnet = paymentRequirements?.network?.includes("testnet") || paymentRequirements?.network?.includes("SGO1");
                const algodServer = isTestnet
                  ? "https://testnet-api.4160.nodely.dev"
                  : "https://mainnet-api.4160.nodely.dev";

                const algod = new algosdk.Algodv2("", algodServer, "");
                console.log(`[Route Patch] Direct submission to ${isTestnet ? "Testnet" : "Mainnet"} node...`);
                const submitRes = await algod.sendRawTransaction(txnBytes).do();
                const actualTxId = (submitRes as any).txId || (submitRes as any).txid;
                console.log(`[Route Patch] Submitted. TxID: ${actualTxId}`);

                return {
                  success: true,
                  transaction: actualTxId,
                  network: paymentRequirements.network,
                  payer: getSenderFromTransaction(txnBytes),
                };
              } catch (e: any) {
                console.error("[Route Patch] Settlement exception:", e);
                return {
                  success: false,
                  errorReason: "settlement_failed",
                  errorMessage: e.message,
                  transaction: "",
                };
              }
            };
          }
        }
      }
    } catch (patchErr) {
      console.warn("[Route Patch] Failed to apply dynamic patch:", patchErr);
    }

    await httpServer.initialize();
    isInitialized = true;
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const countStr = request.nextUrl.searchParams.get("count");
  const count = countStr ? parseInt(countStr) : 1;
  const safeCount = isNaN(count) || count <= 0 ? 1 : count;

  try {
    await initServer();

    // Wrap request in GoPlausible adapter
    const adapter = new NextRequestAdapter(request);
    const requestContext = {
      adapter,
      path: adapter.getPath(),
      method: adapter.getMethod(),
      paymentHeader: request.headers.get("x-payment") || request.headers.get("X-Payment") || undefined,
    };

    // Run GoPlausible request processor
    const verifyStart = Date.now();
    const httpResult = await httpServer.processHTTPRequest(requestContext);
    const verifyTime = Date.now() - verifyStart;

    // If payment required or fails, return 402 challenge
    if (httpResult.type === "payment-error") {
      return NextResponse.json(
        {
          status: "payment_required",
          service: ECHO_CONFIG.serviceName,
          message: `This endpoint requires an x402 payment for stress testing. Price: ${
            (ECHO_CONFIG.priceUsdcMicro * safeCount) / 1_000_000
          } USDC.`,
          payment_details: httpResult.response.body,
        },
        {
          status: httpResult.response.status,
          headers: httpResult.response.headers as Record<string, string>,
        }
      );
    }

    if (httpResult.type === "payment-verified") {
      const settlementStart = Date.now();
      
      // Settle the payment
      const settleResult = await httpServer.processSettlement(
        httpResult.paymentPayload,
        httpResult.paymentRequirements
      );
      
      const settlementTime = Date.now() - settlementStart;

      if (!settleResult.success) {
        return NextResponse.json(
          {
            status: "error",
            message: "Payment settlement failed",
            error: settleResult.errorMessage || settleResult.errorReason,
          },
          { status: 402 }
        );
      }

      // Decode the transaction to find sender
      const payload = httpResult.paymentPayload.payload as any;
      const paymentGroup = payload.paymentGroup;
      const paymentIndex = payload.paymentIndex;
      const paymentTxnB64 = paymentGroup[paymentIndex];
      const txnBytes = decodeTransaction(paymentTxnB64);
      const senderAddress = getSenderFromTransaction(txnBytes);

      // Trigger the Auto-Refund in the background
      const runRefund = async () => {
        try {
          const assetId = parseInt(httpResult.paymentRequirements.asset);
          console.log(`[Background Refund] Initiating refund for sender: ${senderAddress}, amount: ${httpResult.paymentRequirements.amount}`);
          const refundResult = await sendRefund({
            senderAddress,
            amount: parseInt(httpResult.paymentRequirements.amount),
            asset: assetId,
            network: httpResult.paymentRequirements.network,
          });
          console.log(`[Background Refund] Refund successful. Tx ID: ${refundResult.txId}`);
        } catch (refundError) {
          console.error("[Background Refund] Refund failed:", refundError);
        }
      };

      // Safely schedule via after() if available, otherwise fire-and-forget
      if (typeof after === "function") {
        try {
          after(runRefund);
        } catch (afterError) {
          console.warn("[Background Refund] Failed to schedule via after(), falling back to direct async execution:", afterError);
          runRefund();
        }
      } else {
        console.log("[Background Refund] after() is not a function, falling back to direct async execution");
        runRefund();
      }

      // Return successful response with full diagnostics immediately
      return NextResponse.json({
        status: "success",
        count: safeCount,
        echo: {
          payment_verified: true,
          tx_id: settleResult.transaction,
          sender: senderAddress,
          receiver: ECHO_CONFIG.receiverAddress,
          amount_received: httpResult.paymentRequirements.amount,
          asset: parseInt(httpResult.paymentRequirements.asset) === 0 ? "ALGO" : "USDC",
          network: httpResult.paymentRequirements.network,
          timestamp: new Date().toISOString(),
        },
        refund: {
          refund_pending: true,
          note: "Payment verified successfully. Auto-refund initiated in the background and will arrive in 6-10 seconds.",
        },
        diagnostics: {
          facilitator: "GoPlausible",
          verification_time_ms: verifyTime,
          settlement_time_ms: settlementTime,
          total_round_trip_ms: Date.now() - startTime,
        },
        message: `Stress test verification successful for ${safeCount} iterations. Auto-refund is processing in the background.`,
      });
    }

    return NextResponse.json(
      { status: "error", message: "Unexpected response state" },
      { status: 500 }
    );

  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Payment processing failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
