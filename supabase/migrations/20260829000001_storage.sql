-- ====================================================================
-- VESTIAI VIRTUAL TRIAL ROOM - SUPABASE STORAGE POLICIES & BUCKETS
-- Migration: 20260829000001_storage.sql
-- Multi-Tenant Isolated Storage with Strict Privacy Configuration
-- Safe for repeated/idempotent execution
-- ====================================================================

-- 1. Configure and verify all 4 Storage Buckets (idempotent with ON CONFLICT)
-- Customer Photos: PRIVATE (Personal in-store customer portraits)
-- Garment Images: PUBLIC (Catalog clothing assets)
-- Shop Assets: PUBLIC (Store logos & branding)
-- Try-On Results: PRIVATE (Confidential AI fitting renders)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('customer-photos', 'customer-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('garment-images', 'garment-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('shop-assets', 'shop-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
    ('tryon-results', 'tryon-results', false, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Drop legacy / un-namespaced storage policies if present
DROP POLICY IF EXISTS "Public read access for try-on results" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can select customer photos from their shop" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload customer photos to their shop" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete customer photos from their shop" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update customer photos from their shop" ON storage.objects;

DROP POLICY IF EXISTS "Public read access for garment images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload garment images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update garment images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete garment images" ON storage.objects;

DROP POLICY IF EXISTS "Public read access for shop assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload shop assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update shop assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete shop assets" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can view try-on results" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload try-on results" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update try-on results" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete try-on results" ON storage.objects;

-- ====================================================================
-- 3. STORAGE RLS: CUSTOMER PHOTOS (PRIVATE - Shop-isolated access only)
-- ====================================================================

DROP POLICY IF EXISTS "vestiai_customer_photos_select" ON storage.objects;
CREATE POLICY "vestiai_customer_photos_select"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'customer-photos' 
    AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text
);

DROP POLICY IF EXISTS "vestiai_customer_photos_insert" ON storage.objects;
CREATE POLICY "vestiai_customer_photos_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'customer-photos' 
    AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text
);

DROP POLICY IF EXISTS "vestiai_customer_photos_update" ON storage.objects;
CREATE POLICY "vestiai_customer_photos_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'customer-photos' 
    AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text
)
WITH CHECK (
    bucket_id = 'customer-photos' 
    AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text
);

DROP POLICY IF EXISTS "vestiai_customer_photos_delete" ON storage.objects;
CREATE POLICY "vestiai_customer_photos_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'customer-photos' 
    AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text
);

-- ====================================================================
-- 4. STORAGE RLS: GARMENT IMAGES (PUBLIC READ - Shop-isolated upload/management)
-- ====================================================================

DROP POLICY IF EXISTS "vestiai_garment_images_public_select" ON storage.objects;
CREATE POLICY "vestiai_garment_images_public_select"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'garment-images');

DROP POLICY IF EXISTS "vestiai_garment_images_insert" ON storage.objects;
CREATE POLICY "vestiai_garment_images_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'garment-images' 
    AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text
);

DROP POLICY IF EXISTS "vestiai_garment_images_update" ON storage.objects;
CREATE POLICY "vestiai_garment_images_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'garment-images' 
    AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text
)
WITH CHECK (
    bucket_id = 'garment-images' 
    AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text
);

DROP POLICY IF EXISTS "vestiai_garment_images_delete" ON storage.objects;
CREATE POLICY "vestiai_garment_images_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'garment-images' 
    AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text
);

-- ====================================================================
-- 5. STORAGE RLS: SHOP ASSETS (PUBLIC READ - Shop-isolated upload/management)
-- ====================================================================

DROP POLICY IF EXISTS "vestiai_shop_assets_public_select" ON storage.objects;
CREATE POLICY "vestiai_shop_assets_public_select"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'shop-assets');

DROP POLICY IF EXISTS "vestiai_shop_assets_insert" ON storage.objects;
CREATE POLICY "vestiai_shop_assets_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'shop-assets' 
    AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text
);

DROP POLICY IF EXISTS "vestiai_shop_assets_update" ON storage.objects;
CREATE POLICY "vestiai_shop_assets_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'shop-assets' 
    AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text
)
WITH CHECK (
    bucket_id = 'shop-assets' 
    AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text
);

DROP POLICY IF EXISTS "vestiai_shop_assets_delete" ON storage.objects;
CREATE POLICY "vestiai_shop_assets_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'shop-assets' 
    AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text
);

-- ====================================================================
-- 6. STORAGE RLS: TRY-ON RESULTS (PRIVATE - Shop-isolated access only)
-- ====================================================================

DROP POLICY IF EXISTS "vestiai_tryon_results_select" ON storage.objects;
CREATE POLICY "vestiai_tryon_results_select"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'tryon-results' 
    AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text
);

DROP POLICY IF EXISTS "vestiai_tryon_results_insert" ON storage.objects;
CREATE POLICY "vestiai_tryon_results_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'tryon-results' 
    AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text
);

DROP POLICY IF EXISTS "vestiai_tryon_results_update" ON storage.objects;
CREATE POLICY "vestiai_tryon_results_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'tryon-results' 
    AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text
)
WITH CHECK (
    bucket_id = 'tryon-results' 
    AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text
);

DROP POLICY IF EXISTS "vestiai_tryon_results_delete" ON storage.objects;
CREATE POLICY "vestiai_tryon_results_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'tryon-results' 
    AND (storage.foldername(name))[1] = public.get_auth_shop_id()::text
);
