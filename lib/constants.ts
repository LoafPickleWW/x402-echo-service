const chain = process.env.CHAIN || "algorand:mainnet";
const isTestnet = chain.includes("testnet");

export const ECHO_CONFIG = {
  serviceName: "x402-echo-service",
  version: "1.0.0",
  chain,

  // Pricing (in microunits)
  priceAlgoMicro: 10_000,      // 0.01 ALGO
  priceUsdcMicro: 10_000,      // 0.01 USDC (6 decimals)

  // Network fee retained on refunds
  networkFeeMicro: 1_000,      // 0.001 ALGO

  receiverAddress: "X4O22L6VU7UUUB5QNHHNMGZIQMG44MF4TVMMKOLXJLAUXHUQT3JLG5CZCI",
  
  facilitatorUrl: process.env.FACILITATOR_URL || (isTestnet 
    ? "https://testnet.facilitator.goplausible.xyz" 
    : "https://facilitator.goplausible.xyz"),
    
  algodServer: process.env.ALGOD_SERVER || (isTestnet 
    ? "https://testnet-api.4160.nodely.dev" 
    : "https://mainnet-api.4160.nodely.dev"),
    
  algodToken: process.env.ALGOD_TOKEN || "",
  
  usdcAsaId: parseInt(process.env.USDC_ASA_ID || (isTestnet ? "10458941" : "31566704")),
};

