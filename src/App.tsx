import { useState, useEffect } from 'react';
import { Coins, Menu, X, Users, Wallet, Rocket, Gift } from 'lucide-react';
import AuthForm from './components/AuthForm';
import GiftCardManager from './components/GiftCardManager';
import TapToEarn from './components/TapToEarn';
import LaunchpadStaking from './components/LaunchpadStaking';
import ReferralSystem from './components/ReferralSystem';
import DeFiPlatform from './components/DeFiPlatform';
import FlowGuide from './components/FlowGuide';
import { authService, AuthUser } from './services/authService';
import { walletService } from './services/walletService';

type ViewType = 'tap' | 'launchpad' | 'gifts' | 'referral' | 'defi';

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('tap');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    const { data: { subscription } } = authService.onAuthStateChange((authUser) => {
      setUser(authUser);
      if (authUser) {
        loadUserData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        await loadUserData();
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    if (!user?.id) return;

    try {
      await walletService.getTransactionHistory(user.id, 10);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleBalanceUpdate = async () => {
    const updatedUser = await authService.getCurrentUser();
    setUser(updatedUser);
    await loadUserData();
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-4 shadow-lg animate-pulse">
            <span className="text-3xl font-bold text-qubic-cyan">Q</span>
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={checkAuth} />;
  }

  const NavButton = ({ view, icon: Icon, label }: { view: ViewType; icon: any; label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setMobileMenuOpen(false);
      }}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all font-bold ${
        currentView === view
          ? 'bg-qubic-cyan text-black shadow-lg'
          : 'text-gray-400 hover:text-qubic-cyan hover:bg-gray-900'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-black border-b-2 border-qubic-cyan sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-qubic-cyan rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-black">Q</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">QUBIC TAP TAP MINER</h1>
                <p className="text-xs text-qubic-cyan">Northstm Launchpad Protocol</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <NavButton view="tap" icon={Coins} label="Tap Mine" />
              <NavButton view="launchpad" icon={Rocket} label="Launchpad" />
              <NavButton view="defi" icon={Wallet} label="DeFi" />
              <NavButton view="gifts" icon={Gift} label="Cards" />
              <NavButton view="referral" icon={Users} label="Refer" />
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <NavButton view="tap" icon={Coins} label="Tap Mine" />
              <NavButton view="launchpad" icon={Rocket} label="Launchpad" />
              <NavButton view="defi" icon={Wallet} label="DeFi Hub" />
              <NavButton view="gifts" icon={Gift} label="Gift Cards" />
              <NavButton view="referral" icon={Users} label="Referrals" />
            </div>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <FlowGuide />

          {currentView === 'tap' && (
            <TapToEarn
              userId={user.id}
              currentPoints={user.points_balance || 0}
              onPointsUpdate={handleBalanceUpdate}
            />
          )}

          {currentView === 'launchpad' && (
            <LaunchpadStaking
              userId={user.id}
              qubicBalance={user.qubic_balance}
              onBalanceUpdate={handleBalanceUpdate}
            />
          )}

          {currentView === 'referral' && (
            <ReferralSystem userId={user.id} referralCode={user.hetzner_referral_code || 'QUBIC2025'} />
          )}

          {currentView === 'defi' && (
            <DeFiPlatform
              userId={user.id}
              qubicBalance={user.qubic_balance}
              onBalanceUpdate={handleBalanceUpdate}
              onNavigateToStaking={() => setCurrentView('launchpad')}
            />
          )}

          {currentView === 'gifts' && (
            <GiftCardManager
              userId={user.id}
              currentBalance={user.qubic_balance}
              onBalanceUpdate={handleBalanceUpdate}
            />
          )}

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm font-medium">
              Powered by Northstm Launchpad • Gamified DeFi & Allocation Trading Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
