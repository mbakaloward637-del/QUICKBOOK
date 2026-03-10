/*
  # Invoicing System

  1. New Tables
    - `invoices` - Master invoice records
    - `invoice_items` - Line items on invoices
    - `invoice_payments` - Payment tracking per invoice
    - `products` - Product/service catalog

  2. Features
    - Full invoice lifecycle management
    - Automatic numbering
    - Payment allocation
    - Tax calculation
    - Status tracking (draft, sent, paid, overdue, cancelled)

  3. Security
    - Restrict to company
    - Track who created/modified invoices
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sku text UNIQUE,
  price numeric(15,2) NOT NULL,
  tax_rate numeric(5,2) DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id),
  invoice_number text NOT NULL,
  invoice_date date NOT NULL,
  due_date date NOT NULL,
  subtotal numeric(15,2) DEFAULT 0,
  tax_amount numeric(15,2) DEFAULT 0,
  total numeric(15,2) DEFAULT 0,
  paid_amount numeric(15,2) DEFAULT 0,
  status text DEFAULT 'draft',
  notes text,
  terms text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL,
  unit_price numeric(15,2) NOT NULL,
  tax_rate numeric(5,2) DEFAULT 0,
  line_total numeric(15,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount numeric(15,2) NOT NULL,
  payment_date date NOT NULL,
  payment_method text NOT NULL,
  reference text,
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company products"
  ON products FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = products.company_id AND (companies.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.company_id = companies.id AND user_roles.user_id = auth.uid()
    ))
  ));

CREATE POLICY "Users can create products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = products.company_id AND companies.owner_id = auth.uid()
  ));

CREATE POLICY "Users can view company invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = invoices.company_id AND (companies.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.company_id = companies.id AND user_roles.user_id = auth.uid()
    ))
  ));

CREATE POLICY "Users can create invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = invoices.company_id AND companies.owner_id = auth.uid()
  ) AND created_by = auth.uid());

CREATE POLICY "Users can update draft invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = invoices.company_id AND companies.owner_id = auth.uid()
  ) AND status = 'draft')
  WITH CHECK (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = invoices.company_id AND companies.owner_id = auth.uid()
  ) AND status = 'draft');

CREATE POLICY "Users can view invoice items"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND EXISTS (
      SELECT 1 FROM companies WHERE companies.id = invoices.company_id AND (companies.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_roles WHERE user_roles.company_id = companies.id AND user_roles.user_id = auth.uid()
      ))
    )
  ));

CREATE POLICY "Users can view invoice payments"
  ON invoice_payments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM invoices WHERE invoices.id = invoice_payments.invoice_id AND EXISTS (
      SELECT 1 FROM companies WHERE companies.id = invoices.company_id AND (companies.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_roles WHERE user_roles.company_id = companies.id AND user_roles.user_id = auth.uid()
      ))
    )
  ));

CREATE POLICY "Users can record invoice payments"
  ON invoice_payments FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM invoices WHERE invoices.id = invoice_payments.invoice_id AND EXISTS (
      SELECT 1 FROM companies WHERE companies.id = invoices.company_id AND companies.owner_id = auth.uid()
    )
  ) AND created_by = auth.uid());

CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_date ON invoice_payments(payment_date);
