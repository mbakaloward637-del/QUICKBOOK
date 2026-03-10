/*
  # Customer & Vendor Management

  1. New Tables
    - `customers` - Customer profiles with credit tracking
    - `customer_contacts` - Customer contact information
    - `vendors` - Vendor/supplier profiles
    - `vendor_contacts` - Vendor contact information

  2. Features
    - Track customer credit limits and balances
    - Store multiple contacts per customer/vendor
    - Tax number tracking for compliance
    - Status tracking

  3. Security
    - Restrict access by company
*/

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  tax_number text,
  address text,
  city text,
  state text,
  postal_code text,
  country text,
  credit_limit numeric(15,2) DEFAULT 0,
  current_balance numeric(15,2) DEFAULT 0,
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  contact_name text NOT NULL,
  email text,
  phone text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  city text,
  state text,
  postal_code text,
  country text,
  tax_number text,
  current_balance numeric(15,2) DEFAULT 0,
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  contact_name text NOT NULL,
  email text,
  phone text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company customers"
  ON customers FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = customers.company_id AND (companies.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.company_id = companies.id AND user_roles.user_id = auth.uid()
    ))
  ));

CREATE POLICY "Users can create customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = customers.company_id AND companies.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = customers.company_id AND companies.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = customers.company_id AND companies.owner_id = auth.uid()
  ));

CREATE POLICY "Users can view customer contacts"
  ON customer_contacts FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM customers WHERE customers.id = customer_contacts.customer_id AND EXISTS (
      SELECT 1 FROM companies WHERE companies.id = customers.company_id AND (companies.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_roles WHERE user_roles.company_id = companies.id AND user_roles.user_id = auth.uid()
      ))
    )
  ));

CREATE POLICY "Users can view company vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = vendors.company_id AND (companies.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.company_id = companies.id AND user_roles.user_id = auth.uid()
    ))
  ));

CREATE POLICY "Users can create vendors"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = vendors.company_id AND companies.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update vendors"
  ON vendors FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = vendors.company_id AND companies.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM companies WHERE companies.id = vendors.company_id AND companies.owner_id = auth.uid()
  ));

CREATE POLICY "Users can view vendor contacts"
  ON vendor_contacts FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_contacts.vendor_id AND EXISTS (
      SELECT 1 FROM companies WHERE companies.id = vendors.company_id AND (companies.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_roles WHERE user_roles.company_id = companies.id AND user_roles.user_id = auth.uid()
      ))
    )
  ));

CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customer_contacts_customer ON customer_contacts(customer_id);
CREATE INDEX idx_vendors_company ON vendors(company_id);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendor_contacts_vendor ON vendor_contacts(vendor_id);
