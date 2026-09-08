-- ====================================================================
-- VESTIAI VIRTUAL TRIAL ROOM - PRODUCTION SUPABASE DATABASE SCHEMA
-- Multi-Tenant Boutique Architecture with Row Level Security (RLS)
-- ====================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. CORE MULTI-TENANT TABLES
-- ====================================================================

-- SHOPS: Represents a registered Boutique / Retail Store
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SHOP_MEMBERS: Associates auth.users with shops and role permissions
CREATE TABLE IF NOT EXISTS public.shop_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('owner', 'admin', 'staff')) DEFAULT 'staff',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_shop_members_user UNIQUE (user_id)
);

-- SHOP_SETTINGS: Boutique SKU formats, currency, watermarks, preferences
CREATE TABLE IF NOT EXISTS public.shop_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL UNIQUE REFERENCES public.shops(id) ON DELETE CASCADE,
    product_prefix VARCHAR(10) NOT NULL DEFAULT 'J',
    customer_prefix VARCHAR(10) NOT NULL DEFAULT 'C',
    product_start_num INTEGER NOT NULL DEFAULT 1,
    customer_start_num INTEGER NOT NULL DEFAULT 1,
    currency_symbol VARCHAR(10) NOT NULL DEFAULT '₹',
    currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    watermark_enabled BOOLEAN NOT NULL DEFAULT true,
    auto_save_history BOOLEAN NOT NULL DEFAULT true,
    theme VARCHAR(20) NOT NULL DEFAULT 'light',
    is_onboarded BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CUSTOMERS: Customer profiles and standing photos for in-store trials
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) NOT NULL, -- e.g. C001, C002
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    image_url TEXT NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('Female', 'Male', 'Unisex')),
    notes TEXT,
    consent_agreed BOOLEAN NOT NULL DEFAULT true,
    try_on_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_customers_shop_code UNIQUE (shop_id, customer_id)
);

-- GARMENTS: Boutique clothing inventory / SKU catalog
CREATE TABLE IF NOT EXISTS public.garments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL, -- e.g. J001, J002
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Sarees', 'Dresses', 'Shirts', 'Kurtas', 'Trousers', 'Lehengas', 'Suits', 'Ethnic Wear', 'Other')),
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    image_url TEXT NOT NULL,
    brand VARCHAR(255),
    size VARCHAR(50) DEFAULT 'Free Size',
    color VARCHAR(50),
    stock_status VARCHAR(30) NOT NULL CHECK (stock_status IN ('Available', 'Low Stock', 'Out of Stock')) DEFAULT 'Available',
    notes TEXT,
    try_on_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_garments_shop_sku UNIQUE (shop_id, product_id)
);

-- TRY_ON_SESSIONS: Active multi-look fitting sessions with a customer
CREATE TABLE IF NOT EXISTS public.try_on_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TRY_ON_RESULTS: Generated AI fitting cards and historical look records
CREATE TABLE IF NOT EXISTS public.try_on_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.try_on_sessions(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    garment_id UUID NOT NULL REFERENCES public.garments(id) ON DELETE CASCADE,
    
    -- Immutable historical snapshots
    customer_name_snapshot VARCHAR(255) NOT NULL,
    customer_id_snapshot VARCHAR(50) NOT NULL,
    customer_photo_url TEXT NOT NULL,
    customer_phone_snapshot VARCHAR(50),
    garment_product_id_snapshot VARCHAR(50) NOT NULL,
    garment_name_snapshot VARCHAR(255) NOT NULL,
    garment_photo_url TEXT NOT NULL,
    garment_price_snapshot NUMERIC(12, 2) NOT NULL,
    garment_category_snapshot VARCHAR(50) NOT NULL,
    
    result_image_url TEXT,
    status VARCHAR(30) NOT NULL CHECK (status IN ('Processing', 'Completed', 'Failed')) DEFAULT 'Processing',
    progress_phase VARCHAR(50) DEFAULT 'preparing',
    job_id VARCHAR(100),
    error_message TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI_CREDIT_ACCOUNTS: Real-time balance and daily usage per boutique
CREATE TABLE IF NOT EXISTS public.ai_credit_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL UNIQUE REFERENCES public.shops(id) ON DELETE CASCADE,
    total_credits INTEGER NOT NULL DEFAULT 100 CHECK (total_credits >= 0),
    used_credits INTEGER NOT NULL DEFAULT 0 CHECK (used_credits >= 0),
    remaining_credits INTEGER NOT NULL DEFAULT 100 CHECK (remaining_credits >= 0),
    try_ons_today INTEGER NOT NULL DEFAULT 0 CHECK (try_ons_today >= 0),
    last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI_CREDIT_TRANSACTIONS: Audit log of all credit deductions, top-ups, and refunds
CREATE TABLE IF NOT EXISTS public.ai_credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    try_on_result_id UUID REFERENCES public.try_on_results(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL, -- e.g. -1 for try-on, +50 for top-up, +1 for refund
    type VARCHAR(30) NOT NULL CHECK (type IN ('deduction', 'refund', 'top_up', 'grant')),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- 3. INDEXES FOR PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_shop_members_shop ON public.shop_members(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_shop_created ON public.customers(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(shop_id, phone);
CREATE INDEX IF NOT EXISTS idx_garments_shop_created ON public.garments(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_garments_category ON public.garments(shop_id, category);
CREATE INDEX IF NOT EXISTS idx_try_on_results_shop ON public.try_on_results(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_try_on_results_customer ON public.try_on_results(customer_id);
CREATE INDEX IF NOT EXISTS idx_try_on_results_garment ON public.try_on_results(garment_id);
CREATE INDEX IF NOT EXISTS idx_try_on_results_job ON public.try_on_results(job_id);
CREATE INDEX IF NOT EXISTS idx_credit_txs_shop ON public.ai_credit_transactions(shop_id, created_at DESC);

-- ====================================================================
-- 4. HELPER FUNCTIONS & PROCEDURES
-- ====================================================================

-- Function to get active user's shop_id from JWT auth.uid()
CREATE OR REPLACE FUNCTION public.get_auth_shop_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Function to get active user's role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS VARCHAR(30)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.shop_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_shops_updated ON public.shops;
CREATE TRIGGER tr_shops_updated BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_shop_settings_updated ON public.shop_settings;
CREATE TRIGGER tr_shop_settings_updated BEFORE UPDATE ON public.shop_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_customers_updated ON public.customers;
CREATE TRIGGER tr_customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_garments_updated ON public.garments;
CREATE TRIGGER tr_garments_updated BEFORE UPDATE ON public.garments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_credit_accounts_updated ON public.ai_credit_accounts;
CREATE TRIGGER tr_credit_accounts_updated BEFORE UPDATE ON public.ai_credit_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto Increment Try-On Count on Customer & Garment when a result completes
CREATE OR REPLACE FUNCTION public.on_try_on_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF (NEW.status = 'Completed' AND (OLD.status IS NULL OR OLD.status != 'Completed')) THEN
        UPDATE public.customers SET try_on_count = try_on_count + 1 WHERE id = NEW.customer_id;
        UPDATE public.garments SET try_on_count = try_on_count + 1 WHERE id = NEW.garment_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_tryon_completed ON public.try_on_results;
CREATE TRIGGER tr_tryon_completed AFTER INSERT OR UPDATE OF status ON public.try_on_results FOR EACH ROW EXECUTE FUNCTION public.on_try_on_completed();

-- Stored Procedure: Atomic AI Credit Deduction
CREATE OR REPLACE FUNCTION public.deduct_shop_ai_credit(p_shop_id UUID, p_try_on_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_balance RECORD;
BEGIN
    -- Select with row-level lock
    SELECT * INTO v_balance FROM public.ai_credit_accounts WHERE shop_id = p_shop_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SHOP_CREDIT_ACCOUNT_NOT_FOUND';
    END IF;

    IF v_balance.remaining_credits < 1 THEN
        RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
    END IF;

    -- Reset daily count if date changed
    IF v_balance.last_reset_date < CURRENT_DATE THEN
        UPDATE public.ai_credit_accounts
        SET
            remaining_credits = remaining_credits - 1,
            used_credits = used_credits + 1,
            try_ons_today = 1,
            last_reset_date = CURRENT_DATE,
            updated_at = now()
        WHERE shop_id = p_shop_id;
    ELSE
        UPDATE public.ai_credit_accounts
        SET
            remaining_credits = remaining_credits - 1,
            used_credits = used_credits + 1,
            try_ons_today = try_ons_today + 1,
            updated_at = now()
        WHERE shop_id = p_shop_id;
    END IF;

    -- Record in transaction ledger
    INSERT INTO public.ai_credit_transactions (shop_id, try_on_result_id, amount, type, description)
    VALUES (p_shop_id, p_try_on_id, -1, 'deduction', 'Virtual try-on generation preview');

    RETURN jsonb_build_object(
        'success', true,
        'remaining_credits', v_balance.remaining_credits - 1,
        'used_credits', v_balance.used_credits + 1
    );
END;
$$;

-- Stored Procedure: Credit Refund on Generation Failure
CREATE OR REPLACE FUNCTION public.refund_shop_ai_credit(p_shop_id UUID, p_try_on_id UUID, p_reason TEXT DEFAULT 'Try-on processing failure refund')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_balance RECORD;
BEGIN
    SELECT * INTO v_balance FROM public.ai_credit_accounts WHERE shop_id = p_shop_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SHOP_CREDIT_ACCOUNT_NOT_FOUND';
    END IF;

    UPDATE public.ai_credit_accounts
    SET
        remaining_credits = remaining_credits + 1,
        used_credits = GREATEST(0, used_credits - 1),
        try_ons_today = GREATEST(0, try_ons_today - 1),
        updated_at = now()
    WHERE shop_id = p_shop_id;

    INSERT INTO public.ai_credit_transactions (shop_id, try_on_result_id, amount, type, description)
    VALUES (p_shop_id, p_try_on_id, 1, 'refund', COALESCE(p_reason, 'Refund for failed try-on'));

    RETURN jsonb_build_object(
        'success', true,
        'remaining_credits', v_balance.remaining_credits + 1
    );
END;
$$;

-- Stored Procedure: Top-Up Shop AI Credits
CREATE OR REPLACE FUNCTION public.top_up_shop_ai_credit(p_shop_id UUID, p_amount INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_balance RECORD;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'INVALID_AMOUNT';
    END IF;

    SELECT * INTO v_balance FROM public.ai_credit_accounts WHERE shop_id = p_shop_id FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.ai_credit_accounts (shop_id, total_credits, remaining_credits, used_credits)
        VALUES (p_shop_id, p_amount, p_amount, 0)
        RETURNING * INTO v_balance;
    ELSE
        UPDATE public.ai_credit_accounts
        SET
            total_credits = total_credits + p_amount,
            remaining_credits = remaining_credits + p_amount,
            updated_at = now()
        WHERE shop_id = p_shop_id
        RETURNING * INTO v_balance;
    END IF;

    INSERT INTO public.ai_credit_transactions (shop_id, amount, type, description)
    VALUES (p_shop_id, p_amount, 'top_up', format('Added %s AI Fitting Room credits', p_amount));

    RETURN jsonb_build_object(
        'success', true,
        'remaining_credits', v_balance.remaining_credits,
        'total_credits', v_balance.total_credits
    );
END;
$$;

-- New User Registration Trigger: Auto-Creates Shop, Member, Settings & Credit Account
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_shop_id UUID;
    v_shop_name TEXT;
    v_owner_name TEXT;
    v_phone TEXT;
BEGIN
    v_shop_name := COALESCE(NEW.raw_user_meta_data->>'shop_name', 'VestiAI Boutique');
    v_owner_name := COALESCE(NEW.raw_user_meta_data->>'owner_name', split_part(NEW.email, '@', 1));
    v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '+91 98765 43210');

    -- 1. Create Shop
    INSERT INTO public.shops (name, owner_name, phone, email)
    VALUES (v_shop_name, v_owner_name, v_phone, NEW.email)
    RETURNING id INTO v_shop_id;

    -- 2. Link Member as Owner
    INSERT INTO public.shop_members (user_id, shop_id, name, role)
    VALUES (NEW.id, v_shop_id, v_owner_name, 'owner');

    -- 3. Seed Default Shop Settings
    INSERT INTO public.shop_settings (shop_id, product_prefix, customer_prefix, currency_symbol, is_onboarded)
    VALUES (v_shop_id, 'J', 'C', '₹', false);

    -- 4. Grant 100 Initial Credits
    INSERT INTO public.ai_credit_accounts (shop_id, total_credits, remaining_credits, used_credits)
    VALUES (v_shop_id, 100, 100, 0);

    INSERT INTO public.ai_credit_transactions (shop_id, amount, type, description)
    VALUES (v_shop_id, 100, 'grant', 'Welcome boutique trial grant (100 free credits)');

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.try_on_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.try_on_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_transactions ENABLE ROW LEVEL SECURITY;

-- SHOPS Policies
CREATE POLICY "Users can view their authorized shop" ON public.shops
    FOR SELECT TO authenticated USING (id = public.get_auth_shop_id());

CREATE POLICY "Shop owners can update their shop" ON public.shops
    FOR UPDATE TO authenticated USING (id = public.get_auth_shop_id() AND public.get_auth_role() IN ('owner', 'admin'));

-- SHOP_MEMBERS Policies
CREATE POLICY "Users can view members of their shop" ON public.shop_members
    FOR SELECT TO authenticated USING (shop_id = public.get_auth_shop_id());

-- SHOP_SETTINGS Policies
CREATE POLICY "Users can view settings of their shop" ON public.shop_settings
    FOR SELECT TO authenticated USING (shop_id = public.get_auth_shop_id());

CREATE POLICY "Users can update settings of their shop" ON public.shop_settings
    FOR UPDATE TO authenticated USING (shop_id = public.get_auth_shop_id()) WITH CHECK (shop_id = public.get_auth_shop_id());

CREATE POLICY "Users can insert settings for their shop" ON public.shop_settings
    FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_auth_shop_id());

-- CUSTOMERS Policies
CREATE POLICY "Users can view customers of their shop" ON public.customers
    FOR SELECT TO authenticated USING (shop_id = public.get_auth_shop_id());

CREATE POLICY "Users can insert customers into their shop" ON public.customers
    FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_auth_shop_id());

CREATE POLICY "Users can update customers of their shop" ON public.customers
    FOR UPDATE TO authenticated USING (shop_id = public.get_auth_shop_id()) WITH CHECK (shop_id = public.get_auth_shop_id());

CREATE POLICY "Users can delete customers of their shop" ON public.customers
    FOR DELETE TO authenticated USING (shop_id = public.get_auth_shop_id());

-- GARMENTS Policies
CREATE POLICY "Users can view garments of their shop" ON public.garments
    FOR SELECT TO authenticated USING (shop_id = public.get_auth_shop_id());

CREATE POLICY "Users can insert garments into their shop" ON public.garments
    FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_auth_shop_id());

CREATE POLICY "Users can update garments of their shop" ON public.garments
    FOR UPDATE TO authenticated USING (shop_id = public.get_auth_shop_id()) WITH CHECK (shop_id = public.get_auth_shop_id());

CREATE POLICY "Users can delete garments of their shop" ON public.garments
    FOR DELETE TO authenticated USING (shop_id = public.get_auth_shop_id());

-- TRY_ON_SESSIONS Policies
CREATE POLICY "Users can view try-on sessions of their shop" ON public.try_on_sessions
    FOR SELECT TO authenticated USING (shop_id = public.get_auth_shop_id());

CREATE POLICY "Users can insert try-on sessions into their shop" ON public.try_on_sessions
    FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_auth_shop_id());

-- TRY_ON_RESULTS Policies
CREATE POLICY "Users can view try-on results of their shop" ON public.try_on_results
    FOR SELECT TO authenticated USING (shop_id = public.get_auth_shop_id());

CREATE POLICY "Users can insert try-on results into their shop" ON public.try_on_results
    FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_auth_shop_id());

CREATE POLICY "Users can update try-on results of their shop" ON public.try_on_results
    FOR UPDATE TO authenticated USING (shop_id = public.get_auth_shop_id()) WITH CHECK (shop_id = public.get_auth_shop_id());

CREATE POLICY "Users can delete try-on results of their shop" ON public.try_on_results
    FOR DELETE TO authenticated USING (shop_id = public.get_auth_shop_id());

-- AI_CREDIT_ACCOUNTS Policies
CREATE POLICY "Users can view credit balance of their shop" ON public.ai_credit_accounts
    FOR SELECT TO authenticated USING (shop_id = public.get_auth_shop_id());

-- AI_CREDIT_TRANSACTIONS Policies
CREATE POLICY "Users can view credit transactions of their shop" ON public.ai_credit_transactions
    FOR SELECT TO authenticated USING (shop_id = public.get_auth_shop_id());

-- ====================================================================
-- 6. SUPABASE STORAGE BUCKETS & STORAGE RLS POLICIES
-- ====================================================================

-- Create Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('customer-photos', 'customer-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('garment-images', 'garment-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('tryon-results', 'tryon-results', true, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('shop-assets', 'shop-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS Policies: Customer Photos (Private, scoped to authenticated shop)
CREATE POLICY "Authenticated users can select customer photos from their shop"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'customer-photos' AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text);

CREATE POLICY "Authenticated users can upload customer photos to their shop"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'customer-photos' AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text);

CREATE POLICY "Authenticated users can delete customer photos from their shop"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'customer-photos' AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text);

-- Storage RLS Policies: Garment Images (Public read, authenticated shop upload)
CREATE POLICY "Public read access for garment images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'garment-images');

CREATE POLICY "Authenticated users can upload garment images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'garment-images' AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text);

-- Storage RLS Policies: Try-On Results (Public read for WhatsApp sharing, authenticated shop upload)
CREATE POLICY "Public read access for try-on results"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'tryon-results');

CREATE POLICY "Authenticated users can upload try-on results"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'tryon-results');

CREATE POLICY "Authenticated users can delete try-on results"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'tryon-results' AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text);
