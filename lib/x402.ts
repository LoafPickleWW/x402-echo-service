import { x402ResourceServer, HTTPFacilitatorClient, x402HTTPResourceServer } from "@x402-avm/core/server";
import { registerExactAvmScheme } from "@x402-avm/avm/exact/server";
import { ALGORAND_MAINNET_CAIP2, ALGORAND_TESTNET_CAIP2 } from "@x402-avm/avm";
import { ECHO_CONFIG } from "./constants";
import { NextRequest } from "next/server";
import { Network } from "@x402-avm/core/types";

class MultiNetworkFacilitatorClient extends HTTPFacilitatorClient {
  async verify(paymentPayload: any, paymentRequirements: any) {
    const isTestnet = paymentRequirements?.network?.includes("testnet") || paymentRequirements?.network?.includes("SGO1");
    (this as any).url = isTestnet 
      ? "https://testnet.facilitator.goplausible.xyz" 
      : "https://facilitator.goplausible.xyz";
    return super.verify(paymentPayload, paymentRequirements);
  }

  async settle(paymentPayload: any, paymentRequirements: any) {
    const isTestnet = paymentRequirements?.network?.includes("testnet") || paymentRequirements?.network?.includes("SGO1");
    (this as any).url = isTestnet 
      ? "https://testnet.facilitator.goplausible.xyz" 
      : "https://facilitator.goplausible.xyz";
    return super.settle(paymentPayload, paymentRequirements);
  }
}

// Initialize facilitator client
const facilitatorClient = new MultiNetworkFacilitatorClient({
  url: ECHO_CONFIG.facilitatorUrl,
});

// Create and configure x402 resource server
const server = new x402ResourceServer(facilitatorClient);
registerExactAvmScheme(server, {
  networks: [ALGORAND_MAINNET_CAIP2 as Network, ALGORAND_TESTNET_CAIP2 as Network],
});

// Define routes configuration for x402 HTTP resource server
export const routesConfig = {
  "/api/echo/test": {
    accepts: [
      // Mainnet
      {
        scheme: "exact",
        payTo: ECHO_CONFIG.receiverAddress,
        price: {
          asset: "0", // Native ALGO
          amount: ECHO_CONFIG.priceAlgoMicro.toString(),
        },
        network: ALGORAND_MAINNET_CAIP2 as Network,
      },
      {
        scheme: "exact",
        payTo: ECHO_CONFIG.receiverAddress,
        price: {
          asset: "31566704", // Mainnet USDC
          amount: ECHO_CONFIG.priceUsdcMicro.toString(),
        },
        network: ALGORAND_MAINNET_CAIP2 as Network,
      },
      // Testnet
      {
        scheme: "exact",
        payTo: ECHO_CONFIG.receiverAddress,
        price: {
          asset: "0", // Native ALGO
          amount: ECHO_CONFIG.priceAlgoMicro.toString(),
        },
        network: ALGORAND_TESTNET_CAIP2 as Network,
      },
      {
        scheme: "exact",
        payTo: ECHO_CONFIG.receiverAddress,
        price: {
          asset: "10458941", // Testnet USDC
          amount: ECHO_CONFIG.priceUsdcMicro.toString(),
        },
        network: ALGORAND_TESTNET_CAIP2 as Network,
      }
    ]
  },
  "/api/echo/stress": {
    accepts: [
      // Mainnet
      {
        scheme: "exact",
        payTo: ECHO_CONFIG.receiverAddress,
        price: (context: any) => {
          const countStr = context.adapter.getQueryParam ? context.adapter.getQueryParam("count") : undefined;
          const count = typeof countStr === "string" ? parseInt(countStr) : 1;
          const price = ECHO_CONFIG.priceAlgoMicro * (isNaN(count) || count <= 0 ? 1 : count);
          return price.toString();
        },
        network: ALGORAND_MAINNET_CAIP2 as Network,
      },
      // Testnet
      {
        scheme: "exact",
        payTo: ECHO_CONFIG.receiverAddress,
        price: (context: any) => {
          const countStr = context.adapter.getQueryParam ? context.adapter.getQueryParam("count") : undefined;
          const count = typeof countStr === "string" ? parseInt(countStr) : 1;
          const price = ECHO_CONFIG.priceAlgoMicro * (isNaN(count) || count <= 0 ? 1 : count);
          return price.toString();
        },
        network: ALGORAND_TESTNET_CAIP2 as Network,
      }
    ]
  }
};

export const httpServer = new x402HTTPResourceServer(server, routesConfig as any);

// Framework adapter for Next.js App Router NextRequest
export class NextRequestAdapter {
  constructor(private req: NextRequest) {}

  getHeader(name: string) {
    return this.req.headers.get(name) || undefined;
  }
  getMethod() {
    return this.req.method;
  }
  getPath() {
    return this.req.nextUrl.pathname;
  }
  getUrl() {
    return this.req.url;
  }
  getAcceptHeader() {
    return this.req.headers.get("accept") || "";
  }
  getUserAgent() {
    return this.req.headers.get("user-agent") || "";
  }
  getQueryParam(name: string) {
    return this.req.nextUrl.searchParams.get(name) || undefined;
  }
}
