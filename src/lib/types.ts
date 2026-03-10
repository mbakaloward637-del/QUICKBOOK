export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  registration_number: string | null;
  tax_number: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  currency: string;
  status: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  company_id: string;
  account_code: string;
  account_name: string;
  account_type_id: string;
  parent_account_id: string | null;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  tax_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  credit_limit: number;
  current_balance: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  company_id: string;
  customer_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  paid_amount: number;
  status: string;
  notes: string | null;
  terms: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
  created_at: string;
}

export interface Expense {
  id: string;
  company_id: string;
  vendor_id: string | null;
  category_id: string;
  expense_number: string;
  amount: number;
  tax_amount: number;
  payment_method: string | null;
  status: string;
  expense_date: string;
  due_date: string | null;
  description: string | null;
  reference: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  company_id: string;
  reference: string | null;
  description: string;
  entry_date: string;
  is_recurring: boolean;
  recurring_frequency: string | null;
  status: string;
  created_by: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  company_id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  account_type: string | null;
  currency: string;
  balance: number;
  status: string;
  created_at: string;
  updated_at: string;
}
