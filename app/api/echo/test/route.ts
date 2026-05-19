import { NextRequest, NextResponse, after } from "next/server";
import { httpServer, NextRequestAdapter } from "@/lib/x402";
import { sendRefund } from "@/lib/refund";
import { ECHO_CONFIG } from "@/lib/constants";
import { decodeTransaction, getSenderFromTransaction } from "@x402-avm/avm";

let isInitialized = false;
async function initServer() {
  if (!isInitialized) {
    await httpServer.initialize();
    isInitialized = true;
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    await initServer();

    console.log("Incoming request headers:", Object.fromEntries(request.headers.entries()));

    // Wrap the request in the GoPlausible HTTP adapter
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

    console.log("GoPlausible HTTP result:", JSON.stringify(httpResult, null, 2));

    // If payment is required or verification fails, return the 402 challenge
    if (httpResult.type === "payment-error") {
      return NextResponse.json(
        {
          status: "payment_required",
          service: ECHO_CONFIG.serviceName,
          message: "This endpoint requires an x402 payment. Send 0.01 USDC.",
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
      
      // Settle the payment with the facilitator
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

      // Decode the transaction to find the sender's address
      const payload = httpResult.paymentPayload.payload as any;
      const paymentGroup = payload.paymentGroup;
      const paymentIndex = payload.paymentIndex;
      const paymentTxnB64 = paymentGroup[paymentIndex];
      const txnBytes = decodeTransaction(paymentTxnB64);
      const senderAddress = getSenderFromTransaction(txnBytes);

      // Trigger the Auto-Refund in the background
      after(async () => {
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
      });

      // Return successful response with full diagnostics immediately
      return NextResponse.json({
        status: "success",
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
        message: "x402 payment verified on Algorand. Auto-refund is processing in the background.",
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
