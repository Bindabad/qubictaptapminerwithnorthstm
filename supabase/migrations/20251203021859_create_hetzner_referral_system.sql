/*
  # Hetzner Referral & Server Catalog System

  1. New Tables
    - `hetzner_server_catalog`
      - Server types (EX101, AX162, etc.) with specs and pricing
      - Hash power estimations and profit calculations
      - Monthly costs and ROI metrics
    
    - `user_hetzner_referrals`
      - Track Hetzner signups under parent referral
      - Store referral status and verification
      - Link to user accounts
    
    - `user_virtual_servers`
      - Virtual server purchases (in-app)
      - Track hash power contributions
      - Payment and activation status

  2. Updates
    - Add `hetzner_referral_code` to users table
    - Add `parent_referral_id` for tracking the main account
    - Add `points_balance` for tap-to-earn system

  3. Security
    - Enable RLS on all new tables
    - Users can only read catalog (public data)
    - Users can manage their own referrals and servers
    - Admin functions for catalog management
*/

CREATE TABLE IF NOT EXISTS hetzner_server_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_name text NOT NULL,
  server_type text NOT NULL,
  cpu_model text NOT NULL,
  cpu_cores integer NOT NULL,
  ram_gb integer NOT NULL,
  storage_info text DEFAULT '',
  monthly_cost_eur numeric NOT NULL,
  estimated_hashrate numeric NOT NULL,
  estimated_daily_profit_usd numeric NOT NULL,
  estimated_monthly_profit_usd numeric NOT NULL,
  roi_months numeric NOT NULL,
  is_available boolean DEFAULT true,
  display_order integer DEFAULT 0,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hetzner_server_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view server catalog"
  ON hetzner_server_catalog
  FOR SELECT
  TO authenticated
  USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'hetzner_referral_code'
  ) THEN
    ALTER TABLE users ADD COLUMN hetzner_referral_code text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'parent_referral_id'
  ) THEN
    ALTER TABLE users ADD COLUMN parent_referral_id uuid REFERENCES users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'points_balance'
  ) THEN
    ALTER TABLE users ADD COLUMN points_balance numeric DEFAULT 0;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS user_hetzner_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  hetzner_referral_code text NOT NULL,
  hetzner_email text NOT NULL,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  signup_date timestamptz DEFAULT now(),
  verified_at timestamptz,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_hetzner_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Hetzner referrals"
  ON user_hetzner_referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own Hetzner referrals"
  ON user_hetzner_referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS user_virtual_servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  server_catalog_id uuid NOT NULL REFERENCES hetzner_server_catalog(id),
  server_name text NOT NULL,
  hash_power_contribution numeric NOT NULL,
  monthly_cost_eur numeric NOT NULL,
  purchase_type text DEFAULT 'virtual' CHECK (purchase_type IN ('virtual', 'real')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  activation_date timestamptz DEFAULT now(),
  last_payout_date timestamptz,
  total_earned_usd numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_virtual_servers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own virtual servers"
  ON user_virtual_servers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own virtual servers"
  ON user_virtual_servers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own virtual servers"
  ON user_virtual_servers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

INSERT INTO hetzner_server_catalog (server_name, server_type, cpu_model, cpu_cores, ram_gb, storage_info, monthly_cost_eur, estimated_hashrate, estimated_daily_profit_usd, estimated_monthly_profit_usd, roi_months, is_available, display_order, description) VALUES
  ('EX44', 'Dedicated', 'AMD Ryzen 5 3600', 6, 64, '2x 512GB NVMe', 39.00, 85000, 2.80, 84.00, 0.46, true, 1, 'Entry-level dedicated server perfect for beginners'),
  ('EX101', 'Dedicated', 'AMD Ryzen 9 7950X', 16, 128, '2x 1TB NVMe', 69.00, 180000, 5.50, 165.00, 0.42, true, 2, 'High-performance mining with excellent ROI'),
  ('AX102', 'Dedicated', 'AMD EPYC 7502P', 32, 128, '2x 1TB NVMe', 99.00, 220000, 7.20, 216.00, 0.46, true, 3, 'Enterprise-grade dual CPU mining power'),
  ('AX162', 'Dedicated', 'AMD EPYC 9454P', 48, 256, '2x 1.92TB NVMe', 189.00, 380000, 12.50, 375.00, 0.50, true, 4, 'Maximum hash power with latest EPYC Genoa'),
  ('CCX33', 'Cloud', 'AMD EPYC Shared', 8, 32, '240GB NVMe', 22.90, 45000, 1.50, 45.00, 0.51, true, 5, 'Budget-friendly cloud option for testing')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_user_hetzner_referrals_user_id ON user_hetzner_referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_virtual_servers_user_id ON user_virtual_servers(user_id);
CREATE INDEX IF NOT EXISTS idx_users_hetzner_referral_code ON users(hetzner_referral_code);
CREATE INDEX IF NOT EXISTS idx_users_parent_referral_id ON users(parent_referral_id);
