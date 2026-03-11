import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  AlertCircle,
  Eye,
  Trash2,
  Send,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCompany } from '../context/CompanyContext';
import { Invoice, Customer } from '../lib/types';
import { Sidebar } from '../components/Sidebar';

export const InvoicesPage: React.FC = () => {
  const { currentCompany } = useCompany();
  const [invoices, setInvoices] = useState<(Invoice & { customer_name?: string })[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<(Invoice & { customer_name?: string }) | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    subtotal: 0,
    tax_amount: 0,
    total: 0,
    notes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentCompany) return;
    loadInvoices();
    loadCustomers();
  }, [currentCompany]);

  const loadInvoices = async () => {
    if (!currentCompany) return;
    try {
      const { data, error: err } = await supabase
        .from('invoices')
        .select(
          `
          *,
          customers (name)
        `
        )
        .eq('company_id', currentCompany.id)
        .order('invoice_date', { ascending: false });

      if (err) throw err;
      const invoicesWithNames = (data || []).map((inv: any) => ({
        ...inv,
        customer_name: inv.customers?.name,
      }));
      setInvoices(invoicesWithNames);
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    if (!currentCompany) return;
    try {
      const { data, error: err } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('status', 'active');

      if (err) throw err;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;

    try {
      setError('');
      const invoiceNumber = `INV-${Date.now()}`;

      const { error: err } = await supabase
        .from('invoices')
        .insert([
          {
            ...formData,
            company_id: currentCompany.id,
            invoice_number: invoiceNumber,
            status: 'draft',
            created_by: (await supabase.auth.getUser()).data.user?.id,
          },
        ]);

      if (err) throw err;
      setFormData({
        customer_id: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        subtotal: 0,
        tax_amount: 0,
        total: 0,
        notes: '',
      });
      setShowForm(false);
      loadInvoices();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create invoice'
      );
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error: err } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', id);

      if (err) throw err;
      loadInvoices();
    } catch (err) {
      console.error('Error updating invoice:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;

    try {
      const { error: err } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (err) throw err;
      loadInvoices();
    } catch (err) {
      console.error('Error deleting invoice:', err);
    }
  };

  const filteredInvoices =
    filter === 'all'
      ? invoices
      : invoices.filter((inv) => inv.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
              <p className="text-slate-600 mt-2">
                Manage customer invoices and track payments
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              New Invoice
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {showForm && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">
                New Invoice
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Customer *
                    </label>
                    <select
                      required
                      value={formData.customer_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customer_id: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a customer</option>
                      {customers.map((cust) => (
                        <option key={cust.id} value={cust.id}>
                          {cust.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Invoice Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.invoice_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          invoice_date: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.due_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          due_date: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Subtotal *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.subtotal}
                      onChange={(e) => {
                        const subtotal = parseFloat(e.target.value);
                        setFormData({
                          ...formData,
                          subtotal,
                          total: subtotal + formData.tax_amount,
                        });
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tax Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.tax_amount}
                      onChange={(e) => {
                        const taxAmount = parseFloat(e.target.value);
                        setFormData({
                          ...formData,
                          tax_amount: taxAmount,
                          total: formData.subtotal + taxAmount,
                        });
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Total
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      disabled
                      value={formData.total}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                  >
                    Save Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-4 py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="mb-6 flex gap-2">
            {['all', 'draft', 'sent', 'paid', 'overdue'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-slate-600">Loading...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No invoices yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-slate-200 hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {invoice.customer_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(invoice.invoice_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-slate-900">
                        {invoice.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            invoice.status
                          )}`}
                        >
                          {invoice.status.charAt(0).toUpperCase() +
                            invoice.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedInvoice(invoice)}
                            className="p-2 hover:bg-slate-100 rounded transition"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                          {invoice.status === 'draft' && (
                            <button
                              onClick={() =>
                                handleStatusChange(invoice.id, 'sent')
                              }
                              className="p-2 hover:bg-slate-100 rounded transition"
                            >
                              <Send className="w-4 h-4 text-green-600" />
                            </button>
                          )}
                          {invoice.status === 'sent' && (
                            <button
                              onClick={() =>
                                handleStatusChange(invoice.id, 'paid')
                              }
                              className="p-2 hover:bg-slate-100 rounded transition"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            className="p-2 hover:bg-slate-100 rounded transition"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
