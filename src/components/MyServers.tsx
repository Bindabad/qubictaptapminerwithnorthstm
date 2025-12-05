import { useState, useEffect } from 'react';
import { Server, Pause, Play, TrendingUp, Zap, DollarSign } from 'lucide-react';
import { serverService } from '../services/serverService';
import InfoBox from './InfoBox';

interface MyServersProps {
  userId: string;
}

interface UserServer {
  id: string;
  server_name: string;
  hash_power_contribution: number;
  monthly_cost_eur: number;
  status: string;
  activation_date: string;
  total_earned_usd: number;
  server_catalog: {
    cpu_model: string;
    cpu_cores: number;
    estimated_daily_profit_usd: number;
  };
}

interface Earnings {
  dailyEarnings: number;
  monthlyEarnings: number;
  totalCosts: number;
  netProfit: number;
}

export default function MyServers({ userId }: MyServersProps) {
  const [servers, setServers] = useState<UserServer[]>([]);
  const [earnings, setEarnings] = useState<Earnings>({
    dailyEarnings: 0,
    monthlyEarnings: 0,
    totalCosts: 0,
    netProfit: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServers();
    const interval = setInterval(loadServers, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadServers = async () => {
    try {
      const [userServers, userEarnings] = await Promise.all([
        serverService.getUserServers(userId),
        serverService.calculateUserEarnings(userId)
      ]);
      setServers(userServers);
      setEarnings(userEarnings);
    } catch (error) {
      console.error('Error loading servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (serverId: string) => {
    try {
      await serverService.pauseServer(serverId, userId);
      await loadServers();
    } catch (error) {
      console.error('Error pausing server:', error);
    }
  };

  const handleResume = async (serverId: string) => {
    try {
      await serverService.resumeServer(serverId, userId);
      await loadServers();
    } catch (error) {
      console.error('Error resuming server:', error);
    }
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
        <h2 className="text-3xl font-bold text-white mb-2">My Virtual Servers</h2>
        <p className="text-slate-400">Manage your cloud mining fleet</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-slate-300 text-sm">Daily Earnings</span>
          </div>
          <p className="text-3xl font-bold text-green-400">${earnings.dailyEarnings.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span className="text-slate-300 text-sm">Monthly Profit</span>
          </div>
          <p className="text-3xl font-bold text-blue-400">${earnings.netProfit.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-5 h-5 text-purple-400" />
            <span className="text-slate-300 text-sm">Active Servers</span>
          </div>
          <p className="text-3xl font-bold text-purple-400">
            {servers.filter(s => s.status === 'active').length}
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-slate-300 text-sm">Total Hash Power</span>
          </div>
          <p className="text-3xl font-bold text-yellow-400">
            {(servers.reduce((sum, s) => sum + parseFloat(String(s.hash_power_contribution)), 0) / 1000).toFixed(0)}k
          </p>
        </div>
      </div>

      {servers.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-12 text-center border border-slate-700">
          <Server className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Servers Yet</h3>
          <p className="text-slate-400">Purchase your first virtual server to start mining</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {servers.map((server) => (
            <div
              key={server.id}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{server.server_name}</h3>
                  <p className="text-sm text-slate-400">{server.server_catalog.cpu_model}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  server.status === 'active'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {server.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Hash Power</p>
                  <p className="text-lg font-bold text-cyan-400">
                    {(parseFloat(String(server.hash_power_contribution)) / 1000).toFixed(0)}k H/s
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Monthly Cost</p>
                  <p className="text-lg font-bold text-orange-400">€{server.monthly_cost_eur.toFixed(2)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Daily Profit</p>
                  <p className="text-lg font-bold text-green-400">
                    ${server.server_catalog.estimated_daily_profit_usd.toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Total Earned</p>
                  <p className="text-lg font-bold text-blue-400">${server.total_earned_usd.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex gap-3">
                {server.status === 'active' ? (
                  <button
                    onClick={() => handlePause(server.id)}
                    className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 font-bold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={() => handleResume(server.id)}
                    className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 font-bold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Resume
                  </button>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-400">
                Active since {new Date(server.activation_date).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

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
