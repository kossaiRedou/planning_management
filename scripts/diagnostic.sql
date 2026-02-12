-- =====================================================
-- Script de diagnostic pour Secu-Planning
-- =====================================================
-- Exécutez ce script dans Supabase SQL Editor pour diagnostiquer les problèmes

-- 1. Vérifier les utilisateurs dans Auth
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 2. Vérifier les profils utilisateurs
SELECT 
    up.id,
    up.first_name,
    up.last_name,
    up.role,
    up.organization_id,
    au.email,
    up.created_at
FROM user_profiles up
LEFT JOIN auth.users au ON au.id = up.id
ORDER BY up.created_at DESC
LIMIT 5;

-- 3. Vérifier les organisations
SELECT 
    id,
    name,
    email,
    subscription_status,
    subscription_plan,
    stripe_customer_id,
    stripe_subscription_id,
    trial_ends_at,
    created_at
FROM organizations
ORDER BY created_at DESC
LIMIT 5;

-- 4. Trouver les utilisateurs Auth SANS profil (PROBLÈME !)
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created_at,
    'PROFIL MANQUANT ⚠️' as status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ORDER BY au.created_at DESC;

-- 5. Vérifier les policies RLS sur user_profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_profiles';

-- 6. Vérifier les policies RLS sur organizations
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'organizations';

-- 7. Compter les entités par organisation
SELECT 
    o.name as organization_name,
    COUNT(DISTINCT up.id) as nombre_utilisateurs,
    COUNT(DISTINCT s.id) as nombre_sites,
    COUNT(DISTINCT sh.id) as nombre_shifts,
    o.subscription_plan,
    o.subscription_status
FROM organizations o
LEFT JOIN user_profiles up ON up.organization_id = o.id
LEFT JOIN sites s ON s.organization_id = o.id
LEFT JOIN shifts sh ON sh.organization_id = o.id
GROUP BY o.id, o.name, o.subscription_plan, o.subscription_status
ORDER BY o.created_at DESC;
