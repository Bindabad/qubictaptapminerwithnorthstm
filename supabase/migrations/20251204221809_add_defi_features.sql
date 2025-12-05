/*
  # Add DeFi Platform Features

  1. New Tables
    - `staking_positions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `pool_id` (text, staking pool identifier)
      - `amount` (numeric, staked amount)
      - `start_date` (timestamptz, when staking started)
      - `end_date` (timestamptz, when lock period ends)
      - `apy` (numeric, annual percentage yield)
      - `rewards` (numeric, accumulated rewards)
      - `created_at` (timestamptz)
    
    - `liquidity_positions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `pool_pair` (text, e.g., 'QUBIC/USDT')
      - `token_a_amount` (numeric)
      - `token_b_amount` (numeric)
      - `lp_tokens` (numeric, liquidity provider tokens)
      - `created_at` (timestamptz)
    
    - `yield_farms`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `farm_name` (text)
      - `lp_staked` (numeric)
      - `rewards_earned` (numeric)
      - `multiplier` (numeric)
      - `created_at` (timestamptz)
    
    - `lending_positions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `asset` (text)
      - `amount` (numeric)
      - `type` (text, 'supply' or 'borrow')
      - `interest_rate` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own positions
*/

-- Create staking_positions table
CREATE TABLE IF NOT EXISTS staking_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  pool_id text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  start_date timestamptz DEFAULT now() NOT NULL,
  end_date timestamptz NOT NULL,
  apy numeric NOT NULL CHECK (apy >= 0),
  rewards numeric DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE staking_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own staking positions"
  ON staking_positions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own staking positions"
  ON staking_positions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own staking positions"
  ON staking_positions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own staking positions"
  ON staking_positions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create liquidity_positions table
CREATE TABLE IF NOT EXISTS liquidity_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  pool_pair text NOT NULL,
  token_a_amount numeric NOT NULL CHECK (token_a_amount > 0),
  token_b_amount numeric NOT NULL CHECK (token_b_amount > 0),
  lp_tokens numeric NOT NULL CHECK (lp_tokens > 0),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE liquidity_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own liquidity positions"
  ON liquidity_positions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own liquidity positions"
  ON liquidity_positions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own liquidity positions"
  ON liquidity_positions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own liquidity positions"
  ON liquidity_positions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create yield_farms table
CREATE TABLE IF NOT EXISTS yield_farms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  farm_name text NOT NULL,
  lp_staked numeric NOT NULL CHECK (lp_staked >= 0),
  rewards_earned numeric DEFAULT 0 NOT NULL,
  multiplier numeric NOT NULL CHECK (multiplier > 0),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE yield_farms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own yield farms"
  ON yield_farms FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own yield farms"
  ON yield_farms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own yield farms"
  ON yield_farms FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own yield farms"
  ON yield_farms FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create lending_positions table
CREATE TABLE IF NOT EXISTS lending_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  asset text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('supply', 'borrow')),
  interest_rate numeric NOT NULL CHECK (interest_rate >= 0),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE lending_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lending positions"
  ON lending_positions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own lending positions"
  ON lending_positions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lending positions"
  ON lending_positions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own lending positions"
  ON lending_positions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_staking_positions_user_id ON staking_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_liquidity_positions_user_id ON liquidity_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_yield_farms_user_id ON yield_farms(user_id);
CREATE INDEX IF NOT EXISTS idx_lending_positions_user_id ON lending_positions(user_id);
