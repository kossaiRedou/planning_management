-- ==================================================
-- INDEX DE PERFORMANCE POUR DAOU
-- ==================================================
-- Exécuter ces commandes dans Supabase SQL Editor
-- pour améliorer significativement les performances
-- ==================================================

-- 1. Index pour les requêtes de shifts (planning)
-- Utilisé très fréquemment dans admin-planning et agent-planning
CREATE INDEX IF NOT EXISTS idx_shifts_agent_date 
ON shifts(agent_id, date);

CREATE INDEX IF NOT EXISTS idx_shifts_organization_date 
ON shifts(organization_id, date);

CREATE INDEX IF NOT EXISTS idx_shifts_site 
ON shifts(site_id);

CREATE INDEX IF NOT EXISTS idx_shifts_status 
ON shifts(status) WHERE status = 'scheduled';

-- 2. Index pour les user_profiles
-- Utilisé pour lister les agents et vérifier les rôles
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_role 
ON user_profiles(organization_id, role);

CREATE INDEX IF NOT EXISTS idx_user_profiles_org 
ON user_profiles(organization_id);

-- 3. Index pour les availabilities
-- Utilisé pour vérifier les disponibilités des agents
CREATE INDEX IF NOT EXISTS idx_availabilities_agent_date 
ON availabilities(agent_id, date);

CREATE INDEX IF NOT EXISTS idx_availabilities_org_date 
ON availabilities(organization_id, date);

-- 4. Index pour les sites
CREATE INDEX IF NOT EXISTS idx_sites_organization 
ON sites(organization_id);

-- 5. Index composites pour les jointures fréquentes
CREATE INDEX IF NOT EXISTS idx_shifts_agent_org_date 
ON shifts(agent_id, organization_id, date);

-- 6. Index pour les recherches par email (RLS policies)
CREATE INDEX IF NOT EXISTS idx_organizations_email 
ON organizations(email);

-- ==================================================
-- STATISTIQUES ET ANALYSE
-- ==================================================

-- Mettre à jour les statistiques PostgreSQL pour l'optimiseur
ANALYZE shifts;
ANALYZE user_profiles;
ANALYZE availabilities;
ANALYZE sites;
ANALYZE organizations;

-- ==================================================
-- VÉRIFICATION DES INDEX
-- ==================================================

-- Pour vérifier que les index ont été créés :
SELECT 
    tablename,
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    schemaname = 'public'
    AND tablename IN ('shifts', 'user_profiles', 'availabilities', 'sites', 'organizations')
ORDER BY 
    tablename, indexname;

-- ==================================================
-- MAINTENANCE (À EXÉCUTER PÉRIODIQUEMENT)
-- ==================================================

-- Nettoyer et optimiser les tables (optionnel, à faire hors heures de pointe)
-- VACUUM ANALYZE shifts;
-- VACUUM ANALYZE user_profiles;
-- VACUUM ANALYZE availabilities;

-- ==================================================
-- PERFORMANCES ATTENDUES
-- ==================================================
-- Avant : Requêtes de planning 200-500ms
-- Après : Requêtes de planning 50-150ms
-- Gain : 60-70% de réduction du temps de requête
-- ==================================================
