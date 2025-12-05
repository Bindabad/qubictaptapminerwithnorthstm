import { useState } from 'react';
import { Server, ExternalLink, CheckCircle, AlertCircle, Mail, Code } from 'lucide-react';
import InfoBox from './InfoBox';

interface HetznerOnboardingProps {
  userId: string;
  parentReferralCode: string;
  onComplete: () => void;
}

export default function HetznerOnboarding({ userId, parentReferralCode, onComplete }: HetznerOnboardingProps) {
  const [hetznerEmail, setHetznerEmail] = useState('');
  const [hetznerCode, setHetznerCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await (await import('../lib/supabase')).supabase
        .from('user_hetzner_referrals')
        .insert({
          user_id: userId,
          hetzner_referral_code: hetznerCode,
          hetzner_email: hetznerEmail,
          verification_status: 'pending'
        });

      if (insertError) throw insertError;

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit referral');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl mb-4 shadow-lg shadow-orange-500/20">
          <Server className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Join with Hetzner</h2>
        <p className="text-slate-400">Sign up under our referral to unlock mining profits</p>
      </div>

      <div className="mb-8 flex items-center justify-center gap-4">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-orange-400' : 'text-slate-600'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-orange-400 bg-orange-400/10' : 'border-slate-600'}`}>
            1
          </div>
          <span className="text-sm font-medium">Sign Up</span>
        </div>
        <div className="w-12 h-0.5 bg-slate-700" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-orange-400' : 'text-slate-600'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-orange-400 bg-orange-400/10' : 'border-slate-600'}`}>
            2
          </div>
          <span className="text-sm font-medium">Verify</span>
        </div>
        <div className="w-12 h-0.5 bg-slate-700" />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-orange-400' : 'text-slate-600'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-orange-400 bg-orange-400/10' : 'border-slate-600'}`}>
            3
          </div>
          <span className="text-sm font-medium">Earn</span>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-orange-400" />
              Step 1: Create Hetzner Account
            </h3>
            <ol className="space-y-3 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-orange-400 font-bold">1.</span>
                <span>Click the button below to sign up with our referral code</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 font-bold">2.</span>
                <span>Complete Hetzner registration with your email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 font-bold">3.</span>
                <span>Copy your Hetzner account email and customer ID</span>
              </li>
            </ol>
            <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Your Parent Referral Code:</p>
              <code className="text-orange-400 font-mono font-bold text-lg">{parentReferralCode}</code>
            </div>
          </div>

          <a
            href={`https://www.hetzner.com/?ref=${parentReferralCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            Sign Up with Hetzner
          </a>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200"
          >
            I've Created My Account
          </button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-400" />
              Step 2: Verify Your Account
            </h3>
            <p className="text-slate-300 mb-4">
              Enter your Hetzner account details to link it with your mining profile
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-slate-300 font-medium mb-2">
              <Mail className="w-4 h-4" />
              Hetzner Account Email
            </label>
            <input
              type="email"
              value={hetznerEmail}
              onChange={(e) => setHetznerEmail(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-slate-300 font-medium mb-2">
              <Code className="w-4 h-4" />
              Hetzner Customer ID
            </label>
            <input
              type="text"
              value={hetznerCode}
              onChange={(e) => setHetznerCode(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
              placeholder="12345"
            />
            <p className="text-sm text-slate-400 mt-1">
              Find this in your Hetzner dashboard under Account
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/20"
            >
              {loading ? 'Submitting...' : 'Verify Account'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 p-4 bg-green-500/5 rounded-lg border border-green-500/20 mb-6">
        <p className="text-sm text-green-300 leading-relaxed">
          <span className="font-semibold">Why Hetzner?</span> Industry-leading hardware at the best prices.
          AMD EPYC and Ryzen servers optimized for Qubic mining. Your referral helps fund the entire mining operation!
        </p>
      </div>

      <InfoBox
        title="How Northstm Works"
        features={[
          'Tap to mine QUBIC points and earn rewards through gamified mining',
          'Purchase Hetzner servers via referral system and earn commission on every transaction',
          'Cloud mining pool distributes profits based on your tap point contributions',
          'Redeem gift cards to boost mining power and increase earning potential'
        ]}
      />
    </div>
  );
}
