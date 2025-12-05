import { useState, useEffect } from 'react';
import { Users, Copy, CheckCircle, DollarSign, TrendingUp, Gift } from 'lucide-react';
import { supabase } from '../lib/supabase';
import InfoBox from './InfoBox';

interface ReferralSystemProps {
  userId: string;
  referralCode: string;
}

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarned: number;
  pendingRewards: number;
}

export default function ReferralSystem({ userId, referralCode }: ReferralSystemProps) {
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarned: 0,
    pendingRewards: 0
  });

  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  useEffect(() => {
    loadReferralStats();
  }, [userId]);

  const loadReferralStats = async () => {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('referral_earnings, pending_referral_rewards')
        .eq('id', userId)
        .single();

      const { data: referrals, count } = await supabase
        .from('users')
        .select('id, hetzner_account_active', { count: 'exact' })
        .eq('referred_by', userId);

      const activeCount = referrals?.filter(r => r.hetzner_account_active).length || 0;

      setStats({
        totalReferrals: count || 0,
        activeReferrals: activeCount,
        totalEarned: user?.referral_earnings || 0,
        pendingRewards: user?.pending_referral_rewards || 0
      });
    } catch (error) {
      console.error('Error loading referral stats:', error);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl border-2 border-black mb-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-2 flex items-center justify-center gap-3">
            <Users className="w-10 h-10 text-qubic-cyan" />
            Referral Program
          </h1>
          <p className="text-gray-600 font-medium text-lg">Earn rewards by inviting friends</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-black rounded-xl p-6 border-2 border-qubic-cyan text-center">
            <Users className="w-8 h-8 text-qubic-cyan mx-auto mb-2" />
            <p className="text-gray-400 text-xs font-bold mb-1">TOTAL REFERRALS</p>
            <p className="text-3xl font-bold text-qubic-cyan">{stats.totalReferrals}</p>
          </div>

          <div className="bg-black rounded-xl p-6 border-2 border-qubic-cyan text-center">
            <TrendingUp className="w-8 h-8 text-qubic-cyan mx-auto mb-2" />
            <p className="text-gray-400 text-xs font-bold mb-1">ACTIVE USERS</p>
            <p className="text-3xl font-bold text-qubic-cyan">{stats.activeReferrals}</p>
          </div>

          <div className="bg-black rounded-xl p-6 border-2 border-qubic-cyan text-center">
            <DollarSign className="w-8 h-8 text-qubic-cyan mx-auto mb-2" />
            <p className="text-gray-400 text-xs font-bold mb-1">TOTAL EARNED</p>
            <p className="text-3xl font-bold text-qubic-cyan">{stats.totalEarned.toFixed(2)}</p>
          </div>

          <div className="bg-black rounded-xl p-6 border-2 border-qubic-cyan text-center">
            <Gift className="w-8 h-8 text-qubic-cyan mx-auto mb-2" />
            <p className="text-gray-400 text-xs font-bold mb-1">PENDING</p>
            <p className="text-3xl font-bold text-qubic-cyan">{stats.pendingRewards.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-qubic-cyan/10 rounded-xl p-6 border-2 border-qubic-cyan mb-6">
          <h3 className="text-xl font-bold text-black mb-4">Your Referral Link</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 bg-white border-2 border-black rounded-xl px-4 py-3 text-black font-mono text-sm"
            />
            <button
              onClick={copyReferralLink}
              className="bg-qubic-cyan hover:bg-qubic-cyan/80 text-black font-bold px-6 py-3 rounded-xl transition-all border-2 border-black flex items-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-black rounded-xl p-6 border-2 border-qubic-cyan">
          <h3 className="text-xl font-bold text-white mb-4">Reward Structure</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-qubic-cyan rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-black font-bold">1</span>
              </div>
              <div>
                <p className="text-white font-bold">Signup Bonus: 100 Points</p>
                <p className="text-gray-400 text-sm">When your friend joins using your link</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-qubic-cyan rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-black font-bold">2</span>
              </div>
              <div>
                <p className="text-white font-bold">Hetzner Setup: 500 Points</p>
                <p className="text-gray-400 text-sm">When they link their Hetzner account</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-qubic-cyan rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-black font-bold">3</span>
              </div>
              <div>
                <p className="text-white font-bold">Active Mining: 5% Commission</p>
                <p className="text-gray-400 text-sm">Lifetime 5% of their mining earnings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-qubic-cyan/5 rounded-xl p-6 border-2 border-qubic-cyan text-center mb-6">
        <p className="text-black font-medium leading-relaxed">
          <span className="font-bold text-qubic-cyan">INVITE & EARN:</span> Share your unique referral link with friends.
          Earn instant bonuses when they join and continuous commissions from their mining activity!
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
