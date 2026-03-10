/*
  # Authentication & Company Management Setup

  1. New Tables
    - `roles` - User roles (Admin, Manager, Accountant, Viewer)
    - `companies` - Business entities
    - `company_settings` - Company configuration
    - `user_roles` - User to role mapping
    - `audit_logs` - Track all system changes

  2. Security
    - Enable RLS on all tables
    - Policies restrict data access by company
    - Track user actions in audit logs

  3. Key Features
    - Multi-company support
    - Role-based access control
    - Comprehensive audit trail
*/

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  registration_number text,
  tax_number text,
  email text,
  phone text,
  address text,
  currency text DEFAULT 'USD',
  status text DEFAULT 'active',
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  timezone text DEFAULT 'UTC',
  financial_year_start integer DEFAULT 1,
  invoice_prefix text DEFAULT 'INV',
  expense_prefix text DEFAULT 'EXP',
  po_prefix text DEFAULT 'PO',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, company_id, role_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  module text NOT NULL,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own companies"
  ON companies FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.company_id = companies.id AND user_roles.user_id = auth.uid()
  ));

CREATE POLICY "Users can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can view company settings"
  ON company_settings FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = company_settings.company_id AND (companies.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.company_id = companies.id AND user_roles.user_id = auth.uid()
    ))
  ));

CREATE POLICY "Users can view own user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM companies WHERE companies.id = user_roles.company_id AND companies.owner_id = auth.uid()
  ));

CREATE POLICY "Users can view audit logs of their companies"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = audit_logs.company_id AND (companies.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.company_id = companies.id AND user_roles.user_id = auth.uid()
    ))
  ));

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_companies_owner ON companies(owner_id);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_company_settings_company ON company_settings(company_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_company ON user_roles(company_id);
CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
