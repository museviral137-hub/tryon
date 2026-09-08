-- ====================================================================
-- VestiAI Database Migration: Production Security & Supabase Integrity Hardening
-- File: 20260831000001_security_hardening.sql
-- ====================================================================

-- 1. FUNCTION PRIVILEGE REVOCATION (LEAST PRIVILEGE)
-- The browser/client MUST NOT be able to invoke credit-modifying RPCs.
-- These procedures are strictly reserved for server-side Edge Functions running
-- with the trusted 'service_role'.

REVOKE EXECUTE ON FUNCTION public.deduct_shop_ai_credit(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_shop_ai_credit(UUID, UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION public.refund_shop_ai_credit(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_shop_ai_credit(UUID, UUID, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.top_up_shop_ai_credit(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.top_up_shop_ai_credit(UUID, INTEGER) TO service_role;

REVOKE EXECUTE ON FUNCTION public.fulfill_payment_order(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_payment_order(UUID, TEXT, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.mark_payment_order_failed(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_payment_order_failed(UUID, TEXT) TO service_role;

-- 2. HARDEN DEDUCT_SHOP_AI_CREDIT (IDEMPOTENT & STRICT CONCURRENCY LOCKING)
CREATE OR REPLACE FUNCTION public.deduct_shop_ai_credit(p_shop_id UUID, p_try_on_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_balance RECORD;
    v_existing_tx RECORD;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Idempotency check: If this try_on_result_id was already deducted, do not deduct again
    IF p_try_on_id IS NOT NULL THEN
        SELECT * INTO v_existing_tx 
        FROM public.ai_credit_transactions
        WHERE try_on_result_id = p_try_on_id AND type = 'deduction' AND shop_id = p_shop_id
        LIMIT 1;

        IF FOUND THEN
            SELECT * INTO v_balance FROM public.ai_credit_accounts WHERE shop_id = p_shop_id;
            RETURN jsonb_build_object(
                'success', true,
                'idempotent', true,
                'remaining_credits', v_balance.remaining_credits,
                'used_credits', v_balance.used_credits
            );
        END IF;
    END IF;

    -- Lock the credit account row strictly to prevent race conditions
    SELECT * INTO v_balance
    FROM public.ai_credit_accounts
    WHERE shop_id = p_shop_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SHOP_CREDIT_ACCOUNT_NOT_FOUND';
    END IF;

    -- Verify sufficient credits; negative balances are strictly forbidden
    IF v_balance.remaining_credits < 1 THEN
        RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
    END IF;

    -- Reset daily try_ons counter if a new day has started
    IF v_balance.last_reset_date < v_today THEN
        v_balance.try_ons_today := 0;
    END IF;

    -- Execute atomic deduction
    UPDATE public.ai_credit_accounts
    SET
        remaining_credits = remaining_credits - 1,
        used_credits = used_credits + 1,
        try_ons_today = v_balance.try_ons_today + 1,
        last_reset_date = v_today,
        updated_at = now()
    WHERE shop_id = p_shop_id;

    -- Record immutable transaction in ledger
    INSERT INTO public.ai_credit_transactions (
        shop_id,
        try_on_result_id,
        amount,
        type,
        description
    ) VALUES (
        p_shop_id,
        p_try_on_id,
        -1,
        'deduction',
        format('AI Try-On Fitting Deduction (%s)', COALESCE(p_try_on_id::text, 'Direct'))
    );

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'remaining_credits', v_balance.remaining_credits - 1,
        'used_credits', v_balance.used_credits + 1
    );
END;
$$;

-- 3. HARDEN REFUND_SHOP_AI_CREDIT (NO DUPLICATES & REQUIRES PRIOR DEDUCTION)
CREATE OR REPLACE FUNCTION public.refund_shop_ai_credit(
    p_shop_id UUID, 
    p_try_on_id UUID, 
    p_reason TEXT DEFAULT 'Try-on processing failure refund'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_balance RECORD;
    v_deduction_tx RECORD;
    v_existing_refund RECORD;
BEGIN
    -- Verify that a deduction actually occurred for this try_on_result_id
    IF p_try_on_id IS NOT NULL THEN
        SELECT * INTO v_deduction_tx 
        FROM public.ai_credit_transactions
        WHERE try_on_result_id = p_try_on_id AND type = 'deduction' AND shop_id = p_shop_id
        LIMIT 1;

        IF NOT FOUND THEN
            -- No deduction ever happened for this try_on_id; do not grant unearned credit
            RETURN jsonb_build_object(
                'success', false,
                'error', 'NO_PRIOR_DEDUCTION_FOUND',
                'message', 'Refund rejected: no deduction was recorded for this try-on.'
            );
        END IF;

        -- Verify that a refund has not ALREADY been processed for this try_on_result_id
        SELECT * INTO v_existing_refund
        FROM public.ai_credit_transactions
        WHERE try_on_result_id = p_try_on_id AND type = 'refund' AND shop_id = p_shop_id
        LIMIT 1;

        IF FOUND THEN
            -- Already refunded; return current balance idempotently without granting a second credit
            SELECT * INTO v_balance FROM public.ai_credit_accounts WHERE shop_id = p_shop_id;
            RETURN jsonb_build_object(
                'success', true,
                'already_refunded', true,
                'remaining_credits', v_balance.remaining_credits,
                'used_credits', v_balance.used_credits
            );
        END IF;
    END IF;

    -- Lock credit account for update
    SELECT * INTO v_balance
    FROM public.ai_credit_accounts
    WHERE shop_id = p_shop_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SHOP_CREDIT_ACCOUNT_NOT_FOUND';
    END IF;

    -- Atomic credit restoration
    UPDATE public.ai_credit_accounts
    SET
        remaining_credits = remaining_credits + 1,
        used_credits = GREATEST(0, used_credits - 1),
        try_ons_today = GREATEST(0, try_ons_today - 1),
        updated_at = now()
    WHERE shop_id = p_shop_id;

    -- Record immutable transaction in ledger
    INSERT INTO public.ai_credit_transactions (
        shop_id,
        try_on_result_id,
        amount,
        type,
        description
    ) VALUES (
        p_shop_id,
        p_try_on_id,
        1,
        'refund',
        p_reason
    );

    RETURN jsonb_build_object(
        'success', true,
        'already_refunded', false,
        'remaining_credits', v_balance.remaining_credits + 1,
        'used_credits', GREATEST(0, v_balance.used_credits - 1)
    );
END;
$$;

-- 4. UNIQUE PARTIAL INDEX TO MATHEMATICALLY PREVENT DUPLICATE DEDUCTIONS/REFUNDS
CREATE UNIQUE INDEX IF NOT EXISTS uq_credit_tx_tryon_deduction 
    ON public.ai_credit_transactions (try_on_result_id) 
    WHERE try_on_result_id IS NOT NULL AND type = 'deduction';

CREATE UNIQUE INDEX IF NOT EXISTS uq_credit_tx_tryon_refund 
    ON public.ai_credit_transactions (try_on_result_id) 
    WHERE try_on_result_id IS NOT NULL AND type = 'refund';

-- 5. HARDEN PAYMENT_ORDERS RLS POLICIES
-- Authenticated users MUST NOT be able to update status to 'paid', change amount, or alter credits.
DROP POLICY IF EXISTS "Users can update pending payment orders of their shop" ON public.payment_orders;

CREATE POLICY "Users can update pending payment orders of their shop" ON public.payment_orders
    FOR UPDATE TO authenticated 
    USING (
        shop_id = public.get_auth_shop_id() 
        AND status IN ('pending', 'processing')
    )
    WITH CHECK (
        shop_id = public.get_auth_shop_id()
        AND status IN ('pending', 'cancelled') -- Users may cancel their order, but NEVER mark it 'paid'
    );

-- 6. SAFE SHOP INITIALIZATION RPC
-- Securely bootstraps a shop for newly authenticated users if trigger was skipped
CREATE OR REPLACE FUNCTION public.ensure_user_shop(
    p_shop_name TEXT DEFAULT NULL,
    p_owner_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_existing_shop_id UUID;
    v_new_shop_id UUID;
    v_name TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED';
    END IF;

    -- Check if user already belongs to a shop
    SELECT shop_id INTO v_existing_shop_id
    FROM public.shop_members
    WHERE user_id = v_user_id
    LIMIT 1;

    IF v_existing_shop_id IS NOT NULL THEN
        RETURN v_existing_shop_id;
    END IF;

    -- Resolve boutique name
    v_name := COALESCE(NULLIF(TRIM(p_shop_name), ''), 'My Boutique');

    -- Create shop
    INSERT INTO public.shops (name)
    VALUES (v_name)
    RETURNING id INTO v_new_shop_id;

    -- Assign user as owner
    INSERT INTO public.shop_members (shop_id, user_id, role, name)
    VALUES (
        v_new_shop_id,
        v_user_id,
        'owner',
        COALESCE(NULLIF(TRIM(p_owner_name), ''), 'Shop Owner')
    );

    -- Initialize shop settings
    INSERT INTO public.shop_settings (shop_id, product_prefix, customer_prefix, currency_symbol, is_onboarded)
    VALUES (v_new_shop_id, 'J', 'C', '₹', false)
    ON CONFLICT (shop_id) DO NOTHING;

    -- Initialize standard starter trial credits (3 credits)
    INSERT INTO public.ai_credit_accounts (shop_id, total_credits, remaining_credits, used_credits)
    VALUES (v_new_shop_id, 3, 3, 0)
    ON CONFLICT (shop_id) DO NOTHING;

    INSERT INTO public.ai_credit_transactions (shop_id, amount, type, description)
    VALUES (v_new_shop_id, 3, 'grant', 'Welcome boutique trial credits')
    ON CONFLICT DO NOTHING;

    RETURN v_new_shop_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_user_shop(TEXT, TEXT) TO authenticated;
