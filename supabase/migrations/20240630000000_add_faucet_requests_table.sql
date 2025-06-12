-- Create faucet_requests table
CREATE TABLE IF NOT EXISTS public.faucet_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address text NOT NULL,
  token_address text,
  amount text NOT NULL,
  network text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  transaction_hash text,
  user_id uuid,
  ip_address text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT faucet_requests_status_check CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED'))
);

-- Add RLS policies
ALTER TABLE public.faucet_requests ENABLE ROW LEVEL SECURITY;

-- Allow all users with JWT token to read/insert/update faucet requests
CREATE POLICY "Users can view faucet requests" ON public.faucet_requests
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create their own faucet requests" ON public.faucet_requests
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own faucet requests" ON public.faucet_requests
  FOR UPDATE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Add indices for better performance
CREATE INDEX idx_faucet_requests_wallet_address ON public.faucet_requests(wallet_address);
CREATE INDEX idx_faucet_requests_network ON public.faucet_requests(network);
CREATE INDEX idx_faucet_requests_created_at ON public.faucet_requests(created_at);
CREATE INDEX idx_faucet_requests_status ON public.faucet_requests(status);

-- Add comments
COMMENT ON TABLE public.faucet_requests IS 'Requests for testnet tokens from the faucet';
COMMENT ON COLUMN public.faucet_requests.wallet_address IS 'Wallet address that requested tokens';
COMMENT ON COLUMN public.faucet_requests.token_address IS 'Address of the token requested (null for native tokens)';
COMMENT ON COLUMN public.faucet_requests.amount IS 'Amount of tokens requested';
COMMENT ON COLUMN public.faucet_requests.network IS 'Network the tokens were requested on (e.g., sepolia, mumbai)';
COMMENT ON COLUMN public.faucet_requests.status IS 'Status of the request (PENDING, COMPLETED, FAILED)';
COMMENT ON COLUMN public.faucet_requests.transaction_hash IS 'Transaction hash for the token transfer';
COMMENT ON COLUMN public.faucet_requests.user_id IS 'ID of the user who made the request';