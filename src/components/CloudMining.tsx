import { Server, TrendingUp, DollarSign, Users, Activity } from 'lucide-react';
import InfoBox from './InfoBox';

interface CloudMiningProps {
  userId: string;
}

export default function CloudMining({ userId: _userId }: CloudMiningProps) {
  const stats = {
    totalServers: 12,
    activeMiners: 847,
    monthlyRevenue: 15420,
    yourShare: 0,
    poolHashrate: '12.5 TH/s'
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl border-2 border-black mb-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-2 flex items-center justify-center gap-3">
            <Server className="w-10 h-10 text-qubic-cyan" />
            Hetzner Cloud Mining
          </h1>
          <p className="text-gray-600 font-medium text-lg">Shared profit mining pool</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-black rounded-xl p-6 border-2 border-qubic-cyan">
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-5 h-5 text-qubic-cyan" />
              <span className="text-gray-400 text-sm font-bold">ACTIVE SERVERS</span>
            </div>
            <p className="text-4xl font-bold text-qubic-cyan">{stats.totalServers}</p>
            <p className="text-gray-400 text-xs mt-1">Hetzner Cloud Instances</p>
          </div>

          <div className="bg-black rounded-xl p-6 border-2 border-qubic-cyan">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-qubic-cyan" />
              <span className="text-gray-400 text-sm font-bold">POOL MINERS</span>
            </div>
            <p className="text-4xl font-bold text-qubic-cyan">{stats.activeMiners}</p>
            <p className="text-gray-400 text-xs mt-1">Contributing Users</p>
          </div>

          <div className="bg-black rounded-xl p-6 border-2 border-qubic-cyan">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-qubic-cyan" />
              <span className="text-gray-400 text-sm font-bold">POOL HASHRATE</span>
            </div>
            <p className="text-4xl font-bold text-qubic-cyan">{stats.poolHashrate}</p>
            <p className="text-gray-400 text-xs mt-1">Combined Power</p>
          </div>
        </div>

        <div className="bg-qubic-cyan/10 rounded-xl p-6 border-2 border-qubic-cyan mb-6">
          <h2 className="text-2xl font-bold text-black mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-qubic-cyan" />
            Revenue Distribution
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border-2 border-black">
              <p className="text-gray-600 text-sm font-bold mb-1">MONTHLY POOL REVENUE</p>
              <p className="text-3xl font-bold text-black flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-qubic-cyan" />
                {stats.monthlyRevenue.toLocaleString()} QUBIC
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border-2 border-black">
              <p className="text-gray-600 text-sm font-bold mb-1">YOUR SHARE (0%)</p>
              <p className="text-3xl font-bold text-black flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-gray-400" />
                {stats.yourShare} QUBIC
              </p>
            </div>
          </div>
        </div>

        <div className="bg-black rounded-xl p-6 border-2 border-qubic-cyan mb-6">
          <h3 className="text-xl font-bold text-white mb-4">How Community Mining Works</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-qubic-cyan rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-black font-bold">1</span>
              </div>
              <div>
                <p className="text-white font-bold">Earn Tap Points</p>
                <p className="text-gray-400 text-sm">Mine points through tap mining and gift card boosts</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-qubic-cyan rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-black font-bold">2</span>
              </div>
              <div>
                <p className="text-white font-bold">Pool Mining Runs 24/7</p>
                <p className="text-gray-400 text-sm">Hetzner servers mine Qubic continuously on shared infrastructure</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-qubic-cyan rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-black font-bold">3</span>
              </div>
              <div>
                <p className="text-white font-bold">Profit Distribution</p>
                <p className="text-gray-400 text-sm">Mining profits shared based on your point contribution percentage</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-qubic-cyan hover:bg-qubic-cyan/80 text-black font-bold py-4 px-6 rounded-xl transition-all border-2 border-black shadow-lg">
            Start Tap Mining
          </button>
          <button className="bg-black hover:bg-gray-900 text-qubic-cyan font-bold py-4 px-6 rounded-xl transition-all border-2 border-qubic-cyan">
            View Pool Stats
          </button>
        </div>
      </div>

      <div className="bg-qubic-cyan/5 rounded-xl p-6 border-2 border-qubic-cyan text-center mb-6">
        <p className="text-black font-medium leading-relaxed">
          <span className="font-bold text-qubic-cyan">POWERED BY HETZNER:</span> Enterprise-grade cloud servers
          mining Qubic 24/7. Earn your share by contributing tap points to the community pool!
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
