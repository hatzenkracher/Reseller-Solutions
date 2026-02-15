-- ============================================
-- Supabase Setup SQL
-- ============================================
-- Run this in your Supabase SQL Editor
-- This creates all tables, RLS policies, and storage buckets

-- ============================================
-- 1. TABLES
-- ============================================

-- Devices table (main inventory)
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Device info
  model TEXT NOT NULL,
  storage TEXT NOT NULL,
  color TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('NEW', 'USED', 'DEFECT')),
  status TEXT NOT NULL CHECK (status IN ('STOCK', 'REPAIR', 'SOLD')),
  imei TEXT UNIQUE,
  
  -- Dates
  purchase_date TIMESTAMPTZ NOT NULL,
  repair_date TIMESTAMPTZ,
  sale_date TIMESTAMPTZ,
  shipping_buy_date TIMESTAMPTZ,
  shipping_sell_date TIMESTAMPTZ,
  
  -- Costs
  purchase_price NUMERIC(10,2) NOT NULL,
  repair_cost NUMERIC(10,2) DEFAULT 0,
  shipping_buy NUMERIC(10,2) DEFAULT 0,
  shipping_sell NUMERIC(10,2) DEFAULT 0,
  
  -- Sales
  sale_price NUMERIC(10,2),
  buyer_name TEXT, -- Deprecated but kept for compatibility
  sales_fees NUMERIC(10,2) DEFAULT 0,
  platform_order_number TEXT,
  sale_invoice_number TEXT,
  
  -- Seller info (NEW)
  seller_name TEXT,
  
  -- Tax
  is_diff_tax BOOLEAN DEFAULT true,
  
  -- Defects
  defects TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company profiles (one per user)
CREATE TABLE IF NOT EXISTS company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Company info
  company_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  street TEXT NOT NULL,
  house_number TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT DEFAULT 'Deutschland',
  
  -- Tax info
  vat_id TEXT,
  tax_id TEXT,
  
  -- Contact
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Logo
  logo_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Device files metadata (tracks uploaded files)
CREATE TABLE IF NOT EXISTS device_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- File info
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Full storage path
  file_size BIGINT NOT NULL, -- Size in bytes
  file_type TEXT, -- MIME type
  category TEXT, -- PAYPAL, INVOICE, CHAT, EIGENBELEG, OTHER
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_devices_owner ON devices(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_purchase_date ON devices(purchase_date);
CREATE INDEX IF NOT EXISTS idx_device_files_device ON device_files(device_id);
CREATE INDEX IF NOT EXISTS idx_device_files_owner ON device_files(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_user ON company_profiles(user_id);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_files ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: devices
-- ============================================

-- Users can view only their own devices
CREATE POLICY "Users can view own devices"
  ON devices
  FOR SELECT
  USING (auth.uid() = owner_user_id);

-- Users can insert their own devices
CREATE POLICY "Users can insert own devices"
  ON devices
  FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

-- Users can update their own devices
CREATE POLICY "Users can update own devices"
  ON devices
  FOR UPDATE
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Users can delete their own devices
CREATE POLICY "Users can delete own devices"
  ON devices
  FOR DELETE
  USING (auth.uid() = owner_user_id);

-- ============================================
-- RLS POLICIES: company_profiles
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON company_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON company_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON company_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON company_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: device_files
-- ============================================

-- Users can view files for their own devices
CREATE POLICY "Users can view own device files"
  ON device_files
  FOR SELECT
  USING (auth.uid() = owner_user_id);

-- Users can insert files for their own devices
CREATE POLICY "Users can insert own device files"
  ON device_files
  FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

-- Users can delete their own device files
CREATE POLICY "Users can delete own device files"
  ON device_files
  FOR DELETE
  USING (auth.uid() = owner_user_id);

-- ============================================
-- 4. FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_profiles_updated_at
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. STORAGE BUCKETS
-- ============================================

-- Create storage bucket for device files
-- Run this in the Supabase Dashboard > Storage or via SQL:

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('device-files', 'device-files', false);

-- Note: Storage policies must be created in the Supabase Dashboard
-- or via the Supabase Management API. The policies should be:

-- Policy: Users can upload to their own folder
-- Operation: INSERT
-- Target: device-files
-- Definition: 
--   bucket_id = 'device-files' 
--   AND (storage.foldername(name))[1] = auth.uid()::text

-- Policy: Users can read from their own folder
-- Operation: SELECT
-- Target: device-files
-- Definition:
--   bucket_id = 'device-files'
--   AND (storage.foldername(name))[1] = auth.uid()::text

-- Policy: Users can update their own files
-- Operation: UPDATE
-- Target: device-files
-- Definition:
--   bucket_id = 'device-files'
--   AND (storage.foldername(name))[1] = auth.uid()::text

-- Policy: Users can delete their own files
-- Operation: DELETE
-- Target: device-files
-- Definition:
--   bucket_id = 'device-files'
--   AND (storage.foldername(name))[1] = auth.uid()::text

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Create storage bucket 'device-files' in Dashboard
-- 3. Add storage policies as described above
-- 4. Copy your Supabase credentials to .env.local
