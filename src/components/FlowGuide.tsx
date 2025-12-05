import { Coins, Rocket, Wallet, Gift, Users, ArrowRight, TrendingUp } from 'lucide-react';

export default function FlowGuide() {
  const steps = [
    {
      icon: Coins,
      title: 'Tap & Earn',
      description: 'Tap to mine QUBIC tokens instantly',
      color: 'text-qubic-cyan'
    },
    {
      icon: Rocket,
      title: 'Stake',
      description: 'Lock tokens to earn high APY rewards',
      color: 'text-green-500'
    },
    {
      icon: Users,
      title: 'Refer',
      description: 'Invite friends and earn bonus rewards',
      color: 'text-blue-500'
    },
    {
      icon: Wallet,
      title: 'DeFi Trading',
      description: 'Swap, farm, and lend for maximum yield',
      color: 'text-purple-500'
    },
    {
      icon: Gift,
      title: 'Spend',
      description: 'Redeem gift cards with your earnings',
      color: 'text-orange-500'
    },
    {
      icon: TrendingUp,
      title: 'Grow Wealth',
      description: 'Compound returns and scale profits',
      color: 'text-emerald-500'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl border-2 border-black mb-8">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">How Northstm Works</h2>
        <p className="text-gray-600 text-sm md:text-base">
          Users earn QUBIC through tap-to-earn gaming, staking on launchpad, and referrals, then maximize returns using DeFi features like token swaps, liquidity pools, yield farming, and lending protocols.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={index}
              className="relative bg-gray-50 rounded-xl p-5 border-2 border-gray-200 hover:border-qubic-cyan transition-all hover:shadow-lg group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className={`w-6 h-6 ${step.color}`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-500">STEP {index + 1}</span>
                  </div>
                  <h3 className="text-lg font-bold text-black mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-5 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="w-6 h-6 text-qubic-cyan" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-qubic-cyan/10 rounded-xl p-4 border-2 border-qubic-cyan/30">
        <p className="text-sm text-gray-700 text-center">
          <span className="font-bold text-black">Pro Tip:</span> Stake your earned QUBIC in the Launchpad for passive income, then use DeFi to multiply your returns through yield farming and liquidity provision!
        </p>
      </div>
    </div>
  );
}
