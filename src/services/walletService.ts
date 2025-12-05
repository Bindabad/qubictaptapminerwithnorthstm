import { supabase } from '../lib/supabase';
import { MiningResult } from './qubicMining';

export class WalletService {
  async getUserBalance(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('users')
      .select('qubic_balance')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data?.qubic_balance || 0;
  }

  async updateBalance(userId: string, amount: number): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        qubic_balance: amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  }

  async addMinedBalance(userId: string, miningResult: MiningResult): Promise<void> {
    const currentBalance = await this.getUserBalance(userId);
    const newBalance = currentBalance + miningResult.amount;

    const { data: userData } = await supabase
      .from('users')
      .select('total_mined')
      .eq('id', userId)
      .maybeSingle();

    const totalMined = (userData?.total_mined || 0) + miningResult.amount;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        qubic_balance: newBalance,
        total_mined: totalMined,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    const { error: sessionError } = await supabase
      .from('mining_sessions')
      .insert({
        user_id: userId,
        amount_mined: miningResult.amount,
        difficulty: miningResult.difficulty,
        hash_rate: miningResult.hashRate,
        duration_seconds: miningResult.duration,
        started_at: new Date(Date.now() - miningResult.duration * 1000).toISOString(),
        completed_at: new Date().toISOString()
      });

    if (sessionError) throw sessionError;

    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'mine',
        amount: miningResult.amount,
        description: `Mined ${miningResult.amount} QUBIC at ${miningResult.hashRate} H/s`
      });

    if (txError) throw txError;
  }

  async deductBalance(userId: string, amount: number): Promise<void> {
    const currentBalance = await this.getUserBalance(userId);
    if (currentBalance < amount) {
      throw new Error('Insufficient balance');
    }

    await this.updateBalance(userId, currentBalance - amount);
  }

  async getTransactionHistory(userId: string, limit: number = 10) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getMiningStats(userId: string) {
    const { data: sessions, error } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const totalSessions = sessions?.length || 0;
    const avgHashRate = sessions?.reduce((acc, s) => acc + (s.hash_rate || 0), 0) / (totalSessions || 1);

    return {
      sessions: sessions || [],
      totalSessions,
      avgHashRate: Math.floor(avgHashRate)
    };
  }
}

export const walletService = new WalletService();
