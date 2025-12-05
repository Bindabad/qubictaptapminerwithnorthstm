import { supabase } from '../lib/supabase';

export interface AuthUser {
  id: string;
  email?: string;
  username: string;
  qubic_balance: number;
  total_mined: number;
  qubic_wallet_address: string;
  points_balance?: number;
  hetzner_referral_code?: string;
}

export class AuthService {
  private validateWalletAddress(address: string): boolean {
    return /^[A-Z]{60}$/.test(address);
  }


  async signInWithWallet(walletAddress: string): Promise<AuthUser> {
    if (!this.validateWalletAddress(walletAddress)) {
      throw new Error('Invalid Qubic wallet ID. Must be 60 uppercase letters.');
    }

    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('qubic_wallet_address', walletAddress)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingUser) {
      localStorage.setItem('qubic_wallet_address', walletAddress);
      localStorage.setItem('qubic_user_id', existingUser.id);
      return existingUser;
    }

    const username = `User${walletAddress.substring(0, 6)}`;

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        username,
        qubic_wallet_address: walletAddress,
        qubic_balance: 10000,
        total_mined: 0,
        points_balance: 0
      })
      .select()
      .single();

    if (insertError) throw insertError;

    localStorage.setItem('qubic_wallet_address', walletAddress);
    localStorage.setItem('qubic_user_id', newUser.id);

    return newUser;
  }

  async signOut(): Promise<void> {
    localStorage.removeItem('qubic_wallet_address');
    localStorage.removeItem('qubic_user_id');
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const walletAddress = localStorage.getItem('qubic_wallet_address');
    const userId = localStorage.getItem('qubic_user_id');

    if (!walletAddress || !userId) return null;

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('qubic_wallet_address', walletAddress)
      .maybeSingle();

    if (error) throw error;
    return userData;
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    const checkAuth = async () => {
      const user = await this.getCurrentUser();
      callback(user);
    };

    checkAuth();

    const interval = setInterval(checkAuth, 5000);

    return {
      data: {
        subscription: {
          unsubscribe: () => clearInterval(interval)
        }
      }
    };
  }
}

export const authService = new AuthService();
