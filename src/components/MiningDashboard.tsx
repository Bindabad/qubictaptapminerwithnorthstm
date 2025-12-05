import { useState, useEffect } from 'react';
import { Pickaxe, Zap, TrendingUp, Clock, Cpu, Activity } from 'lucide-react';
import { qubicMiningService, MiningResult, PoolStats } from '../services/qubicMining';
import { walletService } from '../services/walletService';
import InfoBox from './InfoBox';

interface MiningDashboardProps {
  userId: string;
  onBalanceUpdate: () => void;
}

export default function MiningDashboard({ userId, onBalanceUpdate }: MiningDashboardProps) {
  const [isMining, setIsMining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hashRate, setHashRate] = useState(0);
  const [poolStats, setPoolStats] = useState<PoolStats>({
    hashRate: 0,
    solutionsSubmitted: 0,
    epoch: 0,
    difficulty: 0,
    status: 'disconnected'
  });
  const [stats, setStats] = useState({
    totalSessions: 0,
    avgHashRate: 0
  });

  useEffect(() => {
    loadStats();
    const interval = setInterval(() => {
      if (isMining) {
        setPoolStats(qubicMiningService.getPoolStats());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [userId, isMining]);

  const loadStats = async () => {
    try {
      const miningStats = await walletService.getMiningStats(userId);
      setStats({
        totalSessions: miningStats.totalSessions,
        avgHashRate: miningStats.avgHashRate
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const startMining = async () => {
    try {
      setIsMining(true);
      setProgress(0);

      await qubicMiningService.startMining(
        (currentProgress, currentHashRate) => {
          setProgress(currentProgress);
          setHashRate(currentHashRate);
        },
        async (result: MiningResult) => {
          await walletService.addMinedBalance(userId, result);
          setIsMining(false);
          setProgress(0);
          setHashRate(0);
          onBalanceUpdate();
          await loadStats();
        }
      );
    } catch (error) {
      console.error('Mining error:', error);
      setIsMining(false);
    }
  };

  const stopMining = () => {
    qubicMiningService.stopMining();
    setIsMining(false);
    setProgress(0);
    setHashRate(0);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Pickaxe className="w-8 h-8 text-cyan-400" />
          Qubic Mining
        </h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-400 font-medium">AI-Powered PoW</span>
        </div>
      </div>

      <div className="mb-6 p-5 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl border border-violet-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Training Aigarth AI</h3>
            <p className="text-sm text-violet-300">Contributing to Open Source True AI</p>
          </div>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Your computational power generates billions of Artificial Neural Networks (ANNs) to train Aigarth,
          Qubic's decentralized AI. Connected to <span className="text-violet-400 font-semibold">qubic.li pool</span> for
          optimal performance and rewards.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-400 text-xs">Hash Rate</span>
          </div>
          <p className="text-xl font-bold text-white">
            {isMining ? hashRate.toLocaleString() : stats.avgHashRate.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">H/s</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-violet-400" />
            <span className="text-slate-400 text-xs">Epoch</span>
          </div>
          <p className="text-xl font-bold text-white">
            {isMining && poolStats.epoch > 0 ? poolStats.epoch : '-'}
          </p>
          <p className="text-xs text-slate-500">Current</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-slate-400 text-xs">Solutions</span>
          </div>
          <p className="text-xl font-bold text-white">
            {isMining ? poolStats.solutionsSubmitted : stats.totalSessions}
          </p>
          <p className="text-xs text-slate-500">{isMining ? 'Submitted' : 'Total'}</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-slate-400 text-xs">Status</span>
          </div>
          <p className="text-xl font-bold text-white capitalize">
            {isMining ? poolStats.status : 'Idle'}
          </p>
          <p className="text-xs text-slate-500">Pool</p>
        </div>
      </div>

      {isMining && (
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-slate-300 font-medium">AI Training Progress</span>
            <span className="text-violet-400 font-bold">{Math.floor(progress)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 transition-all duration-300 relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Generating ANNs • Difficulty: {poolStats.difficulty || 'N/A'}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {!isMining ? (
          <button
            onClick={startMining}
            className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
          >
            <Cpu className="w-5 h-5" />
            Start AI Training
          </button>
        ) : (
          <button
            onClick={stopMining}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-red-500/20"
          >
            Stop Training
          </button>
        )}
      </div>

      <div className="mt-6 p-4 bg-violet-500/5 rounded-lg border border-violet-500/20">
        <p className="text-sm text-violet-300 leading-relaxed">
          <span className="font-semibold">Useful Proof of Work:</span> Generate billions of Artificial Neural Networks
          to train Aigarth, Qubic's open-source true AI. Your computational power creates valuable AI training data
          while earning QUBIC rewards through the qubic.li pool.
        </p>
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
