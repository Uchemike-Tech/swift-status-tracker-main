
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create transfers table
CREATE TABLE public.transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  sender_name TEXT NOT NULL,
  sender_reference TEXT,
  recipient_name TEXT NOT NULL,
  amount NUMERIC(20, 8) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  method TEXT NOT NULL CHECK (method IN ('bank', 'crypto')),
  -- Bank fields
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  bank_country TEXT,
  -- Crypto fields
  crypto_type TEXT,
  wallet_address TEXT,
  network TEXT,
  transaction_hash TEXT,
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- 4. Create transfer_timeline_events table
CREATE TABLE public.transfer_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID REFERENCES public.transfers(id) ON DELETE CASCADE NOT NULL,
  step_name TEXT NOT NULL,
  step_order INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transfer_timeline_events ENABLE ROW LEVEL SECURITY;

-- 5. Helper function: is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- 6. Public view for transfers (hides sensitive fields, masks account numbers)
CREATE VIEW public.transfers_public
WITH (security_invoker = on)
AS
SELECT
  public_id,
  sender_name,
  recipient_name,
  amount,
  currency,
  method,
  CASE WHEN account_number IS NOT NULL THEN '****' || RIGHT(account_number, 4) ELSE NULL END AS account_number_masked,
  bank_name,
  bank_country,
  crypto_type,
  network,
  status,
  created_at,
  updated_at
FROM public.transfers;

-- 7. RLS Policies for user_roles
CREATE POLICY "Admins can manage user_roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. RLS Policies for transfers (admin only on base table)
CREATE POLICY "Admins can manage transfers"
  ON public.transfers FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- No direct public SELECT on transfers base table
-- Public access goes through transfers_public view

-- 9. RLS Policies for transfer_timeline_events
CREATE POLICY "Admins can manage timeline events"
  ON public.transfer_timeline_events FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Public can read timeline events for transfers they can access via public_id
CREATE POLICY "Public can view timeline events"
  ON public.transfer_timeline_events FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.transfers t
      WHERE t.id = transfer_id
    )
  );

-- 10. Update trigger for transfers.updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_transfers_updated_at
  BEFORE UPDATE ON public.transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
