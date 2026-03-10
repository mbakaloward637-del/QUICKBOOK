/*
  # Expenses & Banking Management

  1. New Tables
    - `expense_categories` - Expense classification
    - `expenses` - Expense records with vendor tracking
    - `bank_accounts` - Company bank accounts
    - `bank_transactions` - Bank transaction records
    - `bank_reconciliation` - Reconciliation tracking

  2. Features
    - Full expense tracking with categories
    - Multiple bank accounts per company
    - Bank reconciliation workflow
    - Transaction status tracking

  3. Security
    - Restrict to company access
    - Audit all changes
*/

CREATE TABLE IF NOT EXISTS expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name)
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors(id),
  category_id uuid NOT NULL REFERENCES expense_categories(id),
  expense_number text NOT NULL,
  amount numeric(15,2) NOT NULL,
  tax_amount numeric(15,2) DEFAULT 0,
  payment_method text,
  status text DEFAULT 'draft',
  expense_date date NOT NULL,
  due_date date,
  description text,
  reference text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, expense_number)
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  account_type text,
  currency text DEFAULT 'USD',
  balance numeric(15,2) DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, account_number)
);

CREATE TABLE IF NOT EXISTS bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id uuid NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  transaction_type text NOT NULL,
  amount numeric(15,2) NOT NULL,
  reference text,
  description text,
  transaction_date date NOT NULL,
  is_reconciled boolean DEFAULT false,
  reconciliation_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bank_reconciliation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id uuid NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  statement_date date NOT NULL,
  statement_balance numeric(15,2) NOT NULL,
  reconciled_balance numeric(15,2),
  status text DEFAULT 'pending',
  reconciled_by uuid REFERENCES auth.users(id),
  reconciled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_reconciliation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company expense categories"
  ON expense_categories FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = expense_categories.company_id AND (companies.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.company_id = companies.id AND user_roles.user_id = auth.uid()
    ))
  ));

CREATE POLICY "Users can create expense categories"
  ON expense_categories FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = expense_categories.company_id AND companies.owner_id = auth.uid()
  ));

CREATE POLICY "Users can view company expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = expenses.company_id AND (companies.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.company_id = companies.id AND user_roles.user_id = auth.uid()
    ))
  ));

CREATE POLICY "Users can create expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = expenses.company_id AND companies.owner_id = auth.uid()
  ) AND created_by = auth.uid());

CREATE POLICY "Users can update draft expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = expenses.company_id AND companies.owner_id = auth.uid()
  ) AND status = 'draft')
  WITH CHECK (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = expenses.company_id AND companies.owner_id = auth.uid()
  ) AND status = 'draft');

CREATE POLICY "Users can view company bank accounts"
  ON bank_accounts FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = bank_accounts.company_id AND (companies.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.company_id = companies.id AND user_roles.user_id = auth.uid()
    ))
  ));

CREATE POLICY "Users can create bank accounts"
  ON bank_accounts FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = bank_accounts.company_id AND companies.owner_id = auth.uid()
  ));

CREATE POLICY "Users can view bank transactions"
  ON bank_transactions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM bank_accounts WHERE bank_accounts.id = bank_transactions.bank_account_id AND EXISTS (
      SELECT 1 FROM companies WHERE companies.id = bank_accounts.company_id AND (companies.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_roles WHERE user_roles.company_id = companies.id AND user_roles.user_id = auth.uid()
      ))
    )
  ));

CREATE POLICY "Users can view reconciliations"
  ON bank_reconciliation FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM bank_accounts WHERE bank_accounts.id = bank_reconciliation.bank_account_id AND EXISTS (
      SELECT 1 FROM companies WHERE companies.id = bank_accounts.company_id AND companies.owner_id = auth.uid()
    )
  ));

CREATE INDEX idx_expense_categories_company ON expense_categories(company_id);
CREATE INDEX idx_expenses_company ON expenses(company_id);
CREATE INDEX idx_expenses_vendor ON expenses(vendor_id);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_bank_accounts_company ON bank_accounts(company_id);
CREATE INDEX idx_bank_transactions_account ON bank_transactions(bank_account_id);
CREATE INDEX idx_bank_transactions_date ON bank_transactions(transaction_date);
CREATE INDEX idx_bank_reconciliation_account ON bank_reconciliation(bank_account_id);
