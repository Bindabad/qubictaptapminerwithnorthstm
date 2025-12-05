import { useState } from 'react';
import { ArrowDownUp, Wallet, TrendingUp, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import InfoBox from './InfoBox';

interface SwapDEXProps {
  userId: string;
  qubicBalance: number;
  onBalanceUpdate: () => void;
}

interface Currency {
  symbol: string;
  name: string;
  rate: number;
  icon: string;
}

const currencies: Currency[] = [
  { symbol: 'QUBIC', name: 'Qubic', rate: 1, icon: 'Q' },
  { symbol: 'USDT', name: 'Tether USD', rate: 0.000025, icon: '₮' },
  { symbol: 'BTC', name: 'Bitcoin', rate: 0.0000000004, icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', rate: 0.000000008, icon: 'Ξ' },
  { symbol: 'BNB', name: 'Binance Coin', rate: 0.000000045, icon: 'B' }
];

export default function SwapDEX({ userId, qubicBalance, onBalanceUpdate }: SwapDEXProps) {
  const [fromCurrency, setFromCurrency] = useState(currencies[0]);
  const [toCurrency, setToCurrency] = useState(currencies[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const calculateSwap = (amount: string, from: Currency, to: Currency) => {
    const amountNum = parseFloat(amount) || 0;
    const result = (amountNum * from.rate) / to.rate;
    return result.toFixed(8);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    setToAmount(calculateSwap(value, fromCurrency, toCurrency));
  };

  const handleToAmountChange = (value: string) => {
    setToAmount(value);
    setFromAmount(calculateSwap(value, toCurrency, fromCurrency));
  };

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(fromAmount);

    if (fromCurrency.symbol === 'QUBIC' && amount > qubicBalance) {
      alert('Insufficient QUBIC balance');
      return;
    }

    setLoading(true);
    try {
      const receivedAmount = parseFloat(toAmount);

      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'swap',
        amount: fromCurrency.symbol === 'QUBIC' ? -amount : receivedAmount,
        description: `Swapped ${amount} ${fromCurrency.symbol} to ${receivedAmount.toFixed(8)} ${toCurrency.symbol}`,
        balance_after: qubicBalance + (fromCurrency.symbol === 'QUBIC' ? -amount : receivedAmount)
      });

      if (fromCurrency.symbol === 'QUBIC') {
        await supabase.rpc('update_user_balance', {
          p_user_id: userId,
          p_qubic_delta: -amount
        });
      } else if (toCurrency.symbol === 'QUBIC') {
        await supabase.rpc('update_user_balance', {
          p_user_id: userId,
          p_qubic_delta: receivedAmount
        });
      }

      alert(`Successfully swapped ${amount} ${fromCurrency.symbol} for ${receivedAmount.toFixed(8)} ${toCurrency.symbol}!`);
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

  const exchangeRate = (fromCurrency.rate / toCurrency.rate).toFixed(8);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl border-2 border-black mb-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-2 flex items-center justify-center gap-3">
            <TrendingUp className="w-10 h-10 text-qubic-cyan" />
            Qubic Swap DEX
          </h1>
          <p className="text-gray-600 font-medium text-lg">Decentralized exchange</p>
        </div>

        <div className="bg-qubic-cyan/5 rounded-xl p-5 border-2 border-qubic-cyan mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-qubic-cyan" />
            <span className="text-black font-bold">Your Balance</span>
          </div>
          <p className="text-3xl font-bold text-black">{qubicBalance.toFixed(3)} QUBIC</p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-100 rounded-xl p-5 border-2 border-black">
            <label className="text-black font-bold text-sm mb-3 block">From</label>
            <div className="flex gap-3 mb-3">
              <select
                value={fromCurrency.symbol}
                onChange={(e) => {
                  const currency = currencies.find(c => c.symbol === e.target.value)!;
                  setFromCurrency(currency);
                  setToAmount(calculateSwap(fromAmount, currency, toCurrency));
                }}
                className="bg-white border-2 border-black rounded-lg px-4 py-2 text-black font-bold focus:outline-none focus:ring-2 focus:ring-qubic-cyan"
              >
                {currencies.map(c => (
                  <option key={c.symbol} value={c.symbol}>{c.symbol}</option>
                ))}
              </select>
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                className="flex-1 bg-white border-2 border-black rounded-lg px-4 py-2 text-black font-mono text-lg focus:outline-none focus:ring-2 focus:ring-qubic-cyan"
                placeholder="0.0"
              />
            </div>
            <p className="text-xs text-gray-600 font-medium">{fromCurrency.name}</p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={swapCurrencies}
              className="bg-qubic-cyan hover:bg-qubic-cyan/80 text-black p-3 rounded-full transition-all border-2 border-black shadow-lg"
            >
              <ArrowDownUp className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-gray-100 rounded-xl p-5 border-2 border-black">
            <label className="text-black font-bold text-sm mb-3 block">To</label>
            <div className="flex gap-3 mb-3">
              <select
                value={toCurrency.symbol}
                onChange={(e) => {
                  const currency = currencies.find(c => c.symbol === e.target.value)!;
                  setToCurrency(currency);
                  setToAmount(calculateSwap(fromAmount, fromCurrency, currency));
                }}
                className="bg-white border-2 border-black rounded-lg px-4 py-2 text-black font-bold focus:outline-none focus:ring-2 focus:ring-qubic-cyan"
              >
                {currencies.map(c => (
                  <option key={c.symbol} value={c.symbol}>{c.symbol}</option>
                ))}
              </select>
              <input
                type="number"
                value={toAmount}
                onChange={(e) => handleToAmountChange(e.target.value)}
                className="flex-1 bg-white border-2 border-black rounded-lg px-4 py-2 text-black font-mono text-lg focus:outline-none focus:ring-2 focus:ring-qubic-cyan"
                placeholder="0.0"
              />
            </div>
            <p className="text-xs text-gray-600 font-medium">{toCurrency.name}</p>
          </div>
        </div>

        <div className="bg-black rounded-xl p-4 my-6 border-2 border-qubic-cyan">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-qubic-cyan flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-white font-bold mb-1">Exchange Rate</p>
              <p className="text-qubic-cyan font-mono">
                1 {fromCurrency.symbol} = {exchangeRate} {toCurrency.symbol}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSwap}
          disabled={loading || !fromAmount || parseFloat(fromAmount) <= 0}
          className="w-full bg-qubic-cyan hover:bg-qubic-cyan/80 disabled:bg-gray-300 text-black font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-xl border-2 border-black flex items-center justify-center gap-2"
        >
          <ArrowDownUp className="w-5 h-5" />
          {loading ? 'Processing...' : 'Swap Now'}
        </button>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <button
            onClick={() => handleFromAmountChange((qubicBalance * 0.25).toFixed(3))}
            className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 rounded-lg transition-all border-2 border-black"
          >
            25%
          </button>
          <button
            onClick={() => handleFromAmountChange((qubicBalance * 0.50).toFixed(3))}
            className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 rounded-lg transition-all border-2 border-black"
          >
            50%
          </button>
          <button
            onClick={() => handleFromAmountChange(qubicBalance.toFixed(3))}
            className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 rounded-lg transition-all border-2 border-black"
          >
            MAX
          </button>
        </div>
      </div>

      <div className="bg-qubic-cyan/5 rounded-xl p-6 border-2 border-qubic-cyan text-center mb-6">
        <p className="text-black font-medium leading-relaxed">
          <span className="font-bold text-qubic-cyan">Live DEX:</span> Swap your Qubic rewards into any cryptocurrency
          using our decentralized exchange with competitive rates!
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
