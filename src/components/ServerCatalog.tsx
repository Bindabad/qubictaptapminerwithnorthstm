import { useState, useEffect } from 'react';
import { Server, TrendingUp, DollarSign, Zap, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import InfoBox from './InfoBox';

interface ServerSpec {
  id: string;
  server_name: string;
  server_type: string;
  cpu_model: string;
  cpu_cores: number;
  ram_gb: number;
  storage_info: string;
  monthly_cost_eur: number;
  estimated_hashrate: number;
  estimated_daily_profit_usd: number;
  estimated_monthly_profit_usd: number;
  roi_months: number;
  is_available: boolean;
  description: string;
}

interface ServerCatalogProps {
  userId: string;
  onPurchase: (serverId: string) => void;
}

export default function ServerCatalog({ userId: _userId, onPurchase }: ServerCatalogProps) {
  const [servers, setServers] = useState<ServerSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<ServerSpec | null>(null);

  useEffect(() => {
    loadServerCatalog();
  }, []);

  const loadServerCatalog = async () => {
    try {
      const { data, error } = await supabase
        .from('hetzner_server_catalog')
        .select('*')
        .eq('is_available', true)
        .order('display_order');

      if (error) throw error;
      setServers(data || []);
    } catch (error) {
      console.error('Error loading server catalog:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoiColor = (months: number) => {
    if (months < 0.5) return 'text-green-400';
    if (months < 1) return 'text-emerald-400';
    return 'text-yellow-400';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Hetzner Cloud Miners</h2>
        <p className="text-slate-400">Choose your virtual mining server and start earning profits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servers.map((server) => (
          <div
            key={server.id}
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700 hover:border-orange-500/50 transition-all duration-200 cursor-pointer"
            onClick={() => setSelectedServer(server)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{server.server_name}</h3>
                <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded">
                  {server.server_type}
                </span>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-white" />
              </div>
            </div>

            <p className="text-sm text-slate-400 mb-4 min-h-[40px]">{server.description}</p>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">CPU:</span>
                <span className="text-white font-medium">{server.cpu_model}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Cores:</span>
                <span className="text-white font-medium">{server.cpu_cores} cores</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">RAM:</span>
                <span className="text-white font-medium">{server.ram_gb} GB</span>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  Hash Power
                </span>
                <span className="text-cyan-400 font-bold">{(server.estimated_hashrate / 1000).toFixed(0)}k H/s</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  Monthly Profit
                </span>
                <span className="text-green-400 font-bold">${server.estimated_monthly_profit_usd.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  ROI Period
                </span>
                <span className={`font-bold ${getRoiColor(server.roi_months)}`}>
                  {server.roi_months.toFixed(1)} months
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-xs">Monthly Cost</span>
                <p className="text-white font-bold text-lg">€{server.monthly_cost_eur.toFixed(2)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPurchase(server.id);
                }}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Select
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedServer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setSelectedServer(null)}>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-slate-700" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-white mb-4">{selectedServer.server_name} Details</h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">CPU Model</p>
                <p className="text-white font-semibold">{selectedServer.cpu_model}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">CPU Cores</p>
                <p className="text-white font-semibold">{selectedServer.cpu_cores} cores</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">RAM</p>
                <p className="text-white font-semibold">{selectedServer.ram_gb} GB</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Storage</p>
                <p className="text-white font-semibold">{selectedServer.storage_info}</p>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 mb-6">
              <h4 className="text-lg font-bold text-white mb-4">Profit Estimation</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-300">Daily Profit:</span>
                  <span className="text-green-400 font-bold">${selectedServer.estimated_daily_profit_usd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Monthly Profit:</span>
                  <span className="text-green-400 font-bold">${selectedServer.estimated_monthly_profit_usd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Monthly Cost:</span>
                  <span className="text-red-400 font-bold">€{selectedServer.monthly_cost_eur.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-green-500/20">
                  <span className="text-slate-300">Net Monthly:</span>
                  <span className="text-green-400 font-bold text-lg">
                    ${(selectedServer.estimated_monthly_profit_usd - selectedServer.monthly_cost_eur * 1.1).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setSelectedServer(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all duration-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onPurchase(selectedServer.id);
                  setSelectedServer(null);
                }}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Purchase Server
              </button>
            </div>
          </div>
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
