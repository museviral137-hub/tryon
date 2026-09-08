-- ====================================================================
-- VestiAI Database Migration: Payment Orders & Idempotent Fulfillment
-- File: 20260830000001_payments.sql
-- ====================================================================

-- 1. PAYMENT_ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    package_id VARCHAR(50) NOT NULL,
    credits INTEGER NOT NULL CHECK (credits > 0),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded')) DEFAULT 'pending',
    provider VARCHAR(50) NOT NULL DEFAULT 'razorpay',
    provider_order_id TEXT,
    provider_payment_id TEXT,
    provider_signature TEXT,
    idempotency_key TEXT UNIQUE,
    error_message TEXT,
    notes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_payment_orders_shop ON public.payment_orders(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON public.payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_provider_order ON public.payment_orders(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON public.payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_idempotency ON public.payment_orders(idempotency_key);

-- 3. TRIGGER FOR UPDATED_AT
DROP TRIGGER IF EXISTS tr_payment_orders_updated ON public.payment_orders;
CREATE TRIGGER tr_payment_orders_updated
    BEFORE UPDATE ON public.payment_orders
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. ATOMIC & IDEMPOTENT ORDER FULFILLMENT PROCEDURE
-- This stored procedure is called by Edge Functions or verified webhooks.
-- Guarantees that even if called multiple times, credits are granted EXACTLY ONCE.
CREATE OR REPLACE FUNCTION public.fulfill_payment_order(
    p_order_id UUID,
    p_provider_payment_id TEXT DEFAULT NULL,
    p_provider_signature TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_balance RECORD;
    v_tx_id UUID;
BEGIN
    -- 1. Select and lock the payment order
    SELECT * INTO v_order FROM public.payment_orders WHERE id = p_order_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'PAYMENT_ORDER_NOT_FOUND';
    END IF;

    -- 2. Idempotency Check: If already paid, return success immediately without adding credits again
    IF v_order.status = 'paid' THEN
        SELECT * INTO v_balance FROM public.ai_credit_accounts WHERE shop_id = v_order.shop_id;
        RETURN jsonb_build_object(
            'success', true,
            'already_fulfilled', true,
            'order_id', v_order.id,
            'status', 'paid',
            'credits_added', v_order.credits,
            'remaining_credits', COALESCE(v_balance.remaining_credits, 0),
            'total_credits', COALESCE(v_balance.total_credits, 0)
        );
    END IF;

    -- 3. Update payment order status to 'paid'
    UPDATE public.payment_orders
    SET
        status = 'paid',
        provider_payment_id = COALESCE(p_provider_payment_id, provider_payment_id),
        provider_signature = COALESCE(p_provider_signature, provider_signature),
        updated_at = now()
    WHERE id = p_order_id;

    -- 4. Lock and update the shop AI credit account
    SELECT * INTO v_balance FROM public.ai_credit_accounts WHERE shop_id = v_order.shop_id FOR UPDATE;

    IF NOT FOUND THEN
        -- Auto provision credit account if missing
        INSERT INTO public.ai_credit_accounts (shop_id, total_credits, remaining_credits, used_credits)
        VALUES (v_order.shop_id, v_order.credits, v_order.credits, 0)
        RETURNING * INTO v_balance;
    ELSE
        UPDATE public.ai_credit_accounts
        SET
            total_credits = total_credits + v_order.credits,
            remaining_credits = remaining_credits + v_order.credits,
            updated_at = now()
        WHERE shop_id = v_order.shop_id
        RETURNING * INTO v_balance;
    END IF;

    -- 5. Insert immutable record in ai_credit_transactions ledger
    INSERT INTO public.ai_credit_transactions (
        shop_id,
        amount,
        type,
        description
    )
    VALUES (
        v_order.shop_id,
        v_order.credits,
        'top_up',
        format('Purchased %s AI Credits (%s %s) - Order #%s', v_order.credits, v_order.currency, v_order.amount, SUBSTRING(v_order.id::text, 1, 8))
    )
    RETURNING id INTO v_tx_id;

    RETURN jsonb_build_object(
        'success', true,
        'already_fulfilled', false,
        'order_id', v_order.id,
        'status', 'paid',
        'credits_added', v_order.credits,
        'transaction_id', v_tx_id,
        'remaining_credits', v_balance.remaining_credits,
        'total_credits', v_balance.total_credits
    );
END;
$$;

-- 5. MARK PAYMENT ORDER FAILED PROCEDURE
CREATE OR REPLACE FUNCTION public.mark_payment_order_failed(
    p_order_id UUID,
    p_error_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.payment_orders
    SET
        status = 'failed',
        error_message = COALESCE(p_error_message, 'Payment processing failed or was declined.'),
        updated_at = now()
    WHERE id = p_order_id AND status != 'paid';

    RETURN jsonb_build_object('success', true, 'status', 'failed');
END;
$$;

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view payment orders belonging to their authenticated shop
CREATE POLICY "Users can view payment orders of their shop" ON public.payment_orders
    FOR SELECT TO authenticated USING (shop_id = public.get_auth_shop_id());

-- Policy: Authenticated users can insert a new pending order for their shop
CREATE POLICY "Users can create payment orders for their shop" ON public.payment_orders
    FOR INSERT TO authenticated WITH CHECK (
        shop_id = public.get_auth_shop_id() 
        AND user_id = auth.uid()
    );

-- Policy: Users can update pending orders of their shop (e.g. store provider_order_id)
CREATE POLICY "Users can update pending payment orders of their shop" ON public.payment_orders
    FOR UPDATE TO authenticated 
    USING (shop_id = public.get_auth_shop_id() AND status IN ('pending', 'processing'))
    WITH CHECK (shop_id = public.get_auth_shop_id());
