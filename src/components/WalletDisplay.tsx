import { Wallet, TrendingUp, History, LogOut, Copy, Check, Gift } from 'lucide-react';
import { Transaction } from '../lib/supabase';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface WalletDisplayProps {
  username: string;
  walletAddress: string;
  balance: number;
  totalMined: number;
  transactions: Transaction[];
  onSignOut: () => void;
  userId: string;
  onBalanceUpdate: () => void;
}

export default function WalletDisplay({ username, walletAddress, balance, totalMined, transactions, onSignOut, userId, onBalanceUpdate }: WalletDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const copyWalletAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const claimDemoBalance = async () => {
    setClaiming(true);
    try {
      const demoAmount = 5000;

      await supabase.rpc('update_user_balance', {
        p_user_id: userId,
        p_qubic_delta: demoAmount
      });

      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'bonus',
        amount: demoAmount,
        description: `Demo Balance Top-up for Hackathon Testing`,
        balance_after: balance + demoAmount
      });

      alert(`Successfully added ${demoAmount} QUBIC for testing!`);
      onBalanceUpdate();
    } catch (error) {
      console.error('Error claiming demo balance:', error);
      alert('Failed to claim demo balance. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'mine': return 'text-green-400';
      case 'send_gift': return 'text-red-400';
      case 'receive_gift': return 'text-blue-400';
      default: return 'text-slate-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mine': return '+';
      case 'send_gift': return '-';
      case 'receive_gift': return '+';
      default: return '';
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
      <div className="flex items-center justify-between mb-8">
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <Wallet className="w-8 h-8 text-cyan-400" />
            Qubic Wallet
          </h2>
          <p className="text-slate-400 mb-3">Welcome back, <span className="text-cyan-400 font-semibold">{username}</span></p>
          <div className="flex items-center gap-2">
            <div className="bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700">
              <p className="text-xs text-slate-500 mb-1">Wallet Address</p>
              <p className="text-sm text-slate-300 font-mono">{shortenAddress(walletAddress)}</p>
            </div>
            <button
              onClick={copyWalletAddress}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
              title="Copy wallet address"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={claimDemoBalance}
            disabled={claiming}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all border border-green-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Get 5000 QUBIC for testing"
          >
            <Gift className="w-4 h-4" />
            Demo Balance
          </button>
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-6 border border-cyan-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-6 h-6 text-cyan-400" />
            <span className="text-slate-400 text-sm font-medium">Current Balance</span>
          </div>
          <p className="text-4xl font-bold text-white mb-1">{balance.toFixed(3)}</p>
          <p className="text-cyan-400 text-sm font-medium">QUBIC</p>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-green-500/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <span className="text-slate-400 text-sm font-medium">Total Mined</span>
          </div>
          <p className="text-4xl font-bold text-white mb-1">{totalMined.toFixed(3)}</p>
          <p className="text-green-400 text-sm font-medium">QUBIC</p>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-slate-400" />
          Recent Transactions
        </h3>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No transactions yet. Start mining to earn QUBIC!
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-white font-medium mb-1">{tx.description}</p>
                    <p className="text-slate-500 text-xs">{formatDate(tx.created_at)}</p>
                  </div>
                  <span className={`text-lg font-bold ${getTypeColor(tx.type)}`}>
                    {getTypeIcon(tx.type)}{Math.abs(tx.amount).toFixed(3)} QUBIC
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
