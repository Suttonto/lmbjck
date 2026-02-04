import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

export function Auth() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      await signIn("password", formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymous = async () => {
    setLoading(true);
    try {
      await signIn("anonymous");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to continue as guest");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-stone-900 to-black flex flex-col items-center justify-center p-4">
      {/* Decorative trees */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute bottom-0 left-0 text-[200px] leading-none text-green-900">🌲</div>
        <div className="absolute bottom-0 right-0 text-[200px] leading-none text-green-900">🌲</div>
        <div className="absolute bottom-0 left-1/4 text-[150px] leading-none text-green-800">🌲</div>
        <div className="absolute bottom-0 right-1/4 text-[150px] leading-none text-green-800">🌲</div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl md:text-8xl mb-2 animate-bounce">🪓</div>
          <h1 className="font-black text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 tracking-tight">
            LUMBERJACK
          </h1>
          <h2 className="font-black text-2xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-b from-red-400 via-red-600 to-red-800 tracking-wider mt-1">
            NINJA
          </h2>
          <p className="text-amber-600/80 mt-2 text-sm md:text-base">Slice wood. Avoid bombs. Be legendary.</p>
        </div>

        {/* Auth Card */}
        <div className="bg-gradient-to-b from-amber-900/60 to-amber-950/80 rounded-2xl p-6 md:p-8 border-2 border-amber-700/50 shadow-2xl shadow-black/50 backdrop-blur-sm">
          <h3 className="text-amber-200 font-bold text-xl md:text-2xl text-center mb-6">
            {flow === "signIn" ? "Welcome Back, Lumberjack!" : "Join the Crew!"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-amber-400 text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-3 bg-amber-950/80 border-2 border-amber-700/50 rounded-lg text-amber-100 placeholder-amber-600/50 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="lumberjack@forest.com"
              />
            </div>
            <div>
              <label className="block text-amber-400 text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                name="password"
                required
                className="w-full px-4 py-3 bg-amber-950/80 border-2 border-amber-700/50 rounded-lg text-amber-100 placeholder-amber-600/50 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <input type="hidden" name="flow" value={flow} />

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-900/30 rounded-lg p-2 border border-red-700/50">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:via-amber-400 hover:to-amber-500 text-amber-950 font-black text-lg rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-900/50"
            >
              {loading ? "..." : flow === "signIn" ? "CHOP IN!" : "JOIN THE FOREST!"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
              className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
            >
              {flow === "signIn" ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-amber-700/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-amber-900/60 text-amber-500">or</span>
            </div>
          </div>

          <button
            onClick={handleAnonymous}
            disabled={loading}
            className="w-full py-3 bg-amber-800/50 hover:bg-amber-800/70 border-2 border-amber-700/50 text-amber-300 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue as Guest 🌲
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-8 text-center text-amber-700/50 text-xs">
        Requested by @plantingtoearn · Built by @clonkbot
      </footer>
    </div>
  );
}
