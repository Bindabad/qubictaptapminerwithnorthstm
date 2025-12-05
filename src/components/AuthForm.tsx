import { useState } from 'react';
import { Wallet, LogIn, ExternalLink } from 'lucide-react';
import { authService } from '../services/authService';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [walletAddress, setWalletAddress] = useState('DEMOWALLETFORHACKATHONTWENTYFOURJUDGESQUBICTAPTAPMINERDEMO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.signInWithWallet(walletAddress.toUpperCase());
      onAuthSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDU2LCAxODksIDI0OCwgMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-20"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl mb-6 shadow-2xl shadow-cyan-500/50 rotate-3 hover:rotate-0 transition-transform duration-300">
            <span className="text-4xl font-bold text-white">Q</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">Qubic Launchpad</h1>
          <p className="text-slate-300 text-lg">Connect your wallet to access the platform</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-slate-700/50">
          <div className="mb-6 p-5 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <Wallet className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-white font-bold mb-2 text-base">Get Your Qubic Wallet</h3>
                <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                  Create or access your official Qubic wallet to start mining
                </p>
                <a
                  href="https://wallet.qubic.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold px-4 py-2 rounded-lg transition-all duration-200 text-sm shadow-lg shadow-cyan-500/30"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Qubic Wallet
                </a>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2 font-medium">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-white font-bold mb-3">
                <Wallet className="w-5 h-5 text-cyan-400" />
                Qubic Wallet ID
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value.toUpperCase())}
                required
                maxLength={60}
                className="w-full bg-slate-900/50 border border-slate-600 focus:border-cyan-500 rounded-xl px-4 py-3.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 font-mono text-sm transition-all"
                placeholder="ENTER YOUR 60 CHARACTER WALLET ADDRESS"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-400 font-medium">
                  {walletAddress.length}/60 characters
                </p>
                {walletAddress.length === 60 && (
                  <span className="text-xs text-cyan-400 flex items-center gap-1 font-bold">
                    <span>✓</span> Valid Format
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || walletAddress.length !== 60}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none shadow-xl shadow-cyan-500/30 disabled:shadow-none flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold">1</span>
                <span>Visit <span className="text-cyan-400 font-semibold">wallet.qubic.org</span> to create your wallet</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold">2</span>
                <span>Copy your 60-character wallet address</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold">3</span>
                <span>Paste it above and start earning</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            Powered by Qubic's Useful Proof of Work
          </p>
        </div>
      </div>
    </div>
  );
}
