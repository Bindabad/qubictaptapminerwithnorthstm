import { useState, useEffect } from 'react';
import { Gift, Send, Ticket, Mail, MessageSquare, Calendar, CheckCircle, XCircle, CreditCard, Copy, Check, RotateCw, Sparkles } from 'lucide-react';
import { giftCardService } from '../services/giftCardService';
import { GiftCard } from '../lib/supabase';
import InfoBox from './InfoBox';

interface GiftCardManagerProps {
  userId: string;
  currentBalance: number;
  onBalanceUpdate: () => void;
}

const cardGradients = [
  'from-pink-500 via-rose-500 to-red-500',
  'from-purple-500 via-violet-500 to-indigo-500',
  'from-cyan-500 via-blue-500 to-indigo-500',
  'from-amber-500 via-orange-500 to-red-500',
  'from-green-500 via-emerald-500 to-teal-500',
  'from-fuchsia-500 via-pink-500 to-rose-500'
];

export default function GiftCardManager({ userId, currentBalance, onBalanceUpdate }: GiftCardManagerProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'redeem' | 'history'>('create');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(0);
  const [redeemCode, setRedeemCode] = useState('');
  const [sentCards, setSentCards] = useState<GiftCard[]>([]);
  const [receivedCards, setReceivedCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadGiftCards();
  }, [userId]);

  const loadGiftCards = async () => {
    try {
      const [sent, received] = await Promise.all([
        giftCardService.getUserSentGiftCards(userId),
        giftCardService.getUserReceivedGiftCards(userId)
      ]);
      setSentCards(sent);
      setReceivedCards(received);
    } catch (error) {
      console.error('Error loading gift cards:', error);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amountNum = parseFloat(amount);
      if (amountNum <= 0 || amountNum > currentBalance) {
        throw new Error('Invalid amount');
      }

      const fullMessage = recipientName
        ? `To: ${recipientName}${message ? ` - ${message}` : ''}`
        : message;

      const card = await giftCardService.createGiftCard(userId, recipientEmail, amountNum, fullMessage);
      showNotification('success', `Gift card created! Code: ${card.code}`);
      setRecipientEmail('');
      setAmount('');
      setMessage('');
      setRecipientName('');
      setSelectedGradient(0);
      onBalanceUpdate();
      await loadGiftCards();
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to create gift card');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await giftCardService.redeemGiftCard(redeemCode, userId);
      showNotification('success', 'Gift card redeemed successfully!');
      setRedeemCode('');
      onBalanceUpdate();
      await loadGiftCards();
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to redeem gift card');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleFlip = (cardId: string) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-black mb-2 flex items-center justify-center gap-3">
          <CreditCard className="w-10 h-10 text-qubic-cyan" />
          Qubic Gift Cards
        </h1>
        <p className="text-gray-600 font-medium text-lg">Create stunning 3D cards & spread the crypto love</p>
      </div>

      {notification && (
        <div className={`mb-6 p-4 rounded-xl border-2 ${
          notification.type === 'success'
            ? 'bg-qubic-cyan/10 border-qubic-cyan text-black'
            : 'bg-qubic-red/10 border-qubic-red text-qubic-red'
        }`}>
          <div className="flex items-center gap-2 font-bold">
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-8 bg-gray-200 p-2 rounded-xl border-2 border-black">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all ${
            activeTab === 'create'
              ? 'bg-qubic-cyan text-black shadow-lg border-2 border-black'
              : 'text-gray-600 hover:text-black'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-2" />
          Create
        </button>
        <button
          onClick={() => setActiveTab('redeem')}
          className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all ${
            activeTab === 'redeem'
              ? 'bg-qubic-cyan text-black shadow-lg border-2 border-black'
              : 'text-gray-600 hover:text-black'
          }`}
        >
          <Gift className="w-4 h-4 inline mr-2" />
          Redeem
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-qubic-cyan text-black shadow-lg border-2 border-black'
              : 'text-gray-600 hover:text-black'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          History
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl border-2 border-black">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-qubic-cyan" />
            <h3 className="text-2xl font-bold text-black">Design Your Gift Card</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-black font-bold mb-2">
                  <Mail className="w-4 h-4 text-qubic-cyan" />
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  required
                  className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-qubic-cyan/20"
                  placeholder="friend@example.com"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-black font-bold mb-2">
                  <MessageSquare className="w-4 h-4 text-qubic-cyan" />
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-qubic-cyan/20"
                  placeholder="Who is this for?"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-black font-bold mb-2">
                  <Ticket className="w-4 h-4 text-qubic-cyan" />
                  Amount (QUBIC)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="0.001"
                  max={currentBalance}
                  className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-qubic-cyan/20 font-mono text-2xl font-bold"
                  placeholder="0.000"
                />
                <p className="text-sm text-gray-600 mt-2 font-medium">Available: {currentBalance.toFixed(3)} QUBIC</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-black font-bold mb-2">
                  <MessageSquare className="w-4 h-4 text-qubic-cyan" />
                  Personal Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-qubic-cyan/20 resize-none"
                  placeholder="Add a heartfelt message..."
                />
              </div>

              <div>
                <label className="block text-black font-bold mb-3">Card Design</label>
                <div className="grid grid-cols-3 gap-3">
                  {cardGradients.map((gradient, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedGradient(index)}
                      className={`h-16 rounded-xl bg-gradient-to-br ${gradient} transition-all border-2 border-black ${
                        selectedGradient === index
                          ? 'ring-4 ring-qubic-cyan scale-105 shadow-xl'
                          : 'opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-full max-w-sm">
                <div className={`bg-gradient-to-br ${cardGradients[selectedGradient]} rounded-2xl p-8 shadow-2xl transform transition-all hover:scale-105 border-2 border-black/20`}>
                  <div className="flex justify-between items-start mb-6">
                    <Gift className="w-12 h-12 text-white/90" />
                    <Sparkles className="w-8 h-8 text-white/70 animate-pulse" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-white/70 text-sm font-bold">GIFT CARD VALUE</p>
                      <p className="text-4xl font-bold text-white">{amount || '0.00'} QUBIC</p>
                    </div>
                    {recipientName && (
                      <div>
                        <p className="text-white/70 text-sm font-bold">TO</p>
                        <p className="text-xl font-bold text-white">{recipientName}</p>
                      </div>
                    )}
                    {message && (
                      <div className="pt-4 border-t border-white/20">
                        <p className="text-white/90 text-sm italic">"{message}"</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/20">
                    <p className="text-white/60 text-xs font-bold tracking-wider">NORTHSTM NETWORK</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateGiftCard}
            disabled={loading || !amount || !recipientEmail}
            className="w-full bg-qubic-cyan hover:bg-qubic-cyan/80 disabled:bg-gray-300 text-black font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-xl border-2 border-black flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            {loading ? 'Creating Your Gift...' : 'Create Gift Card'}
          </button>
        </div>
      )}

      {activeTab === 'redeem' && (
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl border-2 border-black">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-qubic-cyan rounded-full mb-4 border-2 border-black">
              <Gift className="w-10 h-10 text-black" />
            </div>
            <h3 className="text-2xl font-bold text-black mb-2">Redeem Your Gift Card</h3>
            <p className="text-gray-600 font-medium">Enter the code to claim your Qubic</p>
          </div>

          <form onSubmit={handleRedeemGiftCard} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-black font-bold mb-2">
                <Ticket className="w-4 h-4 text-qubic-cyan" />
                Gift Card Code
              </label>
              <input
                type="text"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                required
                className="w-full bg-white border-2 border-black rounded-xl px-4 py-4 text-black placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-qubic-cyan/20 font-mono text-xl tracking-wider text-center"
                placeholder="XXXX-XXXX-XXXX-XXXX"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-qubic-cyan hover:bg-qubic-cyan/80 disabled:bg-gray-300 text-black font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-xl border-2 border-black flex items-center justify-center gap-2"
            >
              <Gift className="w-5 h-5" />
              {loading ? 'Redeeming...' : 'Redeem Gift Card'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-black">
            <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-qubic-cyan" />
              Sent Gift Cards
            </h3>
            {sentCards.length === 0 ? (
              <p className="text-gray-500 text-center py-8 font-medium">No sent gift cards yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sentCards.map((card, index) => {
                  const isFlipped = flippedCards.has(card.id);
                  const gradient = cardGradients[index % cardGradients.length];
                  const isRedeemed = card.status === 'redeemed';

                  return (
                    <div key={card.id} className="perspective-1000">
                      <div
                        className="relative transition-all duration-700"
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                        }}
                      >
                        <div
                          className={`backface-hidden ${
                            isRedeemed
                              ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                              : `bg-gradient-to-br ${gradient}`
                          } rounded-2xl p-6 shadow-2xl border-2 ${
                            isRedeemed ? 'border-gray-600' : 'border-black/20'
                          } min-h-[280px] flex flex-col justify-between`}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-6">
                              <Gift className="w-10 h-10 text-white/90" />
                              <span className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${
                                isRedeemed
                                  ? 'bg-green-500/30 text-white border-white/30'
                                  : 'bg-white/20 text-white border-white/30'
                              }`}>
                                {card.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <p className="text-white/70 text-xs font-semibold tracking-wide">GIFT CARD VALUE</p>
                                <p className="text-3xl font-bold text-white">{card.amount} QUBIC</p>
                              </div>
                              <div>
                                <p className="text-white/70 text-xs font-semibold">TO</p>
                                <p className="text-sm text-white truncate">{card.recipient_email}</p>
                              </div>
                              {card.message && (
                                <div className="pt-3 border-t border-white/20">
                                  <p className="text-white/90 text-sm italic line-clamp-2">"{card.message}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleFlip(card.id)}
                            className="mt-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 border border-white/20"
                          >
                            <RotateCw className="w-4 h-4" />
                            View Code
                          </button>
                        </div>

                        <div
                          className="absolute inset-0 backface-hidden bg-black rounded-2xl p-6 shadow-2xl border-2 border-qubic-cyan"
                          style={{
                            transform: 'rotateY(180deg)'
                          }}
                        >
                          <div className="h-full flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-qubic-cyan animate-pulse" />
                                <p className="text-qubic-cyan text-xs font-semibold tracking-wider">REDEMPTION CODE</p>
                              </div>
                              <div className="bg-gray-900 rounded-xl p-4 mb-4 border border-qubic-cyan/30">
                                <code className="text-qubic-cyan font-mono text-lg font-bold break-all">{card.code}</code>
                              </div>
                              <button
                                onClick={() => copyCode(card.code)}
                                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 border border-qubic-cyan/30 mb-4"
                              >
                                {copiedCode === card.code ? (
                                  <>
                                    <Check className="w-4 h-4 text-green-400" />
                                    <span className="text-green-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4 text-qubic-cyan" />
                                    <span className="text-qubic-cyan">Copy Code</span>
                                  </>
                                )}
                              </button>
                              <div className="text-xs text-gray-400 space-y-1">
                                <p>Created: {formatDate(card.created_at)}</p>
                                {card.redeemed_at && <p>Redeemed: {formatDate(card.redeemed_at)}</p>}
                              </div>
                            </div>
                            <button
                              onClick={() => toggleFlip(card.id)}
                              className="w-full bg-qubic-cyan hover:bg-qubic-cyan/80 text-black font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                              <RotateCw className="w-4 h-4" />
                              Flip Back
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-black">
            <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-qubic-cyan" />
              Received Gift Cards
            </h3>
            {receivedCards.length === 0 ? (
              <p className="text-gray-500 text-center py-8 font-medium">No received gift cards yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {receivedCards.map((card) => (
                  <div key={card.id} className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-5 border-2 border-black shadow-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-mono text-black font-bold text-sm">{card.code}</p>
                        {card.message && <p className="text-xs text-gray-600 italic mt-1">"{card.message}"</p>}
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-black text-qubic-cyan border-2 border-qubic-cyan">
                        Redeemed
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-black font-bold text-lg">{card.amount} QUBIC</span>
                      <span className="text-gray-600 text-xs font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(card.redeemed_at || card.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
