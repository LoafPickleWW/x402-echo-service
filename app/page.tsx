import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* CSS-in-JS for custom Pong animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pong-ball {
          0% { left: 36px; top: 30%; }
          25% { left: 50%; top: calc(100% - 20px); }
          50% { left: calc(100% - 36px); top: 70%; }
          75% { left: 50%; top: 20px; }
          100% { left: 36px; top: 30%; }
        }
        @keyframes left-paddle {
          0%, 100% { top: 30%; }
          50% { top: 50%; }
        }
        @keyframes right-paddle {
          0%, 100% { top: 50%; }
          50% { top: 70%; }
        }
        .animate-pong-ball {
          animation: pong-ball 3.5s infinite linear;
        }
        .animate-left-paddle {
          animation: left-paddle 3.5s infinite ease-in-out;
        }
        .animate-right-paddle {
          animation: right-paddle 3.5s infinite ease-in-out;
        }
      `}} />

      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-teal-500/20 blur-[120px]" />
        <div className="absolute top-[-10%] right-[20%] w-[500px] h-[500px] rounded-full bg-emerald-500/20 blur-[100px]" />
      </div>

      <header className="relative w-full max-w-5xl mx-auto px-6 py-8 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-black border border-zinc-800 flex items-center justify-center p-1.5 shadow-inner">
            <Image
              src="/icon.png"
              alt="wen.tools logo"
              width={40}
              height={40}
              className="object-contain scale-[1.35] rounded-full"
            />
          </div>
          <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            wen.tools
          </span>
        </div>
        <a
          href="https://www.wen.tools/agents"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-zinc-400 hover:text-teal-400 transition-colors duration-200"
        >
          Agent Marketplace &rarr;
        </a>
      </header>

      <main className="relative flex-1 w-full max-w-3xl mx-auto px-6 py-16 md:py-24 flex flex-col items-center text-center">
        
        {/* Pong Animation Box */}
        <div className="relative w-full max-w-md h-40 bg-zinc-900/35 border border-zinc-900 rounded-2xl overflow-hidden mb-12 shadow-2xl backdrop-blur-sm">
          {/* Net in the middle */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-zinc-800/60 -translate-x-1/2" />
          
          {/* Left Paddle */}
          <div className="absolute left-4 w-2 h-12 bg-gradient-to-b from-teal-400 to-teal-500 rounded-full -translate-y-1/2 animate-left-paddle" />
          
          {/* Right Paddle */}
          <div className="absolute right-4 w-2 h-12 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-full -translate-y-1/2 animate-right-paddle" />
          
          {/* Ball (Round Logo) */}
          <div className="absolute w-10 h-10 rounded-full bg-black border border-zinc-800 flex items-center justify-center p-1.5 shadow-inner shadow-lg -translate-x-1/2 -translate-y-1/2 animate-pong-ball overflow-hidden">
            <Image
              src="/icon.png"
              alt="wen.tools ball"
              width={40}
              height={40}
              className="object-contain scale-[1.35] rounded-full"
            />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent mb-4">
          wen.tools ping bot
        </h1>
        
        <p className="text-lg text-zinc-400 max-w-xl leading-relaxed mb-10">
          A secure, payment-gated microservice built on the <code className="text-teal-400 font-mono text-sm bg-teal-950/40 px-2 py-0.5 rounded border border-teal-900/50">x402</code> protocol for automated ping testing and mainnet/testnet verification.
        </p>

        {/* CTA Section */}
        <div className="w-full max-w-md p-0.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 shadow-xl shadow-teal-950/20 mb-16 hover:scale-[1.02] transition-transform duration-300">
          <div className="bg-zinc-900/95 backdrop-blur-sm rounded-[14px] p-6 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h3 className="font-semibold text-zinc-100 text-base">Ready to test the agent?</h3>
              <p className="text-sm text-zinc-400 mt-1">Submit test payments & check responses live.</p>
            </div>
            <a
              href="https://www.wen.tools/agents"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-zinc-950 font-bold text-sm tracking-wide shadow-lg hover:shadow-teal-400/20 transition-all duration-200 whitespace-nowrap"
            >
              Test Endpoint
            </a>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="w-full text-left">
          <h2 className="text-xl font-bold text-zinc-200 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 rounded bg-teal-400" />
            Service Endpoints
          </h2>
          
          <div className="grid gap-4">
            {/* Ping Health check */}
            <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800/80 transition-colors duration-250">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-zinc-800 text-zinc-400">
                  GET
                </span>
                <code className="text-sm font-semibold text-zinc-300 flex-1">
                  /api/echo/ping
                </code>
                <span className="text-xs text-zinc-500">Public</span>
              </div>
              <p className="text-xs text-zinc-400 leading-normal">
                Returns the service operational status, supported chains, accepted assets, and configuration parameters.
              </p>
            </div>

            {/* Test Echo */}
            <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800/80 transition-colors duration-250">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-teal-950/80 text-teal-400 border border-teal-900/30">
                  GET
                </span>
                <code className="text-sm font-semibold text-zinc-300 flex-1">
                  /api/echo/test?amount=10000
                </code>
                <span className="text-xs text-teal-400 font-medium">x402 Protected</span>
              </div>
              <p className="text-xs text-zinc-400 leading-normal">
                Checks and verifies an exact x402 USDC payment. Triggers a background auto-refund back to the sender address.
              </p>
            </div>

            {/* Stress test */}
            <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800/80 transition-colors duration-250">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-teal-950/80 text-teal-400 border border-teal-900/30">
                  GET
                </span>
                <code className="text-sm font-semibold text-zinc-300 flex-1">
                  /api/echo/stress?count=1
                </code>
                <span className="text-xs text-teal-400 font-medium">x402 Protected</span>
              </div>
              <p className="text-xs text-zinc-400 leading-normal">
                x402 protected endpoint for stress testing. Accepts payment proportional to the count parameter.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-5xl mx-auto px-6 py-8 mt-auto border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <p>&copy; {new Date().getFullYear()} wen.tools. All rights reserved.</p>
        <p className="flex items-center gap-1.5">
          Powered by
          <a
            href="https://github.com/LoafPickleWW/x402-echo-service"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-teal-400 transition-colors duration-150"
          >
            x402-echo-service
          </a>
        </p>
      </footer>
    </div>
  );
}
