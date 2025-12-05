import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Droplet, Repeat, PieChart, ArrowDownUp, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import InfoBox from './InfoBox';

interface DeFiPlatformProps {
  userId: string;
  qubicBalance: number;
  onBalanceUpdate: () => void;
  onNavigateToStaking?: () => void;
}

type DeFiView = 'swap' | 'liquidity' | 'yield' | 'lending' | 'withdraw';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function DeFiPlatform({ userId, qubicBalance, onBalanceUpdate, onNavigateToStaking }: DeFiPlatformProps) {
  const [activeView, setActiveView] = useState<DeFiView>('swap');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromToken, setFromToken] = useState('QUBIC');
  const [toToken, setToToken] = useState('USDT');
  const [loading, setLoading] = useState(false);
  const [metaMaskAddress, setMetaMaskAddress] = useState<string | null>(null);
  const [metaMaskBalance, setMetaMaskBalance] = useState<string>('0');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setMetaMaskAddress(null);
      setMetaMaskBalance('0');
    } else {
      setMetaMaskAddress(accounts[0]);
      getMetaMaskBalance(accounts[0]);
    }
  };

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed. Please install MetaMask to continue.');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setMetaMaskAddress(accounts[0]);
      await getMetaMaskBalance(accounts[0]);
    } catch (error) {
      console.error('MetaMask connection error:', error);
      alert('Failed to connect MetaMask');
    }
  };

  const getMetaMaskBalance = async (address: string) => {
    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      const ethBalance = parseInt(balance, 16) / 10**18;
      setMetaMaskBalance(ethBalance.toFixed(6));
    } catch (error) {
      console.error('Error getting balance:', error);
    }
  };

  const disconnectMetaMask = () => {
    setMetaMaskAddress(null);
    setMetaMaskBalance('0');
  };

  const exchangeRates: { [key: string]: number } = {
    'QUBIC': 1,
    'USDT': 0.15,
    'ETH': 0.00004,
    'BTC': 0.0000015,
    'NSTM': 2.5
  };

  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(fromAmount);

    if (fromToken === 'ETH' && metaMaskAddress) {
      if (amount > parseFloat(metaMaskBalance)) {
        alert('Insufficient ETH balance in MetaMask');
        return;
      }
      await handleMetaMaskSwap(amount);
      return;
    }

    if (fromToken === 'QUBIC' && amount > qubicBalance) {
      alert('Insufficient QUBIC balance');
      return;
    }

    setLoading(true);
    try {
      const rate = exchangeRates[toToken] / exchangeRates[fromToken];
      const receivedAmount = amount * rate;

      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'swap',
        amount: -amount,
        description: `Swapped ${amount} ${fromToken} to ${receivedAmount.toFixed(4)} ${toToken}`,
        balance_after: qubicBalance - (fromToken === 'QUBIC' ? amount : 0)
      });

      if (fromToken === 'QUBIC') {
        await supabase.rpc('update_user_balance', {
          p_user_id: userId,
          p_qubic_delta: -amount
        });
      }

      if (toToken === 'QUBIC') {
        await supabase.rpc('update_user_balance', {
          p_user_id: userId,
          p_qubic_delta: receivedAmount
        });
      }

      alert(`Successfully swapped ${amount} ${fromToken} for ${receivedAmount.toFixed(4)} ${toToken}!`);
      setFromAmount('');
      setToAmount('');
      onBalanceUpdate();
    } catch (error) {
      console.error('Swap error:', error);
      alert('Swap failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMetaMaskSwap = async (amount: number) => {
    setLoading(true);
    try {
      const rate = exchangeRates['QUBIC'] / exchangeRates['ETH'];
      const receivedQubic = amount * rate;

      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'swap',
        amount: receivedQubic,
        description: `Swapped ${amount} ETH from MetaMask to ${receivedQubic.toFixed(2)} QUBIC`,
        balance_after: qubicBalance + receivedQubic
      });

      await supabase.rpc('update_user_balance', {
        p_user_id: userId,
        p_qubic_delta: receivedQubic
      });

      alert(`Successfully swapped ${amount} ETH for ${receivedQubic.toFixed(2)} QUBIC!`);
      setFromAmount('');
      setToAmount('');
      await getMetaMaskBalance(metaMaskAddress!);
      onBalanceUpdate();
    } catch (error) {
      console.error('MetaMask swap error:', error);
      alert('MetaMask swap failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAddress || !withdrawAmount) {
      alert('Please enter wallet address and amount');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (amount < 100) {
      alert('Minimum withdrawal is 100 QUBIC');
      return;
    }

    if (amount > qubicBalance) {
      alert('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      const fee = 1;
      const totalDeducted = amount + fee;

      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'withdrawal',
        amount: -totalDeducted,
        description: `Withdrew ${amount} QUBIC to ${withdrawAddress.slice(0, 10)}... (Fee: ${fee} QUBIC)`,
        balance_after: qubicBalance - totalDeducted
      });

      await supabase.rpc('update_user_balance', {
        p_user_id: userId,
        p_qubic_delta: -totalDeducted
      });

      alert(`Successfully withdrew ${amount} QUBIC! Transaction fee: ${fee} QUBIC`);
      setWithdrawAddress('');
      setWithdrawAmount('');
      onBalanceUpdate();
    } catch (error) {
      console.error('Withdrawal error:', error);
      alert('Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateOutput = (input: string) => {
    if (!input || parseFloat(input) <= 0) return '0';
    const amount = parseFloat(input);
    const rate = exchangeRates[toToken] / exchangeRates[fromToken];
    return (amount * rate).toFixed(6);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    if (value) {
      setToAmount(calculateOutput(value));
    } else {
      setToAmount('');
    }
  };

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    if (fromAmount) {
      setToAmount(fromAmount);
      setFromAmount(toAmount);
    }
  };

  const ViewButton = ({ view, icon: Icon, label }: { view: DeFiView; icon: any; label: string }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-all ${
        activeView === view
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium text-sm md:text-base">{label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 md:p-8 shadow-2xl border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Wallet className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
            Northstm DeFi Hub
          </h2>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-lg border border-purple-500/20 w-fit">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-purple-400 font-medium text-sm">DeFi Platform</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3 mb-6 md:mb-8">
          <ViewButton view="swap" icon={ArrowDownUp} label="Swap" />
          <ViewButton view="liquidity" icon={Droplet} label="Liquidity" />
          <ViewButton view="yield" icon={TrendingUp} label="Yield" />
          <ViewButton view="lending" icon={PieChart} label="Lending" />
          <ViewButton view="withdraw" icon={Wallet} label="Withdraw" />
          {onNavigateToStaking && (
            <button
              onClick={onNavigateToStaking}
              className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-all bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <Zap className="w-4 h-4" />
              <span className="font-medium text-sm md:text-base">Stake</span>
            </button>
          )}
        </div>

        {activeView === 'swap' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 rounded-xl p-4 md:p-6 border-2 border-orange-500/30 mb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">MetaMask Wallet</h3>
                    {metaMaskAddress ? (
                      <div>
                        <p className="text-sm text-slate-300">{metaMaskAddress.slice(0, 6)}...{metaMaskAddress.slice(-4)}</p>
                        <p className="text-xs text-green-400 font-semibold">{metaMaskBalance} ETH</p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">Connect to swap ETH to QUBIC</p>
                    )}
                  </div>
                </div>
                {!metaMaskAddress ? (
                  <button
                    onClick={connectMetaMask}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2"
                  >
                    <Wallet className="w-5 h-5" />
                    Connect MetaMask
                  </button>
                ) : (
                  <button
                    onClick={disconnectMetaMask}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 md:p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-4">Token Swap</h3>

              <div className="space-y-4">
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-400">From</span>
                    <span className="text-sm text-slate-400">
                      Balance: {fromToken === 'QUBIC' ? qubicBalance.toFixed(2) :
                                fromToken === 'ETH' && metaMaskAddress ? metaMaskBalance :
                                '0.00'}
                    </span>
                  </div>
                  <div className="flex gap-3 flex-col sm:flex-row">
                    <input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => handleFromAmountChange(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 bg-transparent text-xl sm:text-2xl text-white font-bold focus:outline-none"
                    />
                    <select
                      value={fromToken}
                      onChange={(e) => setFromToken(e.target.value)}
                      className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 font-semibold"
                    >
                      <option value="QUBIC">QUBIC</option>
                      <option value="USDT">USDT</option>
                      {metaMaskAddress && <option value="ETH">ETH (MetaMask)</option>}
                      {!metaMaskAddress && <option value="ETH">ETH</option>}
                      <option value="BTC">BTC</option>
                      <option value="NSTM">NSTM</option>
                    </select>
                  </div>
                  {fromToken === 'ETH' && !metaMaskAddress && (
                    <p className="text-xs text-orange-400 mt-2">Connect MetaMask to use your ETH balance</p>
                  )}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={swapTokens}
                    className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center border border-slate-700 transition-all"
                  >
                    <Repeat className="w-5 h-5 text-blue-400" />
                  </button>
                </div>

                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-400">To</span>
                    <span className="text-sm text-slate-400">
                      Balance: {toToken === 'QUBIC' ? qubicBalance.toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="flex gap-3 flex-col sm:flex-row">
                    <input
                      type="text"
                      value={toAmount}
                      readOnly
                      placeholder="0.0"
                      className="flex-1 bg-transparent text-xl sm:text-2xl text-white font-bold focus:outline-none"
                    />
                    <select
                      value={toToken}
                      onChange={(e) => setToToken(e.target.value)}
                      className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 font-semibold"
                    >
                      <option value="QUBIC">QUBIC</option>
                      <option value="USDT">USDT</option>
                      <option value="ETH">ETH</option>
                      <option value="BTC">BTC</option>
                      <option value="NSTM">NSTM</option>
                    </select>
                  </div>
                </div>

                {fromAmount && (
                  <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Exchange Rate</span>
                      <span className="text-white font-semibold">
                        1 {fromToken} = {(exchangeRates[toToken] / exchangeRates[fromToken]).toFixed(6)} {toToken}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSwap}
                  disabled={loading || !fromAmount}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ArrowDownUp className="w-5 h-5" />
                  {loading ? 'Swapping...' : 'Swap Tokens'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeView === 'liquidity' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <Droplet className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold text-white">Liquidity Pools</h3>
              </div>
              <p className="text-slate-400 mb-6">Provide liquidity and earn trading fees</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { pair: 'QUBIC/USDT', tvl: '$1.2M', apr: '45%', fees: '0.3%' },
                  { pair: 'QUBIC/ETH', tvl: '$850K', apr: '38%', fees: '0.3%' },
                  { pair: 'NSTM/QUBIC', tvl: '$620K', apr: '52%', fees: '0.3%' },
                  { pair: 'QUBIC/BTC', tvl: '$450K', apr: '35%', fees: '0.3%' }
                ].map((pool) => (
                  <div key={pool.pair} className="bg-slate-900 rounded-lg p-5 border border-slate-700 hover:border-blue-500/50 transition-all">
                    <h4 className="text-lg font-bold text-white mb-3">{pool.pair}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">TVL</span>
                        <span className="text-white font-semibold">{pool.tvl}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">APR</span>
                        <span className="text-green-400 font-semibold">{pool.apr}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fee Tier</span>
                        <span className="text-white font-semibold">{pool.fees}</span>
                      </div>
                    </div>
                    <button className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-all">
                      Add Liquidity
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'yield' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-bold text-white">Yield Farming</h3>
              </div>
              <p className="text-slate-400 mb-6">Stake LP tokens to earn additional rewards</p>

              <div className="space-y-4">
                {[
                  { farm: 'QUBIC-USDT LP', apy: '125%', earned: '0.00', multiplier: '2x' },
                  { farm: 'QUBIC-ETH LP', apy: '98%', earned: '0.00', multiplier: '1.5x' },
                  { farm: 'NSTM-QUBIC LP', apy: '156%', earned: '0.00', multiplier: '3x' },
                  { farm: 'QUBIC-BTC LP', apy: '87%', earned: '0.00', multiplier: '1.2x' }
                ].map((farm) => (
                  <div key={farm.farm} className="bg-slate-900 rounded-lg p-5 border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-white">{farm.farm}</h4>
                        <p className="text-sm text-slate-400">Multiplier: <span className="text-yellow-400 font-semibold">{farm.multiplier}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-400">{farm.apy}</p>
                        <p className="text-xs text-slate-400">APY</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-slate-400">Earned</p>
                        <p className="text-lg font-bold text-white">{farm.earned} NSTM</p>
                      </div>
                      <button className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg transition-all">
                        Harvest
                      </button>
                    </div>
                    <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-all">
                      Stake LP Tokens
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'lending' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <PieChart className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Lending & Borrowing</h3>
              </div>
              <p className="text-slate-400 mb-6">Lend assets to earn interest or borrow against collateral</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white">Supply Markets</h4>
                  {[
                    { asset: 'QUBIC', apy: '8.5%', supplied: '2.5M', collateral: '75%' },
                    { asset: 'USDT', apy: '12.2%', supplied: '1.8M', collateral: '80%' },
                    { asset: 'ETH', apy: '6.8%', supplied: '850K', collateral: '82%' }
                  ].map((market) => (
                    <div key={market.asset} className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-lg font-bold text-white">{market.asset}</span>
                        <span className="text-green-400 font-semibold">{market.apy}</span>
                      </div>
                      <div className="space-y-1 text-sm mb-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Supplied</span>
                          <span className="text-white">{market.supplied}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Collateral Factor</span>
                          <span className="text-white">{market.collateral}</span>
                        </div>
                      </div>
                      <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition-all">
                        Supply
                      </button>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white">Borrow Markets</h4>
                  {[
                    { asset: 'QUBIC', apy: '12.5%', borrowed: '1.2M', available: '1.3M' },
                    { asset: 'USDT', apy: '18.2%', borrowed: '980K', available: '820K' },
                    { asset: 'ETH', apy: '10.8%', borrowed: '450K', available: '400K' }
                  ].map((market) => (
                    <div key={market.asset} className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-lg font-bold text-white">{market.asset}</span>
                        <span className="text-red-400 font-semibold">{market.apy}</span>
                      </div>
                      <div className="space-y-1 text-sm mb-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Borrowed</span>
                          <span className="text-white">{market.borrowed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Available</span>
                          <span className="text-white">{market.available}</span>
                        </div>
                      </div>
                      <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 rounded-lg transition-all">
                        Borrow
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'withdraw' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <Wallet className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-bold text-white">Withdraw QUBIC</h3>
              </div>
              <p className="text-slate-400 mb-6">Transfer QUBIC to your external wallet</p>

              <div className="bg-slate-900 rounded-lg p-6 border border-slate-700 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400">Available Balance</span>
                  <span className="text-2xl font-bold text-white">{qubicBalance.toFixed(2)} QUBIC</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Wallet Address</label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="Enter QUBIC wallet address"
                    className="w-full bg-slate-900 text-white px-4 py-3 rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Amount</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-slate-900 text-white px-4 py-3 rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-2">Min: 100 QUBIC • Fee: 1 QUBIC</p>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={loading || qubicBalance < 100}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Wallet className="w-5 h-5" />
                  {loading ? 'Processing...' : 'Withdraw QUBIC'}
                </button>
              </div>
            </div>
          </div>
        )}
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
