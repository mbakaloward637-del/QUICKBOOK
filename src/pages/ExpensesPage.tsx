import React, { useEffect, useState } from 'react';
import { DollarSign, Plus, AlertCircle, CreditCard as Edit2, Trash2, MoreVertical } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCompany } from '../context/CompanyContext';
import { Expense } from '../lib/types';
import { Sidebar } from '../components/Sidebar';

export const ExpensesPage: React.FC = () => {
  const { currentCompany } = useCompany();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!currentCompany) return;
    loadExpenses();
  }, [currentCompany]);

  const loadExpenses = async () => {
    if (!currentCompany) return;
    try {
      const { data, error: err } = await supabase
        .from('expenses')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('expense_date', { ascending: false });

      if (err) throw err;
      setExpenses(data || []);
    } catch (err) {
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter((exp) => {
    if (filter === 'all') return true;
    return exp.status === filter;
  });

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.draft;
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Expenses</h1>
              <p className="text-slate-600 mt-2">Track and manage expenses</p>
            </div>
            <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition">
              <Plus className="w-5 h-5" />
              Record Expense
            </button>
          </div>

          <div className="mb-6 flex gap-2">
            {['all', 'draft', 'submitted', 'approved'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg transition capitalize ${
                  filter === status
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {status === 'all' ? 'All Expenses' : status}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-slate-600">Loading...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No expenses yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Expense #
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Amount
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
                  {filteredExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-slate-200 hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {expense.expense_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {currentCompany?.currency}{' '}
                        {expense.amount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColor(expense.status)}`}>
                          {expense.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button className="p-2 hover:bg-slate-100 rounded transition">
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </button>
                          <button className="p-2 hover:bg-slate-100 rounded transition">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                          <button className="p-2 hover:bg-slate-100 rounded transition">
                            <MoreVertical className="w-4 h-4 text-slate-600" />
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
