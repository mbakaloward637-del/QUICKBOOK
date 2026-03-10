/*
  # Chart of Accounts & Account Management

  1. New Tables
    - `account_types` - Asset, Liability, Equity, Revenue, Expense
    - `accounts` - Individual GL accounts with hierarchical structure
    - `account_balances` - Running balances for quick access

  2. Features
    - Hierarchical account structure (parent-child relationships)
    - Account types for proper financial categorization
    - Running balances for performance
    - Status tracking (active/inactive)

  3. Security
    - Enable RLS restricted to company data
    - Users can only view accounts for their companies
*/

CREATE TABLE IF NOT EXISTS account_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  account_code text NOT NULL,
  account_name text NOT NULL,
  account_type_id uuid NOT NULL REFERENCES account_types(id),
  parent_account_id uuid REFERENCES accounts(id),
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, account_code)
);

CREATE TABLE IF NOT EXISTS account_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  balance numeric(15,2) DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company accounts"
  ON accounts FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = accounts.company_id AND (companies.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.company_id = companies.id AND user_roles.user_id = auth.uid()
    ))
  ));

CREATE POLICY "Users can insert accounts for own companies"
  ON accounts FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = accounts.company_id AND companies.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update accounts in own companies"
  ON accounts FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = accounts.company_id AND companies.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = accounts.company_id AND companies.owner_id = auth.uid()
  ));

CREATE POLICY "Users can view account balances"
  ON account_balances FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM accounts WHERE accounts.id = account_balances.account_id AND EXISTS (
      SELECT 1 FROM companies WHERE companies.id = accounts.company_id AND (companies.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_roles WHERE user_roles.company_id = companies.id AND user_roles.user_id = auth.uid()
      ))
    )
  ));

CREATE INDEX idx_accounts_company ON accounts(company_id);
CREATE INDEX idx_accounts_type ON accounts(account_type_id);
CREATE INDEX idx_accounts_parent ON accounts(parent_account_id);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_account_balances_account ON account_balances(account_id);

INSERT INTO account_types (name, description) VALUES
('Assets', 'Resources owned by the company'),
('Liabilities', 'Obligations of the company'),
('Equity', 'Owner equity and retained earnings'),
('Revenue', 'Income from sales and services'),
('Expenses', 'Costs of operations');
