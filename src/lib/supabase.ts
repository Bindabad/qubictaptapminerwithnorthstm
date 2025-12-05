import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email: string;
  username: string;
  qubic_balance: number;
  total_mined: number;
  created_at: string;
  updated_at: string;
};

export type MiningSession = {
  id: string;
  user_id: string;
  amount_mined: number;
  difficulty: number;
  hash_rate: number;
  duration_seconds: number;
  started_at: string;
  completed_at: string;
};

export type GiftCard = {
  id: string;
  code: string;
  sender_id: string;
  recipient_email: string;
  amount: number;
  message: string;
  status: 'active' | 'redeemed' | 'expired';
  redeemed_by?: string;
  created_at: string;
  redeemed_at?: string;
  expires_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: 'mine' | 'send_gift' | 'receive_gift';
  amount: number;
  reference_id?: string;
  description: string;
  created_at: string;
};
