import { useState, useEffect } from 'react';
import { Rocket, TrendingUp, Lock, Zap, Trophy, Star, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import InfoBox from './InfoBox';

interface LaunchpadStakingProps {
  userId: string;
  qubicBalance: number;
  onBalanceUpdate: () => void;
}

interface StakingPool {
  id: string;
  name: string;
  apy: number;
  minStake: number;
  lockPeriod: number;
  totalStaked: number;
  allocation: string;
}

interface UserStake {
  id: string;
  poolId: string;
  amount: number;
  startDate: Date;
  endDate: Date;
  rewards: number;
}

export default function LaunchpadStaking({ userId, qubicBalance, onBalanceUpdate }: LaunchpadStakingProps) {
  const [pools] = useState<StakingPool[]>([
    {
      id: 'bronze',
      name: 'Bronze Tier',
      apy: 15,
      minStake: 100,
      lockPeriod: 7,
      totalStaked: 50000,
      allocation: 'Standard'
    },
    {
      id: 'silver',
      name: 'Silver Tier',
      apy: 25,
      minStake: 500,
      lockPeriod: 14,
      totalStaked: 125000,
      allocation: 'Priority'
    },
    {
      id: 'gold',
      name: 'Gold Tier',
      apy: 40,
      minStake: 1000,
      lockPeriod: 30,
      totalStaked: 300000,
      allocation: 'Premium'
    },
    {
      id: 'diamond',
      name: 'Diamond Tier',
      apy: 60,
      minStake: 5000,
      lockPeriod: 60,
      totalStaked: 750000,
      allocation: 'Elite'
    }
  ]);

  const [userStakes, setUserStakes] = useState<UserStake[]>([]);
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalStaked, setTotalStaked] = useState(0);
  const [totalRewards, setTotalRewards] = useState(0);

  useEffect(() => {
    loadUserStakes();
  }, [userId]);

  const loadUserStakes = async () => {
    try {
      const { data, error } = await supabase
        .from('staking_positions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      if (data) {
        const stakes = data.map(s => ({
          id: s.id,
          poolId: s.pool_id,
          amount: s.amount,
          startDate: new Date(s.start_date),
          endDate: new Date(s.end_date),
          rewards: s.rewards || 0
        }));
        setUserStakes(stakes);

        const total = stakes.reduce((sum, s) => sum + s.amount, 0);
        const rewards = stakes.reduce((sum, s) => sum + s.rewards, 0);
        setTotalStaked(total);
        setTotalRewards(rewards);
      }
    } catch (error) {
      console.error('Error loading stakes:', error);
    }
  };

  const handleStake = async () => {
    if (!selectedPool || !stakeAmount) return;

    const amount = parseFloat(stakeAmount);
    if (amount < selectedPool.minStake) {
      alert(`Minimum stake is ${selectedPool.minStake} QUBIC`);
      return;
    }

    if (amount > qubicBalance) {
      alert('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + selectedPool.lockPeriod);

      const { error } = await supabase
        .from('staking_positions')
        .insert({
          user_id: userId,
          pool_id: selectedPool.id,
          amount,
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          apy: selectedPool.apy,
          rewards: 0
        });

      if (error) throw error;

      await supabase.rpc('update_user_balance', {
        p_user_id: userId,
        p_qubic_delta: -amount
      });

      alert(`Successfully staked ${amount} QUBIC in ${selectedPool.name}!`);
      setStakeAmount('');
      setSelectedPool(null);
      await loadUserStakes();
      onBalanceUpdate();
    } catch (error) {
      console.error('Staking error:', error);
      alert('Failed to stake. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (poolId: string) => {
    switch (poolId) {
      case 'bronze': return <Lock className="w-6 h-6 text-orange-600" />;
      case 'silver': return <Star className="w-6 h-6 text-gray-400" />;
      case 'gold': return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 'diamond': return <Zap className="w-6 h-6 text-blue-400" />;
      default: return <Lock className="w-6 h-6" />;
    }
  };

  const getTierGradient = (poolId: string) => {
    switch (poolId) {
      case 'bronze': return 'from-orange-500/20 to-orange-700/20 border-orange-500/30';
      case 'silver': return 'from-gray-400/20 to-gray-600/20 border-gray-400/30';
      case 'gold': return 'from-yellow-500/20 to-yellow-700/20 border-yellow-500/30';
      case 'diamond': return 'from-blue-500/20 to-purple-600/20 border-blue-500/30';
      default: return 'from-gray-500/20 to-gray-700/20 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Rocket className="w-8 h-8 text-blue-400" />
            Northstm Launchpad
          </h2>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-blue-400 font-medium">Stake & Earn</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400 text-xs">Total Staked</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalStaked.toFixed(2)}</p>
            <p className="text-xs text-slate-500">QUBIC</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-slate-400 text-xs">Total Rewards</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalRewards.toFixed(2)}</p>
            <p className="text-xs text-slate-500">QUBIC Earned</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-slate-400 text-xs">Available</span>
            </div>
            <p className="text-2xl font-bold text-white">{qubicBalance.toFixed(2)}</p>
            <p className="text-xs text-slate-500">QUBIC</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-4">Staking Tiers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pools.map((pool) => (
              <div
                key={pool.id}
                className={`bg-gradient-to-br ${getTierGradient(pool.id)} rounded-xl p-6 border cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedPool?.id === pool.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedPool(pool)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getTierIcon(pool.id)}
                    <div>
                      <h4 className="text-lg font-bold text-white">{pool.name}</h4>
                      <p className="text-sm text-slate-900 font-medium">{pool.allocation} Allocation</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">{pool.apy}%</p>
                    <p className="text-xs text-slate-900 font-medium">APY</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-900 font-medium">Min Stake</span>
                    <span className="text-white font-semibold">{pool.minStake} QUBIC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-900 font-medium">Lock Period</span>
                    <span className="text-white font-semibold">{pool.lockPeriod} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-900 font-medium">Total Staked</span>
                    <span className="text-white font-semibold">{pool.totalStaked.toLocaleString()} QUBIC</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedPool && (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h4 className="text-lg font-bold text-white mb-4">Stake in {selectedPool.name}</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Amount (Min: {selectedPool.minStake} QUBIC)
                </label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-slate-900 text-white px-4 py-3 rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleStake}
                  disabled={loading || !stakeAmount}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Staking...' : 'Stake Now'}
                </button>
                <button
                  onClick={() => {
                    setSelectedPool(null);
                    setStakeAmount('');
                  }}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {userStakes.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-white mb-4">Your Stakes</h3>
            <div className="space-y-3">
              {userStakes.map((stake) => {
                const pool = pools.find(p => p.id === stake.poolId);
                const daysLeft = Math.ceil((stake.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                return (
                  <div key={stake.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {pool && getTierIcon(pool.id)}
                        <div>
                          <p className="font-semibold text-white">{pool?.name}</p>
                          <p className="text-sm text-slate-400">{stake.amount} QUBIC staked</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-400">+{stake.rewards.toFixed(2)} QUBIC</p>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {daysLeft > 0 ? `${daysLeft} days left` : 'Unlocked'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-black">
        <h3 className="text-lg font-bold text-black mb-3 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-qubic-cyan" />
          How Launchpad Staking Works
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-qubic-cyan mt-1 font-bold">•</span>
            <span>Stake QUBIC to earn allocation rights for upcoming token launches</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-qubic-cyan mt-1 font-bold">•</span>
            <span>Higher tiers unlock priority access and larger allocations</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-qubic-cyan mt-1 font-bold">•</span>
            <span>Earn APY rewards while maintaining your launchpad tier</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-qubic-cyan mt-1 font-bold">•</span>
            <span>Unstake anytime after lock period ends with accumulated rewards</span>
          </li>
        </ul>
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
