import { useState, useEffect } from 'react';
import { DollarSign, Users, TrendingUp, Award, Server, Gift as GiftIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import InfoBox from './InfoBox';

interface ProfitDashboardProps {
  userId: string;
  userPoints: number;
}

interface Threshold {
  level: number;
  points_required: number;
  payout_percentage: number;
}

interface PoolStats {
  total_hashrate: number;
  daily_earnings_usd: number;
  active_servers: number;
  profit_pool_usd: number;
}

interface UserPayout {
  id: string;
  amount_usd: number;
  amount_qubic: number;
  threshold_level: number;
  status: string;
  created_at: string;
}

export default function ProfitDashboard({ userId, userPoints }: ProfitDashboardProps) {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [userPayouts, setUserPayouts] = useState<UserPayout[]>([]);
  const [nextThreshold, setNextThreshold] = useState<Threshold | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, [userId, userPoints]);

  const loadDashboardData = async () => {
    try {
      const [thresholdsRes, poolStatsRes, payoutsRes] = await Promise.all([
        supabase.from('payout_thresholds').select('*').eq('is_active', true).order('level'),
        supabase.from('mining_pool_stats').select('*').single(),
        supabase.from('user_payouts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5)
      ]);

      if (thresholdsRes.data) {
        setThresholds(thresholdsRes.data);
        const next = thresholdsRes.data.find(t => userPoints < parseFloat(String(t.points_required)));
        setNextThreshold(next || null);
      }

      if (poolStatsRes.data) {
        setPoolStats(poolStatsRes.data);
      }

      if (payoutsRes.data) {
        setUserPayouts(payoutsRes.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressToNext = () => {
    if (!nextThreshold) return 100;
    const required = parseFloat(String(nextThreshold.points_required));
    return Math.min(100, (userPoints / required) * 100);
  };

  const getCurrentLevel = () => {
    if (thresholds.length === 0) return 0;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (userPoints >= parseFloat(String(thresholds[i].points_required))) {
        return thresholds[i].level;
      }
    }
    return 0;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(0);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Profit Sharing Dashboard</h2>
        <p className="text-slate-400">Track real mining profits and your share of the rewards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-slate-300 text-sm">Daily Earnings</span>
          </div>
          <p className="text-3xl font-bold text-green-400">
            ${poolStats?.daily_earnings_usd.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Pool Total</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-5 h-5 text-blue-400" />
            <span className="text-slate-300 text-sm">Active Servers</span>
          </div>
          <p className="text-3xl font-bold text-blue-400">
            {poolStats?.active_servers || 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">Hetzner Miners</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <span className="text-slate-300 text-sm">Hash Rate</span>
          </div>
          <p className="text-3xl font-bold text-purple-400">
            {formatNumber(poolStats?.total_hashrate || 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">H/s Total</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-yellow-400" />
            <span className="text-slate-300 text-sm">Your Level</span>
          </div>
          <p className="text-3xl font-bold text-yellow-400">
            Level {getCurrentLevel()}
          </p>
          <p className="text-xs text-slate-400 mt-1">{formatNumber(userPoints)} points</p>
        </div>
      </div>

      {nextThreshold && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Progress to Level {nextThreshold.level}</h3>
            <span className="text-cyan-400 font-bold">{getProgressToNext().toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
              style={{ width: `${getProgressToNext()}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">
              {formatNumber(userPoints)} / {formatNumber(parseFloat(String(nextThreshold.points_required)))} points
            </span>
            <span className="text-green-400 font-semibold">
              Unlock {parseFloat(String(nextThreshold.payout_percentage)).toFixed(1)}% profit share
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Payout Levels
          </h3>
          <div className="space-y-3">
            {thresholds.map((threshold) => {
              const isUnlocked = userPoints >= parseFloat(String(threshold.points_required));
              const isCurrent = getCurrentLevel() === threshold.level;
              return (
                <div
                  key={threshold.level}
                  className={`p-4 rounded-lg border transition-all ${
                    isCurrent
                      ? 'bg-cyan-500/20 border-cyan-500/40'
                      : isUnlocked
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Award className={`w-4 h-4 ${isUnlocked ? 'text-green-400' : 'text-slate-500'}`} />
                        <span className={`font-bold ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                          Level {threshold.level}
                        </span>
                        {isCurrent && (
                          <span className="text-xs px-2 py-1 bg-cyan-500/30 text-cyan-300 rounded">Current</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        {formatNumber(parseFloat(String(threshold.points_required)))} points required
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${isUnlocked ? 'text-green-400' : 'text-slate-500'}`}>
                        {parseFloat(String(threshold.payout_percentage)).toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-400">share</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <GiftIcon className="w-5 h-5 text-pink-400" />
            Recent Payouts
          </h3>
          {userPayouts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No payouts yet</p>
              <p className="text-sm text-slate-500 mt-2">Keep earning points to unlock your first payout!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userPayouts.map((payout) => (
                <div key={payout.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      payout.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : payout.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {payout.status}
                    </span>
                    <span className="text-slate-400 text-xs">
                      {new Date(payout.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Level {payout.threshold_level} Payout</span>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">${payout.amount_usd.toFixed(2)}</p>
                      <p className="text-xs text-slate-400">{payout.amount_qubic.toFixed(3)} QUBIC</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
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
    </div>
  );
}
