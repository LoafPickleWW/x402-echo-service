import { NextResponse } from "next/server";
import { ECHO_CONFIG } from "@/lib/constants";

export async function GET() {
  return NextResponse.json({
    status: "live",
    service: ECHO_CONFIG.serviceName,
    chain: ECHO_CONFIG.chain,
    accepted_tokens: ["ALGO", "USDC"],
    price_algo: ECHO_CONFIG.priceAlgoMicro / 1_000_000,
    price_usdc: ECHO_CONFIG.priceUsdcMicro / 1_000_000,
    version: ECHO_CONFIG.version,
    timestamp: new Date().toISOString(),
  });
}
