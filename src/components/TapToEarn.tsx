import { useState, useEffect } from 'react';
import { Coins, Zap, TrendingUp, Cpu, Activity, Timer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import InfoBox from './InfoBox';

interface TapToEarnProps {
  userId: string;
  currentPoints: number;
  onPointsUpdate: () => void;
  onNavigateToStaking?: () => void;
  onNavigateToDeFi?: () => void;
}

interface PowerBoost {
  multiplier: number;
  endTime: Date;
  source: string;
}

export default function TapToEarn({ userId, currentPoints, onPointsUpdate, onNavigateToStaking, onNavigateToDeFi }: TapToEarnProps) {
  const [points, setPoints] = useState(currentPoints);
  const [tapAnimation, setTapAnimation] = useState<{ x: number; y: number; id: number } | null>(null);
  const [powerBoosts, setPowerBoosts] = useState<PowerBoost[]>([]);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [energy, setEnergy] = useState(100);
  const [hashRate, setHashRate] = useState(0);
  const [totalTaps, setTotalTaps] = useState(0);

  useEffect(() => {
    setPoints(currentPoints);
  }, [currentPoints]);

  useEffect(() => {
    loadPowerBoosts();
    const interval = setInterval(loadPowerBoosts, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    const energyInterval = setInterval(() => {
      setEnergy((prev) => {
        if (prev < 100) return Math.min(100, prev + 1);
        return prev;
      });
    }, 1000);

    return () => clearInterval(energyInterval);
  }, []);

  useEffect(() => {
    const hashInterval = setInterval(() => {
      setHashRate(Math.floor(Math.random() * 500) + 200);
    }, 2000);
    return () => clearInterval(hashInterval);
  }, []);

  const loadPowerBoosts = async () => {
    try {
      const { data, error } = await supabase
        .from('gift_cards_v2')
        .select('hash_power_boost, redeemed_at')
        .eq('redeemed_by', userId)
        .gte('redeemed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const boosts: PowerBoost[] = (data || []).map(card => ({
        multiplier: parseFloat(card.hash_power_boost) / 100,
        endTime: new Date(new Date(card.redeemed_at).getTime() + 24 * 60 * 60 * 1000),
        source: 'Gift Card Boost'
      }));

      setPowerBoosts(boosts);
      const totalMultiplier = 1 + boosts.reduce((sum, boost) => sum + boost.multiplier, 0);
      setCurrentMultiplier(totalMultiplier);
    } catch (error) {
      console.error('Error loading power boosts:', error);
    }
  };

  const handleTap = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (energy < 1) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const earnedPoints = 1000;

    setPoints(prev => prev + earnedPoints);
    setTotalTaps(prev => prev + 1);
    setEnergy(prev => Math.max(0, prev - 1));

    setTapAnimation({ x, y, id: Date.now() });
    setTimeout(() => setTapAnimation(null), 1000);

    await saveTapProgress();
  };

  const saveTapProgress = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          points_balance: points,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      onPointsUpdate();
    } catch (error) {
      console.error('Error saving tap progress:', error);
    }
  };

  const formatPoints = (pts: number) => {
    if (pts >= 1000000) return `${(pts / 1000000).toFixed(2)}M`;
    if (pts >= 1000) return `${(pts / 1000).toFixed(2)}K`;
    return pts.toFixed(0);
  };


  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl border-2 border-black mb-6">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-2 flex items-center justify-center gap-3">
            <Cpu className="w-10 h-10 text-qubic-cyan" />
            QUBIC TAP TAP MINER
          </h1>
          <p className="text-gray-600 font-medium text-lg">
            First QUBIC Blockchain Mining Game - Mine 1000 QUBIC per tap!
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-black rounded-xl p-4 border-2 border-qubic-cyan">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-qubic-cyan" />
              <span className="text-gray-400 text-xs font-bold">POINTS</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-qubic-cyan">{formatPoints(points)}</p>
          </div>

          <div className="bg-black rounded-xl p-4 border-2 border-qubic-cyan">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-qubic-cyan" />
              <span className="text-gray-400 text-xs font-bold">HASH/S</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-qubic-cyan">{hashRate}</p>
          </div>

          <div className="bg-black rounded-xl p-4 border-2 border-qubic-cyan">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-qubic-cyan" />
              <span className="text-gray-400 text-xs font-bold">BOOST</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-qubic-cyan">{currentMultiplier.toFixed(1)}x</p>
          </div>

          <div className="bg-black rounded-xl p-4 border-2 border-qubic-cyan">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-qubic-cyan" />
              <span className="text-gray-400 text-xs font-bold">ENERGY</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-qubic-cyan">{energy}%</p>
          </div>
        </div>

        {points >= 5000 && (
          <div className="mb-6 bg-gradient-to-r from-qubic-cyan to-blue-500 rounded-xl p-6 border-2 border-black">
            <h3 className="text-xl font-bold text-black mb-3 text-center">Congratulations! 🎉</h3>
            <p className="text-center text-black font-bold mb-4">You've mined {points.toFixed(0)} QUBIC!</p>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={onNavigateToStaking} className="bg-black hover:bg-gray-900 text-qubic-cyan font-bold py-3 px-4 rounded-xl transition-all border-2 border-qubic-cyan text-sm">
                💰 Stake
              </button>
              <button onClick={onNavigateToDeFi} className="bg-black hover:bg-gray-900 text-qubic-cyan font-bold py-3 px-4 rounded-xl transition-all border-2 border-qubic-cyan text-sm">
                🔄 Swap
              </button>
              <button onClick={onNavigateToDeFi} className="bg-black hover:bg-gray-900 text-qubic-cyan font-bold py-3 px-4 rounded-xl transition-all border-2 border-qubic-cyan text-sm">
                📤 Withdraw
              </button>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-black font-bold text-sm">Energy Level</span>
            <span className="text-qubic-cyan font-bold text-sm">{energy}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden border-2 border-black">
            <div
              className="h-full bg-qubic-cyan transition-all duration-300"
              style={{ width: `${energy}%` }}
            />
          </div>
        </div>

        <div
          className="relative mb-6 aspect-square max-w-xs mx-auto bg-black rounded-full border-4 border-qubic-cyan flex items-center justify-center cursor-pointer select-none overflow-hidden shadow-2xl"
          onClick={handleTap}
          style={{
            transform: tapAnimation ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.1s',
            boxShadow: energy > 0 ? '0 0 60px rgba(27, 222, 245, 0.5)' : '0 0 20px rgba(27, 222, 245, 0.2)'
          }}
        >
          <div className="w-32 h-32 md:w-40 md:h-40 bg-qubic-cyan rounded-full flex items-center justify-center shadow-2xl animate-pulse">
            <Cpu className="w-16 h-16 md:w-20 md:h-20 text-black" />
          </div>

          {tapAnimation && (
            <div
              className="absolute pointer-events-none text-3xl font-bold text-qubic-cyan animate-float"
              style={{
                left: tapAnimation.x,
                top: tapAnimation.y,
              }}
            >
              +1000
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-qubic-cyan/10 border-2 border-qubic-cyan rounded-xl p-4 text-center">
            <p className="text-gray-600 text-xs font-bold mb-1">TOTAL TAPS</p>
            <p className="text-2xl font-bold text-black">{totalTaps}</p>
          </div>
          <div className="bg-qubic-cyan/10 border-2 border-qubic-cyan rounded-xl p-4 text-center">
            <p className="text-gray-600 text-xs font-bold mb-1">EFFICIENCY</p>
            <p className="text-2xl font-bold text-black">{((points / Math.max(totalTaps, 1)) * currentMultiplier).toFixed(1)}</p>
          </div>
        </div>

        {powerBoosts.length > 0 && (
          <div className="bg-qubic-cyan/5 border-2 border-qubic-cyan rounded-xl p-4 mb-4">
            <h3 className="text-black font-bold mb-3 flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-qubic-cyan" />
              Active Boosts
            </h3>
            <div className="space-y-2">
              {powerBoosts.map((boost, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border-2 border-black">
                  <span className="text-black font-bold text-sm">{boost.source}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-qubic-cyan font-bold">+{(boost.multiplier * 100).toFixed(0)}%</span>
                    <span className="text-gray-500 text-xs font-medium flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      {Math.floor((boost.endTime.getTime() - Date.now()) / (1000 * 60 * 60))}h
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-black rounded-xl p-6 border-2 border-qubic-cyan text-center mb-6">
        <p className="text-white font-medium leading-relaxed">
          <span className="font-bold text-qubic-cyan">TAP TO MINE 1000 QUBIC:</span> Stake, swap or withdraw on demand.
          Swap to any token via DeFi using MetaMask. P2P trade and send to community members via Northstm Launchpad!
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

      <style>{`
        @keyframes float {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-60px);
          }
        }
        .animate-float {
          animation: float 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
