-- =====================================================
-- SCRIPT D'INITIALISATION MANUELLE D'UNE ORGANISATION
-- À exécuter dans Supabase SQL Editor
-- =====================================================

-- INSTRUCTIONS :
-- 1. Remplacez 'votre-user-id' par votre vrai User ID (voir ci-dessous comment le trouver)
-- 2. Remplacez les informations de l'organisation par les vôtres
-- 3. Exécutez ce script dans Supabase SQL Editor

-- =====================================================
-- ÉTAPE 1 : Trouver votre User ID
-- =====================================================
-- Aller dans Supabase → Authentication → Users
-- Copier l'UUID de votre utilisateur (colonne "ID")
-- Exemple: 12345678-1234-1234-1234-123456789abc

-- =====================================================
-- ÉTAPE 2 : Créer l'organisation
-- =====================================================

INSERT INTO organizations (
  name,
  email,
  phone,
  address,
  subscription_status,
  subscription_plan,
  trial_ends_at
) VALUES (
  'Mon Agence de Sécurité',  -- Remplacer par le nom de votre agence
  'contact@mon-agence.fr',    -- Remplacer par l'email de votre agence
  '01 23 45 67 89',           -- Remplacer par votre téléphone
  '12 Rue Example, 75000 Paris', -- Remplacer par votre adresse
  'active',                   -- Statut actif
  'premium',                  -- Plan premium (ou 'standard')
  NOW() + INTERVAL '14 days' -- 14 jours d'essai
)
RETURNING id;

-- ⚠️ COPIER L'ID DE L'ORGANISATION RETOURNÉ CI-DESSUS

-- =====================================================
-- ÉTAPE 3 : Créer votre profil utilisateur
-- =====================================================

-- Remplacer :
-- - 'votre-user-id' par l'ID copié depuis Authentication → Users
-- - 'votre-organization-id' par l'ID retourné à l'étape 2

INSERT INTO user_profiles (
  id,                    -- ⚠️ REMPLACER par votre User ID
  organization_id,       -- ⚠️ REMPLACER par l'Organization ID de l'étape 2
  first_name,
  last_name,
  role
) VALUES (
  'votre-user-id',              -- ⚠️ À REMPLACER
  'votre-organization-id',      -- ⚠️ À REMPLACER
  'Votre',                      -- Remplacer par votre prénom
  'Nom',                        -- Remplacer par votre nom
  'owner'                       -- Rôle owner pour avoir tous les droits
);

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
-- Après exécution, vous pourrez vous connecter avec :
-- - Email : celui utilisé lors de l'inscription Stripe
-- - Mot de passe : celui créé lors de l'inscription
-- =====================================================
