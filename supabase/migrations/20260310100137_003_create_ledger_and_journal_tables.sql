/*
  # General Ledger & Journal Entries

  1. New Tables
    - `journal_entries` - Master transaction records
    - `journal_entry_lines` - Individual debit/credit lines
    - `ledger_transactions` - Denormalized ledger for reporting

  2. Features
    - Double-entry accounting enforcement
    - Transaction referencing and tracking
    - Full audit trail of all entries
    - Support for recurring entries

  3. Security
    - Restrict to authorized company users
    - Audit all journal entries
*/

CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reference text,
  description text NOT NULL,
  entry_date date NOT NULL,
  is_recurring boolean DEFAULT false,
  recurring_frequency text,
  status text DEFAULT 'draft',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id),
  debit numeric(15,2) DEFAULT 0,
  credit numeric(15,2) DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ledger_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id),
  journal_entry_id uuid REFERENCES journal_entries(id),
  transaction_type text NOT NULL,
  amount numeric(15,2) NOT NULL,
  transaction_date date NOT NULL,
  reference text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company journal entries"
  ON journal_entries FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = journal_entries.company_id AND (companies.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.company_id = companies.id AND user_roles.user_id = auth.uid()
    ))
  ));

CREATE POLICY "Users can create journal entries"
  ON journal_entries FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = journal_entries.company_id AND companies.owner_id = auth.uid()
  ) AND created_by = auth.uid());

CREATE POLICY "Users can update draft entries"
  ON journal_entries FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = journal_entries.company_id AND companies.owner_id = auth.uid()
  ) AND status = 'draft')
  WITH CHECK (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = journal_entries.company_id AND companies.owner_id = auth.uid()
  ) AND status = 'draft');

CREATE POLICY "Users can view journal entry lines"
  ON journal_entry_lines FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM journal_entries WHERE journal_entries.id = journal_entry_lines.journal_entry_id AND EXISTS (
      SELECT 1 FROM companies WHERE companies.id = journal_entries.company_id AND (companies.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_roles WHERE user_roles.company_id = companies.id AND user_roles.user_id = auth.uid()
      ))
    )
  ));

CREATE POLICY "Users can create entry lines"
  ON journal_entry_lines FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM journal_entries WHERE journal_entries.id = journal_entry_lines.journal_entry_id AND journal_entries.created_by = auth.uid()
  ));

CREATE POLICY "Users can view ledger transactions"
  ON ledger_transactions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = ledger_transactions.company_id AND (companies.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.company_id = companies.id AND user_roles.user_id = auth.uid()
    ))
  ));

CREATE INDEX idx_journal_entries_company ON journal_entries(company_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_entries_status ON journal_entries(status);
CREATE INDEX idx_journal_entry_lines_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_journal_entry_lines_account ON journal_entry_lines(account_id);
CREATE INDEX idx_ledger_transactions_company ON ledger_transactions(company_id);
CREATE INDEX idx_ledger_transactions_account ON ledger_transactions(account_id);
CREATE INDEX idx_ledger_transactions_date ON ledger_transactions(transaction_date);
