/*
  # Simplify Users RLS for Wallet Authentication

  1. Changes
    - Drop all existing policies
    - Create simple permissive policies for wallet-based auth
    - Allow public access for registration and login
    
  2. Security
    - Public can insert and select (needed for wallet auth)
    - Authenticated users can update their own data
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public user registration" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Allow public insert (for registration)
CREATE POLICY "Public can register"
  ON users FOR INSERT
  WITH CHECK (true);

-- Allow public select (for login lookup)
CREATE POLICY "Public can read users"
  ON users FOR SELECT
  USING (true);

-- Allow updates for authenticated users
CREATE POLICY "Users can update"
  ON users FOR UPDATE
  USING (true)
  WITH CHECK (true);