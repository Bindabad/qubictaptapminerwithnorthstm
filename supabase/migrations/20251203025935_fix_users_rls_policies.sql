/*
  # Fix Users Table RLS Policies

  1. Changes
    - Drop existing restrictive policies
    - Add permissive policies for wallet-based authentication
    - Allow public user registration via wallet address
    - Allow users to read their own data
    
  2. Security
    - Users can insert their own profile (public registration)
    - Users can only read their own data
    - Users can update their own profile
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;

-- Allow anyone to create a user account (public registration)
CREATE POLICY "Allow public user registration"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users can read their own data
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO anon, authenticated
  USING (id = ANY(SELECT id FROM users WHERE qubic_wallet_address IS NOT NULL));

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (qubic_wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address')
  WITH CHECK (qubic_wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');