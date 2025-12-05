import { supabase } from '../lib/supabase';

export interface ServerPurchase {
  serverId: string;
  userId: string;
  paymentMethod: 'points' | 'crypto';
}

export const serverService = {
  async purchaseVirtualServer(purchase: ServerPurchase) {
    try {
      const { data: server, error: serverError } = await supabase
        .from('hetzner_server_catalog')
        .select('*')
        .eq('id', purchase.serverId)
        .single();

      if (serverError) throw serverError;
      if (!server) throw new Error('Server not found');

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('points_balance')
        .eq('id', purchase.userId)
        .single();

      if (userError) throw userError;

      const pointsCost = server.monthly_cost_eur * 100;

      if (purchase.paymentMethod === 'points') {
        if (parseFloat(user.points_balance) < pointsCost) {
          throw new Error('Insufficient points balance');
        }

        const { error: deductError } = await supabase
          .from('users')
          .update({
            points_balance: parseFloat(user.points_balance) - pointsCost
          })
          .eq('id', purchase.userId);

        if (deductError) throw deductError;
      }

      const { data: virtualServer, error: insertError } = await supabase
        .from('user_virtual_servers')
        .insert({
          user_id: purchase.userId,
          server_catalog_id: purchase.serverId,
          server_name: server.server_name,
          hash_power_contribution: server.estimated_hashrate,
          monthly_cost_eur: server.monthly_cost_eur,
          purchase_type: 'virtual',
          status: 'active'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const { data: poolData } = await supabase
        .from('mining_pool_stats')
        .select('id, total_hashrate, active_servers')
        .maybeSingle();

      if (poolData) {
        await supabase
          .from('mining_pool_stats')
          .update({
            total_hashrate: parseFloat(poolData.total_hashrate) + parseFloat(server.estimated_hashrate),
            active_servers: poolData.active_servers + 1
          })
          .eq('id', poolData.id);
      }

      return virtualServer;
    } catch (error) {
      console.error('Error purchasing server:', error);
      throw error;
    }
  },

  async getUserServers(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_virtual_servers')
        .select(`
          *,
          server_catalog:hetzner_server_catalog(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user servers:', error);
      return [];
    }
  },

  async calculateUserEarnings(userId: string) {
    try {
      const servers = await this.getUserServers(userId);

      const totalHashPower = servers
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + parseFloat(s.hash_power_contribution), 0);

      const { data: poolStats } = await supabase
        .from('mining_pool_stats')
        .select('total_hashrate, daily_earnings_usd')
        .single();

      if (!poolStats || poolStats.total_hashrate === 0) {
        return {
          dailyEarnings: 0,
          monthlyEarnings: 0,
          totalCosts: 0,
          netProfit: 0
        };
      }

      const userShare = totalHashPower / parseFloat(poolStats.total_hashrate);
      const dailyEarnings = parseFloat(poolStats.daily_earnings_usd) * userShare;
      const monthlyEarnings = dailyEarnings * 30;

      const totalCosts = servers
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + parseFloat(s.monthly_cost_eur) * 1.1, 0);

      return {
        dailyEarnings,
        monthlyEarnings,
        totalCosts,
        netProfit: monthlyEarnings - totalCosts
      };
    } catch (error) {
      console.error('Error calculating earnings:', error);
      return {
        dailyEarnings: 0,
        monthlyEarnings: 0,
        totalCosts: 0,
        netProfit: 0
      };
    }
  },

  async pauseServer(serverId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('user_virtual_servers')
        .update({ status: 'paused' })
        .eq('id', serverId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error pausing server:', error);
      throw error;
    }
  },

  async resumeServer(serverId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('user_virtual_servers')
        .update({ status: 'active' })
        .eq('id', serverId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error resuming server:', error);
      throw error;
    }
  }
};
