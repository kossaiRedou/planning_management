-- =====================================================
-- SUPABASE DATABASE SCHEMA FOR SAAS MULTI-TENANT
-- Execute this in Supabase SQL Editor
-- =====================================================

-- Table des organisations (agences de sécurité)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  logo_url TEXT,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'trialing', -- active, past_due, canceled, trialing
  subscription_plan VARCHAR(50) DEFAULT 'standard', -- standard, premium
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extension des users Supabase
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'agent')),
  phone VARCHAR(50),
  certifications TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sites clients
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  contact_name VARCHAR(100),
  contact_phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shifts (missions)
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notes TEXT,
  is_night BOOLEAN DEFAULT FALSE,
  is_sunday BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, completed, canceled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disponibilités des agents
CREATE TABLE availabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, date)
);

-- Index pour performance
CREATE INDEX idx_shifts_org_date ON shifts(organization_id, date);
CREATE INDEX idx_shifts_agent ON shifts(agent_id);
CREATE INDEX idx_availabilities_agent_date ON availabilities(agent_id, date);
CREATE INDEX idx_user_profiles_org ON user_profiles(organization_id);
CREATE INDEX idx_sites_org ON sites(organization_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES POUR USER_PROFILES
-- =====================================================

-- Users can view profiles in their org
CREATE POLICY "Users can view profiles in their org"
  ON user_profiles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

-- Admins can insert profiles in their org
CREATE POLICY "Admins can insert profiles in their org"
  ON user_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND organization_id = user_profiles.organization_id
      AND role IN ('owner', 'admin')
    )
  );

-- Admins can delete profiles in their org
CREATE POLICY "Admins can delete profiles in their org"
  ON user_profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND organization_id = user_profiles.organization_id
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- POLICIES POUR ORGANIZATIONS
-- =====================================================

-- Users can view their own organization
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Owners can update their organization
CREATE POLICY "Owners can update their organization"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND organization_id = organizations.id
      AND role = 'owner'
    )
  );

-- =====================================================
-- POLICIES POUR SITES
-- =====================================================

-- Users can view sites in their org
CREATE POLICY "Users can view sites in their org"
  ON sites FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Admins can manage sites in their org
CREATE POLICY "Admins can insert sites in their org"
  ON sites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND organization_id = sites.organization_id
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update sites in their org"
  ON sites FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND organization_id = sites.organization_id
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete sites in their org"
  ON sites FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND organization_id = sites.organization_id
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- POLICIES POUR SHIFTS
-- =====================================================

-- Users can view shifts in their org (agents see only their shifts, admins see all)
CREATE POLICY "Users can view shifts in their org"
  ON shifts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
    AND (
      -- Agents voient uniquement leurs shifts
      agent_id = auth.uid()
      OR
      -- Admins voient tous les shifts
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND organization_id = shifts.organization_id
        AND role IN ('owner', 'admin')
      )
    )
  );

-- Admins can manage shifts in their org
CREATE POLICY "Admins can insert shifts in their org"
  ON shifts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND organization_id = shifts.organization_id
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update shifts in their org"
  ON shifts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND organization_id = shifts.organization_id
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete shifts in their org"
  ON shifts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND organization_id = shifts.organization_id
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- POLICIES POUR AVAILABILITIES
-- =====================================================

-- Agents can manage their own availability
CREATE POLICY "Agents can view own availability"
  ON availabilities FOR SELECT
  USING (
    agent_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND organization_id = availabilities.organization_id
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Agents can insert own availability"
  ON availabilities FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update own availability"
  ON availabilities FOR UPDATE
  USING (agent_id = auth.uid());

CREATE POLICY "Agents can delete own availability"
  ON availabilities FOR DELETE
  USING (agent_id = auth.uid());

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_availabilities_updated_at BEFORE UPDATE ON availabilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
