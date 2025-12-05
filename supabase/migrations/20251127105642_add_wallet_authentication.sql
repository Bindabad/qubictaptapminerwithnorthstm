/*
  # Update Authentication to Use Qubic Wallet Addresses

  1. Changes
    - Add `qubic_wallet_address` column to users table as unique identifier
    - Make email nullable since we're using wallet addresses for auth
    - Add index on wallet address for faster lookups
    
  2. Security
    - Keep RLS policies as-is
    - Wallet address becomes the primary authentication method
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'qubic_wallet_address'
  ) THEN
    ALTER TABLE users ADD COLUMN qubic_wallet_address TEXT UNIQUE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(qubic_wallet_address);
